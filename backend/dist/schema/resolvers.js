"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const graphql_1 = require("graphql");
const graphql_scalars_1 = require("graphql-scalars");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const database_1 = __importDefault(require("../utils/database"));
const auth_1 = require("../utils/auth");
// PubSub instance for real-time subscriptions
const pubsub = new graphql_subscriptions_1.PubSub();
// Subscription event names
const EVENT_UPDATED = 'EVENT_UPDATED';
const USER_JOINED_EVENT = 'USER_JOINED_EVENT';
const USER_LEFT_EVENT = 'USER_LEFT_EVENT';
exports.resolvers = {
    // Custom scalar resolvers
    DateTime: graphql_scalars_1.DateTimeResolver,
    // Query resolvers
    Query: {
        health: () => '🚀 Server is running!',
        me: async (_, __, context) => {
            if (!context.user) {
                throw new graphql_1.GraphQLError('Authentication required', {
                    extensions: { code: 'UNAUTHENTICATED' }
                });
            }
            return (0, auth_1.getSafeUserData)(context.user);
        },
        events: async () => {
            return await database_1.default.event.findMany({
                include: {
                    attendees: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                            createdAt: true,
                            updatedAt: true,
                        }
                    }
                },
                orderBy: {
                    startTime: 'asc'
                }
            });
        },
        event: async (_, { id }) => {
            const event = await database_1.default.event.findUnique({
                where: { id },
                include: {
                    attendees: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                            createdAt: true,
                            updatedAt: true,
                        }
                    }
                }
            });
            if (!event) {
                throw new graphql_1.GraphQLError('Event not found', {
                    extensions: { code: 'NOT_FOUND' }
                });
            }
            return event;
        },
        myEvents: async (_, __, context) => {
            if (!context.user) {
                throw new graphql_1.GraphQLError('Authentication required', {
                    extensions: { code: 'UNAUTHENTICATED' }
                });
            }
            return await database_1.default.event.findMany({
                where: {
                    attendees: {
                        some: {
                            id: context.user.id
                        }
                    }
                },
                include: {
                    attendees: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                            createdAt: true,
                            updatedAt: true,
                        }
                    }
                },
                orderBy: {
                    startTime: 'asc'
                }
            });
        },
    },
    // Mutation resolvers
    Mutation: {
        register: async (_, { input }) => {
            // Validate input
            if (!(0, auth_1.isValidEmail)(input.email)) {
                throw new graphql_1.GraphQLError('Invalid email format', {
                    extensions: { code: 'INVALID_INPUT' }
                });
            }
            const passwordValidation = (0, auth_1.isValidPassword)(input.password);
            if (!passwordValidation.valid) {
                throw new graphql_1.GraphQLError(passwordValidation.message, {
                    extensions: { code: 'INVALID_INPUT' }
                });
            }
            // Check if user already exists
            const existingUser = await database_1.default.user.findUnique({
                where: { email: input.email }
            });
            if (existingUser) {
                throw new graphql_1.GraphQLError('User with this email already exists', {
                    extensions: { code: 'USER_EXISTS' }
                });
            }
            // Create user
            const hashedPassword = await (0, auth_1.hashPassword)(input.password);
            const avatar = (0, auth_1.generateAvatarUrl)(input.name);
            const user = await database_1.default.user.create({
                data: {
                    name: input.name,
                    email: input.email,
                    password: hashedPassword,
                    avatar,
                }
            });
            const token = (0, auth_1.generateToken)(user);
            const safeUser = (0, auth_1.getSafeUserData)(user);
            return {
                token,
                user: safeUser
            };
        },
        login: async (_, { input }) => {
            // Find user
            const user = await database_1.default.user.findUnique({
                where: { email: input.email }
            });
            if (!user) {
                throw new graphql_1.GraphQLError('Invalid email or password', {
                    extensions: { code: 'INVALID_CREDENTIALS' }
                });
            }
            // Verify password
            const isValidPassword = await (0, auth_1.comparePassword)(input.password, user.password);
            if (!isValidPassword) {
                throw new graphql_1.GraphQLError('Invalid email or password', {
                    extensions: { code: 'INVALID_CREDENTIALS' }
                });
            }
            const token = (0, auth_1.generateToken)(user);
            const safeUser = (0, auth_1.getSafeUserData)(user);
            return {
                token,
                user: safeUser
            };
        },
        createEvent: async (_, { input }, context) => {
            if (!context.user) {
                throw new graphql_1.GraphQLError('Authentication required', {
                    extensions: { code: 'UNAUTHENTICATED' }
                });
            }
            // Validate dates
            const startTime = new Date(input.startTime);
            const endTime = input.endTime ? new Date(input.endTime) : null;
            if (startTime < new Date()) {
                throw new graphql_1.GraphQLError('Event start time cannot be in the past', {
                    extensions: { code: 'INVALID_INPUT' }
                });
            }
            if (endTime && endTime <= startTime) {
                throw new graphql_1.GraphQLError('Event end time must be after start time', {
                    extensions: { code: 'INVALID_INPUT' }
                });
            }
            const event = await database_1.default.event.create({
                data: {
                    name: input.name,
                    description: input.description,
                    location: input.location,
                    startTime,
                    endTime,
                },
                include: {
                    attendees: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                            createdAt: true,
                            updatedAt: true,
                        }
                    }
                }
            });
            return event;
        },
        joinEvent: async (_, { eventId }, context) => {
            if (!context.user) {
                throw new graphql_1.GraphQLError('Authentication required', {
                    extensions: { code: 'UNAUTHENTICATED' }
                });
            }
            // Check if event exists
            const event = await database_1.default.event.findUnique({
                where: { id: eventId },
                include: {
                    attendees: true
                }
            });
            if (!event) {
                throw new graphql_1.GraphQLError('Event not found', {
                    extensions: { code: 'NOT_FOUND' }
                });
            }
            // Check if user is already attending
            const isAlreadyAttending = event.attendees.some(attendee => attendee.id === context.user.id);
            if (isAlreadyAttending) {
                throw new graphql_1.GraphQLError('You are already attending this event', {
                    extensions: { code: 'ALREADY_ATTENDING' }
                });
            }
            // Add user to event
            const updatedEvent = await database_1.default.event.update({
                where: { id: eventId },
                data: {
                    attendees: {
                        connect: { id: context.user.id }
                    }
                },
                include: {
                    attendees: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                            createdAt: true,
                            updatedAt: true,
                        }
                    }
                }
            });
            // Publish real-time update
            pubsub.publish(EVENT_UPDATED, { eventUpdated: updatedEvent });
            pubsub.publish(USER_JOINED_EVENT, {
                userJoinedEvent: (0, auth_1.getSafeUserData)(context.user),
                eventId
            });
            return updatedEvent;
        },
        leaveEvent: async (_, { eventId }, context) => {
            if (!context.user) {
                throw new graphql_1.GraphQLError('Authentication required', {
                    extensions: { code: 'UNAUTHENTICATED' }
                });
            }
            // Check if event exists
            const event = await database_1.default.event.findUnique({
                where: { id: eventId },
                include: {
                    attendees: true
                }
            });
            if (!event) {
                throw new graphql_1.GraphQLError('Event not found', {
                    extensions: { code: 'NOT_FOUND' }
                });
            }
            // Check if user is attending
            const isAttending = event.attendees.some(attendee => attendee.id === context.user.id);
            if (!isAttending) {
                throw new graphql_1.GraphQLError('You are not attending this event', {
                    extensions: { code: 'NOT_ATTENDING' }
                });
            }
            // Remove user from event
            const updatedEvent = await database_1.default.event.update({
                where: { id: eventId },
                data: {
                    attendees: {
                        disconnect: { id: context.user.id }
                    }
                },
                include: {
                    attendees: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                            createdAt: true,
                            updatedAt: true,
                        }
                    }
                }
            });
            // Publish real-time update
            pubsub.publish(EVENT_UPDATED, { eventUpdated: updatedEvent });
            pubsub.publish(USER_LEFT_EVENT, {
                userLeftEvent: context.user.id,
                eventId
            });
            return updatedEvent;
        },
    },
    // Subscription resolvers
    Subscription: {
        eventUpdated: {
            subscribe: (_, { eventId }) => {
                return pubsub.asyncIterator([EVENT_UPDATED]);
            }
        },
        userJoinedEvent: {
            subscribe: (_, { eventId }) => {
                return pubsub.asyncIterator([USER_JOINED_EVENT]);
            }
        },
        userLeftEvent: {
            subscribe: (_, { eventId }) => {
                return pubsub.asyncIterator([USER_LEFT_EVENT]);
            }
        },
    },
    // Field resolvers
    Event: {
        attendeeCount: (parent) => {
            return parent.attendees ? parent.attendees.length : 0;
        }
    },
    User: {
        events: async (parent) => {
            return await database_1.default.event.findMany({
                where: {
                    attendees: {
                        some: {
                            id: parent.id
                        }
                    }
                },
                include: {
                    attendees: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                            createdAt: true,
                            updatedAt: true,
                        }
                    }
                }
            });
        }
    }
};
