import { Context, RegisterInput, LoginInput, CreateEventInput } from '../types';
export declare const resolvers: {
    DateTime: import("graphql").GraphQLScalarType<Date, Date>;
    Query: {
        health: () => string;
        me: (_: any, __: any, context: Context) => Promise<Omit<import("../utils/auth").User, "password">>;
        events: () => Promise<({
            attendees: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                avatar: string | null;
            }[];
        } & {
            id: string;
            description: string | null;
            name: string;
            location: string;
            startTime: Date;
            endTime: Date | null;
            createdAt: Date;
            updatedAt: Date;
        })[]>;
        event: (_: any, { id }: {
            id: string;
        }) => Promise<{
            attendees: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                avatar: string | null;
            }[];
        } & {
            id: string;
            description: string | null;
            name: string;
            location: string;
            startTime: Date;
            endTime: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }>;
        myEvents: (_: any, __: any, context: Context) => Promise<({
            attendees: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                avatar: string | null;
            }[];
        } & {
            id: string;
            description: string | null;
            name: string;
            location: string;
            startTime: Date;
            endTime: Date | null;
            createdAt: Date;
            updatedAt: Date;
        })[]>;
    };
    Mutation: {
        register: (_: any, { input }: {
            input: RegisterInput;
        }) => Promise<{
            token: string;
            user: Omit<import("../utils/auth").User, "password">;
        }>;
        login: (_: any, { input }: {
            input: LoginInput;
        }) => Promise<{
            token: string;
            user: Omit<import("../utils/auth").User, "password">;
        }>;
        createEvent: (_: any, { input }: {
            input: CreateEventInput;
        }, context: Context) => Promise<{
            attendees: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                avatar: string | null;
            }[];
        } & {
            id: string;
            description: string | null;
            name: string;
            location: string;
            startTime: Date;
            endTime: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }>;
        joinEvent: (_: any, { eventId }: {
            eventId: string;
        }, context: Context) => Promise<{
            attendees: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                avatar: string | null;
            }[];
        } & {
            id: string;
            description: string | null;
            name: string;
            location: string;
            startTime: Date;
            endTime: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }>;
        leaveEvent: (_: any, { eventId }: {
            eventId: string;
        }, context: Context) => Promise<{
            attendees: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                avatar: string | null;
            }[];
        } & {
            id: string;
            description: string | null;
            name: string;
            location: string;
            startTime: Date;
            endTime: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }>;
    };
    Event: {
        attendeeCount: (parent: any) => any;
    };
    User: {
        events: (parent: any) => Promise<({
            attendees: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                avatar: string | null;
            }[];
        } & {
            id: string;
            description: string | null;
            name: string;
            location: string;
            startTime: Date;
            endTime: Date | null;
            createdAt: Date;
            updatedAt: Date;
        })[]>;
    };
};
