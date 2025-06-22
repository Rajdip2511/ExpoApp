import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { 
  Card, 
  Title, 
  Button, 
  Text, 
  ActivityIndicator, 
  Avatar, 
  List,
  Divider,
  Surface,
  Chip
} from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';

interface TokenLoginScreenProps {
  onNavigateToRegister?: () => void;
}

// Static tokens matching backend configuration (FIXED)
const DEMO_USERS = [
  {
    id: 'demo-user-id',
    name: 'Demo User',
    email: 'demo@example.com',
    token: 'demo-token-123',
    avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=6200ea&color=fff',
    role: 'Demo Account'
  },
  {
    id: 'john-user-id', 
    name: 'John Smith',
    email: 'john@example.com',
    token: 'john-token-456',
    avatar: 'https://ui-avatars.com/api/?name=John+Smith&background=1976d2&color=fff',
    role: 'Developer'
  },
  {
    id: 'jane-user-id',
    name: 'Jane Doe', 
    email: 'jane@example.com',
    token: 'jane-token-789',
    avatar: 'https://ui-avatars.com/api/?name=Jane+Doe&background=388e3c&color=fff',
    role: 'Designer'
  },
  {
    id: 'alice-user-id',
    name: 'Alice Johnson',
    email: 'alice@example.com', 
    token: 'alice-token-101',
    avatar: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=f57c00&color=fff',
    role: 'Product Manager'
  },
  {
    id: 'bob-user-id',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    token: 'bob-token-202', 
    avatar: 'https://ui-avatars.com/api/?name=Bob+Wilson&background=7b1fa2&color=fff',
    role: 'QA Engineer'
  }
];

export const TokenLoginScreen: React.FC<TokenLoginScreenProps> = () => {
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);

  const handleLogin = async (user: typeof DEMO_USERS[0]) => {
    setLoading(true);
    setSelectedUser(user.id);
    
    try {
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Login with static token
      await login(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        user.token
      );
      
      Alert.alert(
        'Welcome!', 
        `Logged in as ${user.name}`,
        [{ text: 'Continue', style: 'default' }]
      );
    } catch (error) {
      Alert.alert('Login Error', 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
      setSelectedUser(null);
    }
  };

  const renderUserCard = (user: typeof DEMO_USERS[0]) => {
    const isLoading = loading && selectedUser === user.id;
    
    return (
      <Card key={user.id} style={styles.userCard} mode="outlined">
        <Card.Content>
          <View style={styles.userInfo}>
            <Avatar.Image 
              size={60} 
              source={{ uri: user.avatar }}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Chip 
                icon="account-circle" 
                style={styles.roleChip}
                textStyle={styles.roleText}
                compact
              >
                {user.role}
              </Chip>
            </View>
          </View>
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            onPress={() => handleLogin(user)}
            loading={isLoading}
            disabled={loading}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
          >
            {isLoading ? 'Logging in...' : 'Login as ' + user.name.split(' ')[0]}
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Surface style={styles.headerSurface} elevation={2}>
        <View style={styles.header}>
          <Title style={styles.title}>🎉 Event Check-In</Title>
          <Text style={styles.subtitle}>
            Choose a demo account to get started
          </Text>
        </View>
      </Surface>

      <View style={styles.content}>
        <Card style={styles.infoCard} mode="outlined">
          <Card.Content>
            <Text style={styles.infoTitle}>Demo Authentication</Text>
            <Text style={styles.infoText}>
              This app uses static JWT tokens for demonstration. 
              Select any user below to experience the real-time event features.
            </Text>
          </Card.Content>
        </Card>

        <Text style={styles.sectionTitle}>Available Demo Users</Text>
        
        {DEMO_USERS.map(renderUserCard)}

        <Card style={styles.footerCard} mode="outlined">
          <Card.Content>
            <Text style={styles.footerTitle}>🚀 Features Available</Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>• Browse upcoming events</Text>
              <Text style={styles.featureItem}>• Join events with one tap</Text>
              <Text style={styles.featureItem}>• Real-time attendee updates</Text>
              <Text style={styles.featureItem}>• Live participant counts</Text>
              <Text style={styles.featureItem}>• Create new events</Text>
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerSurface: {
    backgroundColor: '#6200ea',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  infoCard: {
    marginBottom: 24,
    backgroundColor: '#e3f2fd',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
    marginTop: 8,
  },
  userCard: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#f5f5f5',
  },
  roleText: {
    fontSize: 12,
    color: '#666',
  },
  loginButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  loginButtonContent: {
    paddingVertical: 4,
  },
  footerCard: {
    marginTop: 24,
    backgroundColor: '#f3e5f5',
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7b1fa2',
    marginBottom: 12,
  },
  featureList: {
    marginLeft: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 4,
    lineHeight: 20,
  },
}); 