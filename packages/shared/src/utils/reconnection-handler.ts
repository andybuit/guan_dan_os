/**
 * Reconnection handling utilities
 * Manages disconnection grace periods, reconnection detection, and state restoration
 */

import type { WSEvent } from '../types/events';
import { createWSEvent, WSEventType } from '../types/events';
import type { GameState } from '../types/game';
import type { Room } from '../types/room';
import type { Connection, DisconnectionInfo } from './connection-manager';
import {
  createConnection,
  createDisconnectionInfo,
  getReconnectionStatus,
  isDisconnectionInfoValid,
} from './connection-manager';
import { createFullStateSyncEvent } from './state-sync';

/**
 * Reconnection context
 */
export interface ReconnectionContext {
  /** Player ID attempting to reconnect */
  playerId: string;

  /** New connection ID */
  newConnectionId: string;

  /** Previous connection ID */
  previousConnectionId?: string;

  /** Room ID */
  roomId: string;

  /** Disconnection timestamp */
  disconnectedAt?: number;

  /** Whether reconnection is within grace period */
  isWithinGracePeriod: boolean;
}

/**
 * Reconnection result
 */
export interface ReconnectionResult {
  /** Whether reconnection was successful */
  success: boolean;

  /** New connection */
  connection?: Connection;

  /** Full state sync event */
  stateSyncEvent?: WSEvent;

  /** Error message if failed */
  error?: string;

  /** Time spent disconnected (ms) */
  disconnectedDurationMs?: number;
}

/**
 * Detect if this is a reconnection attempt
 */
export function isReconnectionAttempt(
  playerId: string,
  disconnectionInfo: DisconnectionInfo | null
): boolean {
  if (!disconnectionInfo) {
    return false;
  }

  return (
    disconnectionInfo.playerId === playerId &&
    isDisconnectionInfoValid(disconnectionInfo)
  );
}

/**
 * Create reconnection context
 */
export function createReconnectionContext(
  playerId: string,
  newConnectionId: string,
  roomId: string,
  disconnectionInfo: DisconnectionInfo | null
): ReconnectionContext {
  const isWithinGracePeriod =
    disconnectionInfo !== null && isDisconnectionInfoValid(disconnectionInfo);

  return {
    playerId,
    newConnectionId,
    previousConnectionId: disconnectionInfo?.previousConnectionId,
    roomId,
    disconnectedAt: disconnectionInfo?.disconnectedAt,
    isWithinGracePeriod,
  };
}

/**
 * Handle player reconnection
 */
export function handleReconnection(
  context: ReconnectionContext,
  gameState: GameState,
  room: Room
): ReconnectionResult {
  // Check if reconnection is within grace period
  if (!context.isWithinGracePeriod) {
    return {
      success: false,
      error: 'Reconnection grace period expired. Player was replaced.',
    };
  }

  // Calculate disconnection duration
  const disconnectedDurationMs = context.disconnectedAt
    ? Date.now() - context.disconnectedAt
    : 0;

  // Create new connection
  const connection = createConnection(
    context.newConnectionId,
    context.playerId,
    context.roomId,
    context.previousConnectionId
  );

  // Create full state sync event for player
  const stateSyncEvent = createFullStateSyncEvent(
    gameState,
    context.playerId,
    context.roomId
  );

  return {
    success: true,
    connection,
    stateSyncEvent,
    disconnectedDurationMs,
  };
}

/**
 * Disconnection tracking
 */
export interface DisconnectionTracker {
  /** Map of player ID to disconnection info */
  disconnections: Map<string, DisconnectionInfo>;

  /** Total disconnections */
  totalDisconnections: number;

  /** Successful reconnections */
  successfulReconnections: number;

  /** Failed reconnections (grace period expired) */
  failedReconnections: number;
}

/**
 * Create disconnection tracker
 */
export function createDisconnectionTracker(): DisconnectionTracker {
  return {
    disconnections: new Map(),
    totalDisconnections: 0,
    successfulReconnections: 0,
    failedReconnections: 0,
  };
}

/**
 * Track disconnection
 */
export function trackDisconnection(
  tracker: DisconnectionTracker,
  playerId: string,
  connectionId: string
): DisconnectionTracker {
  const info = createDisconnectionInfo(playerId, connectionId);

  return {
    ...tracker,
    disconnections: new Map(tracker.disconnections).set(playerId, info),
    totalDisconnections: tracker.totalDisconnections + 1,
  };
}

/**
 * Track reconnection
 */
export function trackReconnection(
  tracker: DisconnectionTracker,
  playerId: string,
  success: boolean
): DisconnectionTracker {
  const newDisconnections = new Map(tracker.disconnections);
  newDisconnections.delete(playerId);

  return {
    ...tracker,
    disconnections: newDisconnections,
    successfulReconnections: success
      ? tracker.successfulReconnections + 1
      : tracker.successfulReconnections,
    failedReconnections: success
      ? tracker.failedReconnections
      : tracker.failedReconnections + 1,
  };
}

/**
 * Get disconnection info for player
 */
export function getDisconnectionInfo(
  tracker: DisconnectionTracker,
  playerId: string
): DisconnectionInfo | null {
  return tracker.disconnections.get(playerId) || null;
}

/**
 * Clean expired disconnections
 */
export function cleanExpiredDisconnections(
  tracker: DisconnectionTracker
): DisconnectionTracker {
  const newDisconnections = new Map<string, DisconnectionInfo>();

  for (const [playerId, info] of tracker.disconnections.entries()) {
    if (isDisconnectionInfoValid(info)) {
      newDisconnections.set(playerId, info);
    }
  }

  return {
    ...tracker,
    disconnections: newDisconnections,
  };
}

