/**
 * DynamoDB Table Schemas for Guandan Platform
 *
 * This file defines the table structures, indexes, and schema validation
 * for all DynamoDB tables used in the application.
 */

import {
  BillingMode,
  CreateTableCommandInput,
  KeyType,
  ProjectionType,
  ScalarAttributeType,
} from '@aws-sdk/client-dynamodb';

/**
 * Players Table Schema
 *
 * Stores player profiles, authentication, and statistics
 *
 * Primary Key: playerId (HASH)
 * GSI1: email (HASH) - for login lookup
 * GSI2: level-gsi (level HASH, coins RANGE) - for leaderboard
 */
export const PlayersTableSchema: CreateTableCommandInput = {
  TableName: 'guandan-players',
  BillingMode: BillingMode.PAY_PER_REQUEST,
  AttributeDefinitions: [
    { AttributeName: 'playerId', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'email', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'level', AttributeType: ScalarAttributeType.N },
    { AttributeName: 'coins', AttributeType: ScalarAttributeType.N },
    { AttributeName: 'createdAt', AttributeType: ScalarAttributeType.N },
  ],
  KeySchema: [{ AttributeName: 'playerId', KeyType: KeyType.HASH }],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'email-index',
      KeySchema: [{ AttributeName: 'email', KeyType: KeyType.HASH }],
      Projection: { ProjectionType: ProjectionType.ALL },
    },
    {
      IndexName: 'leaderboard-index',
      KeySchema: [
        { AttributeName: 'level', KeyType: KeyType.HASH },
        { AttributeName: 'coins', KeyType: KeyType.RANGE },
      ],
      Projection: { ProjectionType: ProjectionType.ALL },
    },
  ],
  StreamSpecification: {
    StreamEnabled: true,
    StreamViewType: 'NEW_AND_OLD_IMAGES',
  },
  Tags: [
    { Key: 'Environment', Value: 'production' },
    { Key: 'Application', Value: 'guandan-platform' },
  ],
};

/**
 * Rooms Table Schema
 *
 * Stores room state, player seats, and configuration
 *
 * Primary Key: roomId (HASH)
 * GSI1: hostId-createdAt-index (hostId HASH, createdAt RANGE) - for player's rooms
 * GSI2: state-index (state HASH, createdAt RANGE) - for room listing
 * TTL: expiresAt (auto-delete after 24 hours)
 */
export const RoomsTableSchema: CreateTableCommandInput = {
  TableName: 'guandan-rooms',
  BillingMode: BillingMode.PAY_PER_REQUEST,
  AttributeDefinitions: [
    { AttributeName: 'roomId', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'hostId', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'state', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'createdAt', AttributeType: ScalarAttributeType.N },
  ],
  KeySchema: [{ AttributeName: 'roomId', KeyType: KeyType.HASH }],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'host-index',
      KeySchema: [
        { AttributeName: 'hostId', KeyType: KeyType.HASH },
        { AttributeName: 'createdAt', KeyType: KeyType.RANGE },
      ],
      Projection: { ProjectionType: ProjectionType.ALL },
    },
    {
      IndexName: 'state-index',
      KeySchema: [
        { AttributeName: 'state', KeyType: KeyType.HASH },
        { AttributeName: 'createdAt', KeyType: KeyType.RANGE },
      ],
      Projection: { ProjectionType: ProjectionType.ALL },
    },
  ],
  Tags: [
    { Key: 'Environment', Value: 'production' },
    { Key: 'Application', Value: 'guandan-platform' },
  ],
};

/**
 * Games Table Schema
 *
 * Stores active game state, hands, history, and turn info
 *
 * Primary Key: gameId (HASH)
 * GSI1: roomId-index (roomId HASH) - for room's current game
 * TTL: expiresAt (auto-delete after 7 days)
 */
