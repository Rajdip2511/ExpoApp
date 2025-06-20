import { GraphQLError } from 'graphql';
import { DateTimeResolver } from 'graphql-scalars';
import { PubSub } from 'graphql-subscriptions';
import prisma from '../utils/database';
import { 
  generateToken, 
  hashPassword, 
  comparePassword, 
  generateAvatarUrl,
  getSafeUserData,
  isValidEmail,
  isValidPassword
} from '../utils/auth';
import { Context, RegisterInput, LoginInput, CreateEventInput } from '../types';

// PubSub instance for real-time subscriptions
const pubsub = new PubSub();

// Subscription event names
const EVENT_UPDATED = 'EVENT_UPDATED';
const USER_JOINED_EVENT = 'USER_JOINED_EVENT';
const USER_LEFT_EVENT = 'USER_LEFT_EVENT';

export const resolvers = {
  // Custom scalar resolvers
  DateTime: DateTimeResolver,

  // Query resolvers
  Query: {
    health: () => '🚀 Server is running!',

    me: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      return getSafeUserData(context.user);
    },

    events: async () => {
      return await prisma.event.findMany({
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

    event: async (_: any, { id }: { id: string }) => {
      const event = await prisma.event.findUnique({
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
        throw new GraphQLError('Event not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return event;
    },

    myEvents: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      return await prisma.event.findMany({
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
    register: async (_: any, { input }: { input: RegisterInput }) => {
      // Validate input
      if (!isValidEmail(input.email)) {
        throw new GraphQLError('Invalid email format', {
          extensions: { code: 'INVALID_INPUT' }
        });
      }

      const passwordValidation = isValidPassword(input.password);
      if (!passwordValidation.valid) {
        throw new GraphQLError(passwordValidation.message!, {
          extensions: { code: 'INVALID_INPUT' }
        });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email }
      });

      if (existingUser) {
        throw new GraphQLError('User with this email already exists', {
          extensions: { code: 'USER_EXISTS' }
        });
      }

      // Create user
      const hashedPassword = await hashPassword(input.password);
      const avatar = generateAvatarUrl(input.name);

      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          avatar,
        }
      });

      const token = generateToken(user);
      const safeUser = getSafeUserData(user);

      return {
        token,
        user: safeUser
      };
    },

    login: async (_: any, { input }: { input: LoginInput }) => {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: input.email }
      });

      if (!user) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'INVALID_CREDENTIALS' }
        });
      }

      // Verify password
      const isValidPassword = await comparePassword(input.password, user.password);
      if (!isValidPassword) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'INVALID_CREDENTIALS' }
        });
      }

      const token = generateToken(user);
      const safeUser = getSafeUserData(user);

      return {
        token,
        user: safeUser
      };
    },

    createEvent: async (_: any, { input }: { input: CreateEventInput }, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Validate dates
      const startTime = new Date(input.startTime);
      const endTime = input.endTime ? new Date(input.endTime) : null;

      if (startTime < new Date()) {
        throw new GraphQLError('Event start time cannot be in the past', {
          extensions: { code: 'INVALID_INPUT' }
        });
      }

      if (endTime && endTime <= startTime) {
        throw new GraphQLError('Event end time must be after start time', {
          extensions: { code: 'INVALID_INPUT' }
        });
      }

      const event = await prisma.event.create({
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

    joinEvent: async (_: any, { eventId }: { eventId: string }, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Check if event exists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          attendees: true
        }
      });

      if (!event) {
        throw new GraphQLError('Event not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      // Check if user is already attending
      const isAlreadyAttending = event.attendees.some(
        attendee => attendee.id === context.user!.id
      );

      if (isAlreadyAttending) {
        throw new GraphQLError('You are already attending this event', {
          extensions: { code: 'ALREADY_ATTENDING' }
        });
      }

      // Add user to event
      const updatedEvent = await prisma.event.update({
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
        userJoinedEvent: getSafeUserData(context.user),
        eventId 
      });

      return updatedEvent;
    },

    leaveEvent: async (_: any, { eventId }: { eventId: string }, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Check if event exists
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          attendees: true
        }
      });

      if (!event) {
        throw new GraphQLError('Event not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      // Check if user is attending
      const isAttending = event.attendees.some(
        attendee => attendee.id === context.user!.id
      );

      if (!isAttending) {
        throw new GraphQLError('You are not attending this event', {
          extensions: { code: 'NOT_ATTENDING' }
        });
      }

      // Remove user from event
      const updatedEvent = await prisma.event.update({
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
      subscribe: (_: any, { eventId }: { eventId: string }) => {
        return pubsub.asyncIterator([EVENT_UPDATED]);
      }
    },

    userJoinedEvent: {
      subscribe: (_: any, { eventId }: { eventId: string }) => {
        return pubsub.asyncIterator([USER_JOINED_EVENT]);
      }
    },

    userLeftEvent: {
      subscribe: (_: any, { eventId }: { eventId: string }) => {
        return pubsub.asyncIterator([USER_LEFT_EVENT]);
      }
    },
  },

  // Field resolvers
  Event: {
    attendeeCount: (parent: any) => {
      return parent.attendees ? parent.attendees.length : 0;
    }
  },

  User: {
    events: async (parent: any) => {
      return await prisma.event.findMany({
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