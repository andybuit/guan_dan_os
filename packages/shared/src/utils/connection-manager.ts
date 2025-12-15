/**
 * WebSocket connection management utilities
 * Handles connection storage, expiration, and lookup
 */

/**
 * Connection information stored in DynamoDB
 */
export interface Connection {
  /** Unique connection ID (from API Gateway) */
  connectionId: string;

  /** Player ID associated with this connection */
  playerId: string;

  /** Room ID the player is in */
  roomId: string;

  /** Connection established timestamp */
  connectedAt: number;

  /** Last activity timestamp (for heartbeat) */
  lastActivityAt: number;

  /** Connection expiration timestamp (TTL) */
  expiresAt: number;

  /** Whether this is a reconnection */
  isReconnection: boolean;

  /** Previous connection ID (if reconnecting) */
  previousConnectionId?: string;
}

/**
 * Default connection TTL (1 hour)
 */
export const DEFAULT_CONNECTION_TTL_MS = 60 * 60 * 1000;

/**
 * Heartbeat interval (30 seconds)
 */
export const HEARTBEAT_INTERVAL_MS = 30 * 1000;

/**
 * Grace period for disconnection before replacing with AI (30 seconds)
 */
export const DISCONNECT_GRACE_PERIOD_MS = 30 * 1000;

/**
 * Create a new connection record
 */
export function createConnection(
  connectionId: string,
  playerId: string,
  roomId: string,
  previousConnectionId?: string
): Connection {
  const now = Date.now();

  return {
    connectionId,
    playerId,
    roomId,
    connectedAt: now,
    lastActivityAt: now,
    expiresAt: now + DEFAULT_CONNECTION_TTL_MS,
    isReconnection: !!previousConnectionId,
    previousConnectionId,
  };
}

/**
 * Update connection last activity timestamp
 */
export function updateConnectionActivity(connection: Connection): Connection {
  return {
    ...connection,
    lastActivityAt: Date.now(),
  };
}

/**
 * Check if connection has expired
 */
export function isConnectionExpired(connection: Connection): boolean {
  return Date.now() >= connection.expiresAt;
}

/**
 * Check if connection needs heartbeat
 */
export function needsHeartbeat(connection: Connection): boolean {
  return Date.now() - connection.lastActivityAt >= HEARTBEAT_INTERVAL_MS;
}

/**
 * Check if disconnection grace period has expired
 */
export function hasDisconnectGracePeriodExpired(
  disconnectedAt: number
): boolean {
  return Date.now() - disconnectedAt >= DISCONNECT_GRACE_PERIOD_MS;
}

/**
 * Extend connection expiration time
 */
export function extendConnectionExpiration(
  connection: Connection,
  extensionMs: number = DEFAULT_CONNECTION_TTL_MS
): Connection {
  return {
    ...connection,
    expiresAt: Date.now() + extensionMs,
  };
}

/**
 * Connection lookup by player ID
 */
export interface ConnectionLookup {
  /** Map of player ID to connection ID */
  playerToConnection: Map<string, string>;

  /** Map of connection ID to connection */
  connections: Map<string, Connection>;
}

/**
 * Create empty connection lookup
 */
export function createConnectionLookup(): ConnectionLookup {
  return {
    playerToConnection: new Map(),
    connections: new Map(),
  };
}

/**
 * Add connection to lookup
 */
export function addConnectionToLookup(
  lookup: ConnectionLookup,
  connection: Connection
): ConnectionLookup {
  const newLookup = {
    playerToConnection: new Map(lookup.playerToConnection),
    connections: new Map(lookup.connections),
  };

  newLookup.playerToConnection.set(
    connection.playerId,
    connection.connectionId
  );
  newLookup.connections.set(connection.connectionId, connection);

  return newLookup;
}

/**
 * Remove connection from lookup
 */
export function removeConnectionFromLookup(
  lookup: ConnectionLookup,
  connectionId: string
): ConnectionLookup {
  const connection = lookup.connections.get(connectionId);
  if (!connection) {
    return lookup;
  }

  const newLookup = {
    playerToConnection: new Map(lookup.playerToConnection),
    connections: new Map(lookup.connections),
  };

  newLookup.playerToConnection.delete(connection.playerId);
  newLookup.connections.delete(connectionId);

  return newLookup;
}

/**
 * Get connection by player ID
 */
export function getConnectionByPlayerId(
  lookup: ConnectionLookup,
  playerId: string
): Connection | null {
  const connectionId = lookup.playerToConnection.get(playerId);
  if (!connectionId) {
    return null;
  }

  return lookup.connections.get(connectionId) || null;
}

/**
 * Get connection by connection ID
 */
export function getConnectionById(
  lookup: ConnectionLookup,
  connectionId: string
): Connection | null {
  return lookup.connections.get(connectionId) || null;
}

/**
 * Get all connections for a room
 */
export function getConnectionsForRoom(
  lookup: ConnectionLookup,
  roomId: string
): Connection[] {
  return Array.from(lookup.connections.values()).filter(
    (conn) => conn.roomId === roomId
  );
}

/**
 * Check if player is connected
 */
export function isPlayerConnected(
  lookup: ConnectionLookup,
  playerId: string
): boolean {
  const connection = getConnectionByPlayerId(lookup, playerId);
  return connection !== null && !isConnectionExpired(connection);
}

/**
 * Get disconnection info for a player
 */
export interface DisconnectionInfo {
  playerId: string;
  disconnectedAt: number;
  gracePeriodEndsAt: number;
  previousConnectionId: string;
}

/**
 * Create disconnection info record
 */
export function createDisconnectionInfo(
  playerId: string,
  connectionId: string
): DisconnectionInfo {
  const now = Date.now();

  return {
    playerId,
    disconnectedAt: now,
    gracePeriodEndsAt: now + DISCONNECT_GRACE_PERIOD_MS,
    previousConnectionId: connectionId,
  };
}

/**
 * Check if disconnection info is still valid (within grace period)
 */
export function isDisconnectionInfoValid(info: DisconnectionInfo): boolean {
  return Date.now() < info.gracePeriodEndsAt;
}

/**
 * Calculate reconnection status
 */
export interface ReconnectionStatus {
  canReconnect: boolean;
  timeRemaining: number;
  wasReplaced: boolean;
}

/**
 * Get reconnection status for a player
 */
export function getReconnectionStatus(
  disconnectionInfo: DisconnectionInfo | null
): ReconnectionStatus {
  if (!disconnectionInfo) {
    return {
      canReconnect: false,
      timeRemaining: 0,
      wasReplaced: true,
    };
  }

  const now = Date.now();
  const timeRemaining = Math.max(0, disconnectionInfo.gracePeriodEndsAt - now);

  return {
    canReconnect: timeRemaining > 0,
    timeRemaining,
    wasReplaced: timeRemaining === 0,
  };
}