export const GamesTableSchema: CreateTableCommandInput = {
  TableName: 'guandan-games',
  BillingMode: BillingMode.PAY_PER_REQUEST,
  AttributeDefinitions: [
    { AttributeName: 'gameId', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'roomId', AttributeType: ScalarAttributeType.S },
  ],
  KeySchema: [{ AttributeName: 'gameId', KeyType: KeyType.HASH }],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'room-index',
      KeySchema: [{ AttributeName: 'roomId', KeyType: KeyType.HASH }],
      Projection: { ProjectionType: ProjectionType.ALL },
    },
  ],
  StreamSpecification: {
    StreamEnabled: true,
    StreamViewType: 'NEW_AND_OLD_IMAGES',
  },
  Tags: [
    { Key: 'Environment', Value: 'production' },
    { Key: 'Application', Value: 'guandan-platform' },
  ],
};

/**
 * Rankings Table Schema
 *
 * Stores player ranking history and statistics
 *
 * Primary Key: rankingId (HASH)
 * GSI1: playerId-timestamp-index (playerId HASH, timestamp RANGE) - for player history
 * GSI2: gameId-index (gameId HASH) - for game rankings
 * TTL: expiresAt (auto-delete after 30 days)
 */
export const RankingsTableSchema: CreateTableCommandInput = {
  TableName: 'guandan-rankings',
  BillingMode: BillingMode.PAY_PER_REQUEST,
  AttributeDefinitions: [
    { AttributeName: 'rankingId', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'playerId', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'gameId', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'timestamp', AttributeType: ScalarAttributeType.N },
  ],
  KeySchema: [{ AttributeName: 'rankingId', KeyType: KeyType.HASH }],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'player-index',
      KeySchema: [
        { AttributeName: 'playerId', KeyType: KeyType.HASH },
        { AttributeName: 'timestamp', KeyType: KeyType.RANGE },
      ],
      Projection: { ProjectionType: ProjectionType.ALL },
    },
    {
      IndexName: 'game-index',
      KeySchema: [{ AttributeName: 'gameId', KeyType: KeyType.HASH }],
      Projection: { ProjectionType: ProjectionType.ALL },
    },
  ],
  Tags: [
    { Key: 'Environment', Value: 'production' },
    { Key: 'Application', Value: 'guandan-platform' },
  ],
};

/**
 * Connections Table Schema
 *
 * Stores WebSocket connection IDs for real-time communication
 *
 * Primary Key: connectionId (HASH)
 * GSI1: playerId-index (playerId HASH) - for player's connections
 * GSI2: roomId-index (roomId HASH) - for room broadcast
 * TTL: expiresAt (auto-delete after 1 hour)
 */
export const ConnectionsTableSchema: CreateTableCommandInput = {
  TableName: 'guandan-connections',
  BillingMode: BillingMode.PAY_PER_REQUEST,
  AttributeDefinitions: [
    { AttributeName: 'connectionId', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'playerId', AttributeType: ScalarAttributeType.S },
    { AttributeName: 'roomId', AttributeType: ScalarAttributeType.S },
  ],
  KeySchema: [{ AttributeName: 'connectionId', KeyType: KeyType.HASH }],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'player-index',
      KeySchema: [{ AttributeName: 'playerId', KeyType: KeyType.HASH }],
      Projection: { ProjectionType: ProjectionType.ALL },
    },
    {
      IndexName: 'room-index',
      KeySchema: [{ AttributeName: 'roomId', KeyType: KeyType.HASH }],
      Projection: { ProjectionType: ProjectionType.ALL },
    },
  ],
  Tags: [
    { Key: 'Environment', Value: 'production' },
    { Key: 'Application', Value: 'guandan-platform' },
  ],
};

/**
 * All table schemas for easy iteration
 */
export const ALL_TABLE_SCHEMAS = [
  PlayersTableSchema,
  RoomsTableSchema,
  GamesTableSchema,
  RankingsTableSchema,
  ConnectionsTableSchema,
];

/**
 * Helper to get table name by type
 */
export enum TableName {
  PLAYERS = 'guandan-players',
  ROOMS = 'guandan-rooms',
  GAMES = 'guandan-games',
  RANKINGS = 'guandan-rankings',
  CONNECTIONS = 'guandan-connections',
}
