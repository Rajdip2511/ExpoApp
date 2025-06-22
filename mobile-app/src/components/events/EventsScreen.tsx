import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Pressable, Dimensions } from 'react-native';
import { 
  Appbar, 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  FAB, 
  Text, 
  Avatar, 
  Chip,
  Badge,
  Surface,
  ActivityIndicator,
  Snackbar
} from 'react-native-paper';
import { useQuery, useMutation } from '@apollo/client';
import { GET_EVENTS, JOIN_EVENT, LEAVE_EVENT } from '../../graphql/queries';
import { useAuthStore } from '../../stores/authStore';
import { io, Socket } from 'socket.io-client';

const { width } = Dimensions.get('window');

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

interface EventCardProps {
  event: Event;
  onJoin: (eventId: string) => void;
  onLeave: (eventId: string) => void;
  onPress: (eventId: string) => void;
  currentUserId: string;
  isJoining?: boolean;
  isLeaving?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onJoin, 
  onLeave, 
  onPress,
  currentUserId, 
  isJoining = false, 
  isLeaving = false 
}) => {
  const isAttending = event.attendees.some(attendee => attendee.id === currentUserId);
  const startDate = new Date(event.startTime).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short', 
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
    
    if (now < eventStart) return 'upcoming';
    if (eventEnd && now > eventEnd) return 'ended';
    return 'live';
  };

  const status = getEventStatus();

  return (
    <Card style={[styles.eventCard, isAttending && styles.attendingCard]} elevation={3}>
      <Pressable onPress={() => onPress(event.id)} style={styles.cardPressable}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Title numberOfLines={2} style={styles.eventTitle}>{event.name}</Title>
              {status === 'live' && (
                <Badge style={styles.liveBadge} size={20}>LIVE</Badge>
              )}
              {isAttending && (
                <Chip icon="check-circle" style={styles.attendingChip} compact>
                  Attending
                </Chip>
              )}
            </View>
          </View>

          {event.description && (
            <Paragraph numberOfLines={2} style={styles.description}>
              {event.description}
            </Paragraph>
          )}
          
          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText} numberOfLines={1}>{event.location}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailText}>{startDate} at {startTime}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>👥</Text>
              <Text style={styles.detailText}>
                {event.attendees.length} {event.attendees.length === 1 ? 'person' : 'people'} attending
              </Text>
            </View>
          </View>

          <View style={styles.attendeesSection}>
            <Text style={styles.attendeesTitle}>Recent Attendees:</Text>
            <View style={styles.avatarContainer}>
              {event.attendees.slice(0, 4).map((attendee, index) => (
                <Avatar.Image
                  key={attendee.id}
                  size={32}
                  source={{ 
                    uri: attendee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(attendee.name)}&background=random`
                  }}
                  style={[styles.attendeeAvatar, { marginLeft: index > 0 ? -8 : 0 }]}
                />
              ))}
              {event.attendees.length > 4 && (
                <Surface style={styles.moreAvatars} elevation={1}>
                  <Text style={styles.moreAvatarsText}>+{event.attendees.length - 4}</Text>
                </Surface>
              )}
            </View>
          </View>

          <Text style={styles.tapHint}>👆 Tap to view full details and join event room</Text>
        </Card.Content>
      </Pressable>
      
      <Card.Actions style={styles.cardActions}>
        <View style={styles.actionButtons}>
          {isAttending ? (
            <Button 
              mode="outlined" 
              onPress={() => onLeave(event.id)}
              loading={isLeaving}
              disabled={isLeaving}
              style={styles.leaveButton}
              icon="exit-to-app"
            >
              {isLeaving ? 'Leaving...' : 'Leave'}
            </Button>
          ) : (
            <Button 
              mode="contained" 
              onPress={() => onJoin(event.id)}
              loading={isJoining}
              disabled={isJoining}
              style={styles.joinButton}
              icon="account-plus"
            >
              {isJoining ? 'Joining...' : 'Join Event'}
            </Button>
          )}
          
          <Button
            mode="text"
            onPress={() => onPress(event.id)}
            style={styles.detailsButton}
            icon="arrow-right"
          >
            Details
          </Button>
        </View>
      </Card.Actions>
    </Card>
  );
};

interface EventsScreenProps {
  onNavigateToEventDetail: (eventId: string) => void;
  onNavigateToCreateEvent: () => void;
}

export const EventsScreen: React.FC<EventsScreenProps> = ({
  onNavigateToEventDetail,
  onNavigateToCreateEvent
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loadingStates, setLoadingStates] = useState<{[key: string]: { joining: boolean; leaving: boolean }}>({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const { user, logout, token, isAuthenticated, isLoading } = useAuthStore();
  
  const { data, loading, error, refetch } = useQuery(GET_EVENTS, {
    fetchPolicy: 'cache-and-network',
    skip: !isAuthenticated || !user || isLoading, // Skip query if not authenticated or still loading
    onError: (error) => {
      console.error('GET_EVENTS error:', error);
      console.log('Current token:', token);
      console.log('Current user:', user);
      console.log('Is authenticated:', isAuthenticated);
    },
  });

  // Show loading while auth is loading
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading authentication...</Text>
      </View>
    );
  }

  // Prevent rendering if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Please login to continue...</Text>
      </View>
    );
  }

  const [joinEventMutation] = useMutation(JOIN_EVENT, {
    onCompleted: (data) => {
      refetch();
      showSnackbar(`Successfully joined ${data.joinEvent.name}! 🎉`);
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

  // Socket.io setup with enhanced real-time features
  useEffect(() => {
    if (!token) return;

    const newSocket = io('http://localhost:4000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🟢 Connected to real-time server');
    });

    newSocket.on('user-joined-event', (data) => {
      console.log('👥 User joined event:', data);
      refetch();
      if (data.user && data.eventId) {
        showSnackbar(`${data.user.name} joined an event!`);
      }
    });

    newSocket.on('user-left-event', (data) => {
      console.log('👋 User left event:', data);
      refetch();
    });

    newSocket.on('event-updated', (data) => {
      console.log('📊 Event updated:', data);
      refetch();
    });

    newSocket.on('disconnect', () => {
      console.log('🔴 Disconnected from real-time server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, refetch]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], joining: true }
    }));

    try {
      await joinEventMutation({ variables: { eventId } });
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        [eventId]: { ...prev[eventId], joining: false }
      }));
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], leaving: true }
    }));

    try {
      await leaveEventMutation({ variables: { eventId } });
    } finally {
      setLoadingStates(prev => ({
        ...prev,
        [eventId]: { ...prev[eventId], leaving: false }
      }));
    }
  };

  const handleEventPress = (eventId: string) => {
    onNavigateToEventDetail(eventId);
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <EventCard
      event={item}
      onJoin={handleJoinEvent}
      onLeave={handleLeaveEvent}
      onPress={handleEventPress}
      currentUserId={user?.id || ''}
      isJoining={loadingStates[item.id]?.joining}
      isLeaving={loadingStates[item.id]?.leaving}
    />
  );

  if (loading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading amazing events...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Oops! Something went wrong</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
        <Button mode="contained" onPress={() => refetch()} style={styles.retryButton}>
          Try Again
        </Button>
      </View>
    );
  }

  const connectionStatus = socket?.connected ? 'Connected' : 'Connecting...';
  const connectionIcon = socket?.connected ? '🟢' : '🟡';

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content 
          title="🎉 Live Events" 
          subtitle={`${connectionIcon} ${connectionStatus}`}
          titleStyle={styles.headerTitle}
          subtitleStyle={styles.headerSubtitle}
        />
        <Appbar.Action 
          icon="account-circle" 
          onPress={() => {}} 
          iconColor="white"
        />
        <Appbar.Action 
          icon="logout" 
          onPress={logout} 
          iconColor="white"
        />
      </Appbar.Header>

      <FlatList
        data={data?.events || []}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#6200ea']}
            tintColor="#6200ea"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Events Yet</Text>
            <Text style={styles.emptyText}>
              Be the first to create an amazing event!
            </Text>
            <Button 
              mode="contained" 
              onPress={onNavigateToCreateEvent}
              style={styles.createFirstButton}
              icon="plus"
            >
              Create First Event
            </Button>
          </View>
        }
        ListHeaderComponent={
          data?.events?.length ? (
            <View style={styles.listHeader}>
              <Text style={styles.eventCount}>
                {data.events.length} {data.events.length === 1 ? 'Event' : 'Events'} Available
              </Text>
            </View>
          ) : null
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={onNavigateToCreateEvent}
        label="Create Event"
        mode="elevated"
      />

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
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  listHeader: {
    marginBottom: 16,
  },
  eventCount: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  eventCard: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  attendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  cardPressable: {
    borderRadius: 12,
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    flex: 1,
  },
  liveBadge: {
    backgroundColor: '#f44336',
    color: 'white',
  },
  attendingChip: {
    backgroundColor: '#e8f5e8',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  eventDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#424242',
    flex: 1,
  },
  attendeesSection: {
    marginBottom: 8,
  },
  attendeesTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeAvatar: {
    borderWidth: 2,
    borderColor: 'white',
  },
  moreAvatars: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  moreAvatarsText: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  tapHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  cardActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  joinButton: {
    flex: 1,
    marginRight: 8,
  },
  leaveButton: {
    flex: 1,
    marginRight: 8,
  },
  detailsButton: {
    minWidth: 80,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstButton: {
    paddingHorizontal: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ea',
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