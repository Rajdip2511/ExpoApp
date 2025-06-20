import { Request, Response } from 'express';
import { User } from '@prisma/client';
export interface Context {
    user?: User;
    req: Request;
    res: Response;
}
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
export interface SocketEvents {
    'join-event': (eventId: string) => void;
    'leave-event': (eventId: string) => void;
    'user-joined': (data: {
        eventId: string;
        user: User;
        attendeeCount: number;
    }) => void;
    'user-left': (data: {
        eventId: string;
        userId: string;
        attendeeCount: number;
    }) => void;
    'attendee-update': (data: {
        eventId: string;
        attendees: User[];
        count: number;
    }) => void;
}
export interface APIResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}
export interface UserWithEvents extends User {
    events: Event[];
}
export interface EventWithAttendees extends Event {
    attendees: User[];
    attendeeCount?: number;
}
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
