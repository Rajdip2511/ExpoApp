import { gql } from '@apollo/client';

// Authentication Mutations
export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        name
        email
        avatar
      }
      token
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        name
        email
        avatar
      }
      token
    }
  }
`;

// Event Queries
export const GET_EVENTS = gql`
  query GetEvents {
    events {
      id
      name
      location
      startTime
      attendeeCount
      attendees {
        id
        name
        email
        avatar
      }
    }
  }
`;

export const GET_EVENT = gql`
  query GetEvent($id: ID!) {
    event(id: $id) {
      id
      name
      location
      startTime
      attendeeCount
      attendees {
        id
        name
        email
        avatar
      }
    }
  }
`;

export const GET_MY_EVENTS = gql`
  query GetMyEvents {
    myEvents {
      id
      name
      location
      startTime
      attendeeCount
      attendees {
        id
        name
        email
        avatar
      }
    }
  }
`;

// Event Mutations
export const CREATE_EVENT = gql`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      name
      location
      startTime
    }
  }
`;

export const JOIN_EVENT = gql`
  mutation JoinEvent($eventId: ID!) {
    joinEvent(eventId: $eventId) {
      id
      name
      attendeeCount
      attendees {
        id
        name
        email
      }
    }
  }
`;

export const LEAVE_EVENT = gql`
  mutation LeaveEvent($eventId: ID!) {
    leaveEvent(eventId: $eventId) {
      id
      name
      attendeeCount
      attendees {
        id
        name
        email
      }
    }
  }
`;

// User Query
export const GET_ME = gql`
  query GetMe {
    me {
      id
      name
      email
      avatar
    }
  }
`;

// Health Check
export const HEALTH_CHECK = gql`
  query HealthCheck {
    health
  }
`; 