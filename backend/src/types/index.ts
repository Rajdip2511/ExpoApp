import { Request, Response } from 'express';
import { User } from '@prisma/client';

// GraphQL Context Type
export interface Context {
  user?: User;
  req: Request;
  res: Response;
}

// Authentication Types
export interface JWTPayload {
  userId: string;
  email: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

// Event Types
export interface CreateEventInput {
  name: string;
  description?: string;
  location: string;
  startTime: string;
  endTime?: string;
}

export interface JoinEventInput {
  eventId: string;
}

// Socket.io Event Types
export interface SocketEvents {
  // Client to Server events
  'join-event': (eventId: string) => void;
  'leave-event': (eventId: string) => void;
  
  // Server to Client events
  'user-joined': (data: { eventId: string; user: User; attendeeCount: number }) => void;
  'user-left': (data: { eventId: string; userId: string; attendeeCount: number }) => void;
  'attendee-update': (data: { eventId: string; attendees: User[]; count: number }) => void;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Database Types Extensions
export interface UserWithEvents extends User {
  events: Event[];
}

export interface EventWithAttendees extends Event {
  attendees: User[];
  attendeeCount?: number;
}

// Utility Types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>; 