/**
 * Get reconnection statistics
 */
export interface ReconnectionStats {
  totalDisconnections: number;
  successfulReconnections: number;
  failedReconnections: number;
  successRate: number;
  averageDisconnectDurationMs: number;
}

/**
 * Calculate reconnection statistics
 */
export function getReconnectionStats(
  tracker: DisconnectionTracker
): ReconnectionStats {
  const total = tracker.totalDisconnections;
  const successful = tracker.successfulReconnections;
  const failed = tracker.failedReconnections;

  const successRate = total > 0 ? successful / total : 0;

  return {
    totalDisconnections: total,
    successfulReconnections: successful,
    failedReconnections: failed,
    successRate,
    averageDisconnectDurationMs: 0, // TODO: Track duration
  };
}

/**
 * Reconnection notification event
 */
export function createReconnectedEvent(
  playerId: string,
  connectionId: string,
  roomId: string,
  disconnectedDurationMs: number
): WSEvent {
  return createWSEvent(
    WSEventType.RECONNECTED,
    {
      playerId,
      connectionId,
      disconnectedDurationMs,
    },
    roomId
  );
}

/**
 * Disconnection notification event
 */
export function createDisconnectedEvent(
  playerId: string,
  roomId: string,
  reason: string
): WSEvent {
  return createWSEvent(
    WSEventType.DISCONNECTED,
    {
      playerId,
      reason,
    },
    roomId
  );
}

/**
 * Check if player should be replaced with AI
 */
export function shouldReplaceWithAI(
  disconnectionInfo: DisconnectionInfo | null
): boolean {
  if (!disconnectionInfo) {
    return false;
  }

  const status = getReconnectionStatus(disconnectionInfo);
  return status.wasReplaced;
}

/**
 * Calculate grace period remaining
 */
export function getGracePeriodRemaining(
  disconnectionInfo: DisconnectionInfo | null
): number {
  if (!disconnectionInfo) {
    return 0;
  }

  const status = getReconnectionStatus(disconnectionInfo);
  return status.timeRemaining;
}

/**
 * Auto-retry configuration
 */
export interface AutoRetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;

  /** Initial retry delay (ms) */
  initialDelayMs: number;

  /** Backoff multiplier */
  backoffMultiplier: number;

  /** Maximum retry delay (ms) */
  maxDelayMs: number;
}

/**
 * Default auto-retry config
 */
export const DEFAULT_AUTO_RETRY_CONFIG: AutoRetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000, // 1 second
  backoffMultiplier: 2,
  maxDelayMs: 30000, // 30 seconds
};

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(
  attempt: number,
  config: AutoRetryConfig = DEFAULT_AUTO_RETRY_CONFIG
): number {
  const delay =
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);

  return Math.min(delay, config.maxDelayMs);
}

/**
 * Should retry connection
 */
export function shouldRetryConnection(
  attempt: number,
  config: AutoRetryConfig = DEFAULT_AUTO_RETRY_CONFIG
): boolean {
  return attempt <= config.maxAttempts;
}

/**
 * Heartbeat manager for connection health
 */
export interface HeartbeatManager {
  /** Last heartbeat timestamp per connection */
  lastHeartbeats: Map<string, number>;

  /** Missed heartbeat count per connection */
  missedHeartbeats: Map<string, number>;

  /** Maximum missed heartbeats before disconnect */
  maxMissedHeartbeats: number;
}

/**
 * Create heartbeat manager
 */
export function createHeartbeatManager(
  maxMissedHeartbeats: number = 3
): HeartbeatManager {
  return {
    lastHeartbeats: new Map(),
    missedHeartbeats: new Map(),
    maxMissedHeartbeats,
  };
}

/**
 * Record heartbeat
 */
export function recordHeartbeat(
  manager: HeartbeatManager,
  connectionId: string
): HeartbeatManager {
  const newLastHeartbeats = new Map(manager.lastHeartbeats);
  const newMissedHeartbeats = new Map(manager.missedHeartbeats);

  newLastHeartbeats.set(connectionId, Date.now());
  newMissedHeartbeats.set(connectionId, 0);

  return {
    ...manager,
    lastHeartbeats: newLastHeartbeats,
    missedHeartbeats: newMissedHeartbeats,
  };
}

/**
 * Check for dead connections
 */
export function checkDeadConnections(
  manager: HeartbeatManager,
  heartbeatIntervalMs: number = 30000
): string[] {
  const deadConnections: string[] = [];
  const now = Date.now();

  for (const [
    connectionId,
    lastHeartbeat,
  ] of manager.lastHeartbeats.entries()) {
    const timeSinceHeartbeat = now - lastHeartbeat;

    if (timeSinceHeartbeat > heartbeatIntervalMs) {
      const missed = manager.missedHeartbeats.get(connectionId) || 0;

      if (missed >= manager.maxMissedHeartbeats) {
        deadConnections.push(connectionId);
      }
    }
  }

  return deadConnections;
}

/**
 * Increment missed heartbeat
 */
export function incrementMissedHeartbeat(
  manager: HeartbeatManager,
  connectionId: string
): HeartbeatManager {
  const newMissedHeartbeats = new Map(manager.missedHeartbeats);
  const current = newMissedHeartbeats.get(connectionId) || 0;
  newMissedHeartbeats.set(connectionId, current + 1);

  return {
    ...manager,
    missedHeartbeats: newMissedHeartbeats,
  };
}
