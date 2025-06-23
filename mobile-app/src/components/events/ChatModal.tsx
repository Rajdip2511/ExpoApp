import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';

interface ChatMessage {
  id: string;
  eventId: string;
  message: string;
  userName: string;
  userId: string;
  timestamp: string;
}

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  socket: any;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  visible,
  onClose,
  eventId,
  eventName,
  socket,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!socket || !visible) return;

    console.log('🔌 ChatModal opened, socket connected:', socket.connected);
    console.log('🏠 Socket rooms:', socket.rooms);
    console.log('🎯 Event ID for chat:', eventId);

    // Check socket connection
    setIsConnected(socket.connected);

    // Test if socket is in the right room
    if (socket.connected) {
      console.log('✅ Socket is connected, ready for chat');
    } else {
      console.log('⚠️ Socket is not connected');
    }

    // Listen for new messages
    const handleNewMessage = (message: ChatMessage) => {
      console.log('📥 Received message:', message);
      setMessages(prev => {
        console.log('💾 Current messages:', prev.length);
        const newMessages = [...prev, message];
        console.log('💾 New messages count:', newMessages.length);
        return newMessages;
      });
      // Auto scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    // Listen for connection status
    const handleConnect = () => {
      console.log('🟢 Socket connected in ChatModal');
      setIsConnected(true);
    };
    const handleDisconnect = () => {
      console.log('🔴 Socket disconnected in ChatModal');
      setIsConnected(false);
    };

    socket.on('new-message', handleNewMessage);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, visible]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !user) {
      return;
    }

    if (!isConnected) {
      Alert.alert('Connection Error', 'Not connected to chat server');
      return;
    }

    // Send message via socket
    console.log('📤 Sending message:', {
      eventId,
      message: newMessage.trim(),
      userName: user.name,
    });
    
    socket.emit('send-message', {
      eventId,
      message: newMessage.trim(),
      userName: user.name,
    });

    setNewMessage('');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (userId: string) => {
    const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={{ flex: 1, backgroundColor: '#fff' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
          backgroundColor: '#F9FAFB',
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
              Event Chat
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>
              {eventName}
            </Text>
          </View>
          
          {/* Connection Status */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 12,
          }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isConnected ? '#10B981' : '#EF4444',
              marginRight: 6,
            }} />
            <Text style={{
              fontSize: 12,
              color: isConnected ? '#10B981' : '#EF4444',
              fontWeight: '500',
            }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>

          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 60,
            }}>
              <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
              <Text style={{ fontSize: 16, color: '#9CA3AF', marginTop: 12, textAlign: 'center' }}>
                No messages yet{'\n'}Start the conversation!
              </Text>
            </View>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.userId === user?.id;
              return (
                <View
                  key={message.id}
                  style={{
                    flexDirection: 'row',
                    marginVertical: 6,
                    alignItems: 'flex-start',
                    justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                  }}
                >
                  {!isOwnMessage && (
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: getAvatarColor(message.userId),
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 8,
                    }}>
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                        {getInitials(message.userName)}
                      </Text>
                    </View>
                  )}
                  
                  <View style={{
                    maxWidth: '75%',
                    backgroundColor: isOwnMessage ? '#8B5CF6' : '#F3F4F6',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 16,
                    borderBottomRightRadius: isOwnMessage ? 4 : 16,
                    borderBottomLeftRadius: isOwnMessage ? 16 : 4,
                  }}>
                    {!isOwnMessage && (
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#6B7280',
                        marginBottom: 2,
                      }}>
                        {message.userName}
                      </Text>
                    )}
                    <Text style={{
                      fontSize: 16,
                      color: isOwnMessage ? 'white' : '#111827',
                      lineHeight: 20,
                    }}>
                      {message.message}
                    </Text>
                    <Text style={{
                      fontSize: 11,
                      color: isOwnMessage ? 'rgba(255,255,255,0.7)' : '#9CA3AF',
                      marginTop: 2,
                      textAlign: 'right',
                    }}>
                      {formatTime(message.timestamp)}
                    </Text>
                  </View>

                  {isOwnMessage && (
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: getAvatarColor(message.userId),
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginLeft: 8,
                    }}>
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                        {getInitials(message.userName)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Message Input */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          backgroundColor: '#F9FAFB',
        }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 16,
              backgroundColor: 'white',
              marginRight: 8,
            }}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
            editable={isConnected}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: (newMessage.trim() && isConnected) ? '#8B5CF6' : '#D1D5DB',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={(newMessage.trim() && isConnected) ? 'white' : '#9CA3AF'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}; 