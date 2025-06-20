import { Context, RegisterInput, LoginInput, CreateEventInput } from '../types';
export declare const resolvers: {
    DateTime: import("graphql").GraphQLScalarType<Date, Date>;
    Query: {
        health: () => string;
        me: (_: any, __: any, context: Context) => Promise<Omit<import("../utils/auth").User, "password">>;
        events: () => Promise<({
            attendees: {
                name: string;
                id: string;
                email: string;
                avatar: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            location: string;
            startTime: Date;
            endTime: Date | null;
        })[]>;
        event: (_: any, { id }: {
            id: string;
        }) => Promise<{
            attendees: {
                name: string;
                id: string;
                email: string;
                avatar: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            location: string;
            startTime: Date;
            endTime: Date | null;
        }>;
        myEvents: (_: any, __: any, context: Context) => Promise<({
            attendees: {
                name: string;
                id: string;
                email: string;
                avatar: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            location: string;
            startTime: Date;
            endTime: Date | null;
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
                name: string;
                id: string;
                email: string;
                avatar: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            location: string;
            startTime: Date;
            endTime: Date | null;
        }>;
        joinEvent: (_: any, { eventId }: {
            eventId: string;
        }, context: Context) => Promise<{
            attendees: {
                name: string;
                id: string;
                email: string;
                avatar: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            location: string;
            startTime: Date;
            endTime: Date | null;
        }>;
        leaveEvent: (_: any, { eventId }: {
            eventId: string;
        }, context: Context) => Promise<{
            attendees: {
                name: string;
                id: string;
                email: string;
                avatar: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            location: string;
            startTime: Date;
            endTime: Date | null;
        }>;
    };
    Subscription: {
        eventUpdated: {
            subscribe: (_: any, { eventId }: {
                eventId: string;
            }) => any;
        };
        userJoinedEvent: {
            subscribe: (_: any, { eventId }: {
                eventId: string;
            }) => any;
        };
        userLeftEvent: {
            subscribe: (_: any, { eventId }: {
                eventId: string;
            }) => any;
        };
    };
    Event: {
        attendeeCount: (parent: any) => any;
    };
    User: {
        events: (parent: any) => Promise<({
            attendees: {
                name: string;
                id: string;
                email: string;
                avatar: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            location: string;
            startTime: Date;
            endTime: Date | null;
        })[]>;
    };
};
