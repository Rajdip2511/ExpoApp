import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { ApolloProvider } from '@apollo/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apolloClient } from './src/config/apollo';
import { useAuthStore } from './src/stores/authStore';
import { TokenLoginScreen } from './src/components/auth/TokenLoginScreen';
import { EventsScreen } from './src/components/events/EventsScreen';
import { EventDetailScreen } from './src/components/events/EventDetailScreen';
import { CreateEventScreen } from './src/components/events/CreateEventScreen';

// Create React Query client
const queryClient = new QueryClient();

type Screen = 'login' | 'events' | 'eventDetail' | 'createEvent';

interface NavigationState {
  currentScreen: Screen;
  eventId?: string;
}

export default function App() {
  const [navigation, setNavigation] = useState<NavigationState>({
    currentScreen: 'login'
  });
  
  const { isAuthenticated, isLoading, loadAuth } = useAuthStore();

  // Load authentication state on app start and clear old tokens
  useEffect(() => {
    const initAuth = async () => {
      // Force clear any existing authentication to ensure fresh login with new tokens
      const { logout } = useAuthStore.getState();
      await logout();
      await loadAuth();
    };
    initAuth();
  }, [loadAuth]);

  // Navigate to events screen when authenticated
  useEffect(() => {
    if (isAuthenticated && navigation.currentScreen === 'login') {
      setNavigation({ currentScreen: 'events' });
    } else if (!isAuthenticated && navigation.currentScreen !== 'login') {
      setNavigation({ currentScreen: 'login' });
    }
  }, [isAuthenticated, navigation.currentScreen]);

  const navigateTo = (screen: Screen, eventId?: string) => {
    setNavigation({ currentScreen: screen, eventId });
  };

  const renderScreen = () => {
    console.log('App renderScreen - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);
    
    if (isLoading) {
      return (
        <View style={[styles.container, styles.centered]}>
          <Text>Loading...</Text>
        </View>
      );
    }

    if (!isAuthenticated) {
      return <TokenLoginScreen />;
    }

    switch (navigation.currentScreen) {
      case 'events':
        return (
          <EventsScreen 
            onNavigateToEventDetail={(eventId) => navigateTo('eventDetail', eventId)}
            onNavigateToCreateEvent={() => navigateTo('createEvent')}
          />
        );
      
      case 'eventDetail':
        return (
          <EventDetailScreen 
            eventId={navigation.eventId!}
            onGoBack={() => navigateTo('events')}
          />
        );
      
      case 'createEvent':
        return (
          <CreateEventScreen 
            onGoBack={() => navigateTo('events')}
            onEventCreated={() => navigateTo('events')}
          />
        );
      
      default:
        return (
          <EventsScreen 
            onNavigateToEventDetail={(eventId) => navigateTo('eventDetail', eventId)}
            onNavigateToCreateEvent={() => navigateTo('createEvent')}
          />
        );
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ApolloProvider client={apolloClient}>
        <PaperProvider>
          <View style={styles.container}>
            {renderScreen()}
            <StatusBar style="auto" />
          </View>
        </PaperProvider>
      </ApolloProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
