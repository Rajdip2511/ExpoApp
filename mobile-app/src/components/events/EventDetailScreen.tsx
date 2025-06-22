import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import { 
  Appbar, 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Text, 
  Avatar, 
  List,
  ActivityIndicator,
  Chip,
  Surface,
  Badge,
  Divider,
  IconButton,
  Snackbar
} from 'react-native-paper';
import { useQuery, useMutation } from '@apollo/client';
import { GET_EVENT, JOIN_EVENT, LEAVE_EVENT } from '../../graphql/queries';
import { useAuthStore } from '../../stores/authStore';
import { io, Socket } from 'socket.io-client';

const { width } = Dimensions.get('window');

interface EventDetailScreenProps {
  eventId: string;
  onGoBack: () => void;
}

interface Event {
  id: string;
  name: string;
  description?: string;
  location: string;
  startTime: string;
  endTime?: string;
  attendees: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
}

export const EventDetailScreen: React.FC<EventDetailScreenProps> = ({ 
  eventId, 
  onGoBack 
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const { user, token } = useAuthStore();

  const { data, loading, error, refetch } = useQuery(GET_EVENT, {
    variables: { id: eventId },
    fetchPolicy: 'cache-and-network',
  });

  const [joinEventMutation] = useMutation(JOIN_EVENT, {
    onCompleted: (data) => {
      refetch();
      showSnackbar(`Welcome to ${data.joinEvent.name}! 🎉`);
    },
    onError: (error) => {
      console.error('Join event error:', error);
      showSnackbar('Failed to join event. Please try again.');
    },
  });

  const [leaveEventMutation] = useMutation(LEAVE_EVENT, {
    onCompleted: (data) => {
      refetch();
      showSnackbar(`Left ${data.leaveEvent.name}`);
    },
    onError: (error) => {
      console.error('Leave event error:', error);
      showSnackbar('Failed to leave event. Please try again.');
    },
  });

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Enhanced Socket.io setup for real-time updates
  useEffect(() => {
    if (!token) return;

    const newSocket = io('http://localhost:4000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🟢 Connected to event room');
      newSocket.emit('join-event', eventId);
    });

    newSocket.on('event-state', (data) => {
      console.log('📊 Event state received:', data);
      setOnlineCount(data.onlineCount || 0);
    });

    newSocket.on('user-joined-event', (data) => {
      if (data.eventId === eventId) {
        console.log('👥 User joined this event:', data);
        refetch();
        if (data.user && data.user.id !== user?.id) {
          showSnackbar(`${data.user.name} just joined! 👋`);
        }
      }
    });

    newSocket.on('user-left-event', (data) => {
      if (data.eventId === eventId) {
        console.log('👋 User left this event:', data);
        refetch();
      }
    });

    newSocket.on('user-joined-room', (data) => {
      if (data.eventId === eventId) {
        setOnlineCount(data.onlineCount || 0);
        console.log(`👁️ ${data.onlineCount} users viewing this event`);
      }
    });

    newSocket.on('user-left-room', (data) => {
      if (data.eventId === eventId) {
        setOnlineCount(data.onlineCount || 0);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔴 Disconnected from event room');
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave-event', eventId);
      newSocket.close();
    };
  }, [token, eventId, refetch, user?.id]);

  const handleJoinEvent = async () => {
    setIsJoining(true);
    try {
      await joinEventMutation({ variables: { eventId } });
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveEvent = async () => {
    Alert.alert(
      'Leave Event',
      'Are you sure you want to leave this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: async () => {
            setIsLeaving(true);
            try {
              await leaveEventMutation({ variables: { eventId } });
            } finally {
              setIsLeaving(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={onGoBack} iconColor="white" />
          <Appbar.Content title="Loading..." titleStyle={styles.headerTitle} />
        </Appbar.Header>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6200ea" />
          <Text style={styles.loadingText}>Loading event details...</Text>
        </View>
      </View>
    );
  }

  if (error || !data?.event) {
    return (
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={onGoBack} iconColor="white" />
          <Appbar.Content title="Error" titleStyle={styles.headerTitle} />
        </Appbar.Header>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            {error ? 'Failed to load event' : 'Event not found'}
          </Text>
          <Text style={styles.errorSubtext}>
            {error?.message || 'This event may have been deleted or you may not have permission to view it.'}
          </Text>
          <Button mode="contained" onPress={onGoBack} style={styles.backButton}>
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  const event: Event = data.event;
  const isAttending = event.attendees.some(attendee => attendee.id === user?.id);
  
  const startDate = new Date(event.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const startTime = new Date(event.startTime).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const getEventStatus = () => {
    const now = new Date();
    const eventStart = new Date(event.startTime);
    const eventEnd = event.endTime ? new Date(event.endTime) : null;
    
    if (now < eventStart) return { status: 'upcoming', color: '#2196f3', text: 'Upcoming' };
    if (eventEnd && now > eventEnd) return { status: 'ended', color: '#757575', text: 'Ended' };
    return { status: 'live', color: '#f44336', text: 'Live Now' };
  };

  const eventStatus = getEventStatus();
  const connectionStatus = socket?.connected ? 'Live Updates Active' : 'Connecting...';
  const connectionIcon = socket?.connected ? '🟢' : '🟡';

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={onGoBack} iconColor="white" />
        <Appbar.Content 
          title={event.name}
          subtitle={`${connectionIcon} ${connectionStatus}`}
          titleStyle={styles.headerTitle}
          subtitleStyle={styles.headerSubtitle}
        />
        <Appbar.Action 
          icon="share" 
          onPress={() => showSnackbar('Share feature coming soon!')} 
          iconColor="white"
        />
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Status Banner */}
        <Surface style={[styles.statusBanner, { backgroundColor: eventStatus.color }]} elevation={2}>
          <Text style={styles.statusText}>{eventStatus.text}</Text>
          {onlineCount > 0 && (
            <Text style={styles.onlineText}>
              👁️ {onlineCount} viewing now
            </Text>
          )}
        </Surface>

        {/* Main Event Info */}
        <Card style={styles.eventCard} elevation={4}>
          <Card.Content>
            <View style={styles.titleSection}>
              <Title style={styles.eventTitle}>{event.name}</Title>
              {isAttending && (
                <Chip icon="check-circle" style={styles.attendingChip} compact>
                  You're attending
                </Chip>
              )}
            </View>

            {event.description && (
              <Paragraph style={styles.description}>{event.description}</Paragraph>
            )}
            
            <Divider style={styles.divider} />

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>📍</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{event.location}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>📅</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{startDate}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>⏰</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Start Time</Text>
                  <Text style={styles.infoValue}>{startTime}</Text>
                </View>
              </View>

              {event.endTime && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoIcon}>🏁</Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>End Time</Text>
                    <Text style={styles.infoValue}>
                      {new Date(event.endTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </Card.Content>

          <Card.Actions style={styles.actions}>
            {isAttending ? (
              <Button 
                mode="outlined" 
                onPress={handleLeaveEvent}
                loading={isLeaving}
                disabled={isLeaving}
                style={styles.leaveButton}
                icon="exit-to-app"
              >
                {isLeaving ? 'Leaving...' : 'Leave Event'}
              </Button>
            ) : (
              <Button 
                mode="contained" 
                onPress={handleJoinEvent}
                loading={isJoining}
                disabled={isJoining}
                style={styles.joinButton}
                icon="account-plus"
              >
                {isJoining ? 'Joining...' : 'Join Event'}
              </Button>
            )}
          </Card.Actions>
        </Card>

        {/* Attendees Section */}
        <Card style={styles.attendeesCard} elevation={4}>
          <Card.Content>
            <View style={styles.attendeesHeader}>
              <Title style={styles.attendeesTitle}>
                Attendees ({event.attendees.length})
              </Title>
              <Badge style={styles.attendeesBadge}>{event.attendees.length}</Badge>
            </View>
            
            {event.attendees.length > 0 ? (
              <View style={styles.attendeesList}>
                {event.attendees.map((attendee, index) => (
                  <View key={attendee.id} style={styles.attendeeItem}>
                    <Avatar.Image
                      size={48}
                      source={{ 
                        uri: attendee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(attendee.name)}&background=random`
                      }}
                      style={styles.attendeeAvatar}
                    />
                    <View style={styles.attendeeInfo}>
                      <Text style={styles.attendeeName}>{attendee.name}</Text>
                      <Text style={styles.attendeeEmail}>{attendee.email}</Text>
                    </View>
                    {attendee.id === user?.id && (
                      <Chip icon="account" style={styles.youChip} compact>
                        You
                      </Chip>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noAttendees}>
                <Text style={styles.noAttendeesText}>
                  No one has joined yet. Be the first!
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Real-time Status */}
        <Card style={styles.statusCard} elevation={2}>
          <Card.Content>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Real-time Status:</Text>
              <Text style={[styles.statusIndicator, { color: socket?.connected ? '#4caf50' : '#ff9800' }]}>
                {socket?.connected ? '🟢 Connected' : '🟡 Connecting...'}
              </Text>
            </View>
            {onlineCount > 0 && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Currently viewing:</Text>
                <Text style={styles.statusIndicator}>
                  👁️ {onlineCount} {onlineCount === 1 ? 'person' : 'people'}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
        theme={{
          colors: {
            surface: '#4CAF50',
            onSurface: '#FFFFFF',
          }
        }}
      >
        <Text style={styles.snackbarText}>{snackbarMessage}</Text>
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#6200ea',
    elevation: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  statusBanner: {
    padding: 12,
    margin: 16,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  onlineText: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
  },
  eventCard: {
    margin: 16,
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    flex: 1,
  },
  attendingChip: {
    backgroundColor: '#e8f5e8',
  },
  description: {
    fontSize: 16,
    color: '#424242',
    lineHeight: 24,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '500',
  },
  actions: {
    padding: 16,
    paddingTop: 8,
  },
  joinButton: {
    flex: 1,
    paddingVertical: 4,
  },
  leaveButton: {
    flex: 1,
    paddingVertical: 4,
  },
  attendeesCard: {
    margin: 16,
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  attendeesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  attendeesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  attendeesBadge: {
    backgroundColor: '#6200ea',
    color: 'white',
  },
  attendeesList: {
    gap: 12,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  attendeeAvatar: {
    marginRight: 12,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  attendeeEmail: {
    fontSize: 14,
    color: '#666',
  },
  youChip: {
    backgroundColor: '#e3f2fd',
  },
  noAttendees: {
    padding: 20,
    alignItems: 'center',
  },
  noAttendeesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statusCard: {
    margin: 16,
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusIndicator: {
    fontSize: 14,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  backButton: {
    paddingHorizontal: 20,
  },
     snackbar: {
    backgroundColor: '#4CAF50', // Light green background
    borderRadius: 8,
    elevation: 6,
  },
  snackbarText: {
    color: '#FFFFFF', // White text for better contrast
    fontSize: 16,
    fontWeight: '500',
  },
 }); 