"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
exports.typeDefs = `#graphql
  scalar DateTime

  type User {
    id: ID!
    name: String!
    email: String!
    avatar: String
    createdAt: DateTime!
    updatedAt: DateTime!
    events: [Event!]!
  }

  type Event {
    id: ID!
    name: String!
    description: String
    location: String!
    startTime: DateTime!
    endTime: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    attendees: [User!]!
    attendeeCount: Int!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateEventInput {
    name: String!
    description: String
    location: String!
    startTime: DateTime!
    endTime: DateTime
  }

  type Query {
    # Get current authenticated user
    me: User

    # Get all events
    events: [Event!]!

    # Get a specific event by ID
    event(id: ID!): Event

    # Get events that the current user has joined
    myEvents: [Event!]!

    # Health check
    health: String!
  }

  type Mutation {
    # Authentication mutations
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!

    # Event mutations
    createEvent(input: CreateEventInput!): Event!
    joinEvent(eventId: ID!): Event!
    leaveEvent(eventId: ID!): Event!
  }


`;
