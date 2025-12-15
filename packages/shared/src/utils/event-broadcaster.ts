/**
 * Event broadcasting utilities for WebSocket communication
 * Handles message batching, priority queuing, and delivery tracking
 */

import type { WSEvent, WSEventType } from '../types/events';
import type { Room } from '../types/room';
import type { Connection } from './connection-manager';

/**
 * Message priority levels
 */
export enum MessagePriority {
  CRITICAL = 'CRITICAL', // Game state changes
  HIGH = 'HIGH', // Play actions
  NORMAL = 'NORMAL', // General events
  LOW = 'LOW', // Chat, notifications
}

/**
 * Broadcast message
 */
export interface BroadcastMessage {
  /** Target connection IDs */
  connectionIds: string[];

  /** Event to send */
  event: WSEvent;

  /** Message priority */
  priority: MessagePriority;

  /** Timestamp */
  timestamp: number;

  /** Retry count */
  retries: number;
}

/**
 * Broadcast result
 */
export interface BroadcastResult {
  /** Successfully delivered connection IDs */
  delivered: string[];

  /** Failed connection IDs */
  failed: string[];

  /** Total messages sent */
  totalSent: number;

  /** Total failures */
  totalFailed: number;

  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Message queue for batching
 */
export interface MessageQueue {
  /** Messages by priority */
  critical: BroadcastMessage[];
  high: BroadcastMessage[];
  normal: BroadcastMessage[];
  low: BroadcastMessage[];
}

/**
 * Create empty message queue
 */
export function createMessageQueue(): MessageQueue {
  return {
    critical: [],
    high: [],
    normal: [],
    low: [],
  };
}

/**
 * Add message to queue
 */
export function enqueueMessage(
  queue: MessageQueue,
  message: BroadcastMessage
): MessageQueue {
  const newQueue = { ...queue };

  switch (message.priority) {
    case MessagePriority.CRITICAL:
      newQueue.critical = [...queue.critical, message];
      break;
    case MessagePriority.HIGH:
      newQueue.high = [...queue.high, message];
      break;
    case MessagePriority.NORMAL:
      newQueue.normal = [...queue.normal, message];
      break;
    case MessagePriority.LOW:
      newQueue.low = [...queue.low, message];
      break;
  }

  return newQueue;
}

/**
 * Get next message from queue (highest priority first)
 */
export function dequeueMessage(queue: MessageQueue): {
  message: BroadcastMessage | null;
  queue: MessageQueue;
} {
  if (queue.critical.length > 0) {
    const [message, ...rest] = queue.critical;
    return {
      message,
      queue: { ...queue, critical: rest },
    };
  }

  if (queue.high.length > 0) {
    const [message, ...rest] = queue.high;
    return {
      message,
      queue: { ...queue, high: rest },
    };
  }

  if (queue.normal.length > 0) {
    const [message, ...rest] = queue.normal;
    return {
      message,
      queue: { ...queue, normal: rest },
    };
  }

  if (queue.low.length > 0) {
    const [message, ...rest] = queue.low;
    return {
      message,
      queue: { ...queue, low: rest },
    };
  }

  return { message: null, queue };
}

/**
 * Get queue size
 */
export function getQueueSize(queue: MessageQueue): number {
  return (
    queue.critical.length +
    queue.high.length +
    queue.normal.length +
    queue.low.length
  );
}

/**
 * Clear queue
 */
export function clearQueue(): MessageQueue {
  return createMessageQueue();
}

/**
 * Create broadcast message
 */
export function createBroadcastMessage(
  connectionIds: string[],
  event: WSEvent,
  priority: MessagePriority = MessagePriority.NORMAL
): BroadcastMessage {
  return {
    connectionIds,
    event,
    priority,
    timestamp: Date.now(),
    retries: 0,
  };
}

/**
 * Get priority for event type
 */
export function getPriorityForEventType(
  eventType: WSEventType
): MessagePriority {
  switch (eventType) {
    // Critical: Game state changes
    case 'STATE_UPDATE':
    case 'FULL_STATE_SYNC':
    case 'GAME_STARTED':
    case 'GAME_END':
      return MessagePriority.CRITICAL;

    // High: Play actions
    case 'CARD_PLAYED':
    case 'PLAYER_PASSED':
    case 'TURN_STARTED':
    case 'ROUND_END':
    case 'TRIBUTE_GIVEN':
    case 'TRIBUTE_RETURN_GIVEN':
      return MessagePriority.HIGH;

    // Normal: General events
    case 'PLAYER_JOINED':
    case 'PLAYER_LEFT':
    case 'AI_JOINED':
    case 'PLAYER_READY':
    case 'PLAYER_UNREADY':
    case 'GAME_STARTING':
    case 'ROOM_UPDATED':
      return MessagePriority.NORMAL;

    // Low: Non-critical events
    case 'CONNECTED':
    case 'RECONNECTED':
    case 'ERROR':
      return MessagePriority.LOW;

    default:
      return MessagePriority.NORMAL;
  }
}

/**
 * Broadcast event to room
 */
export function createRoomBroadcast(
  room: Room,
  connections: Connection[],
  event: WSEvent
): BroadcastMessage {
  const connectionIds = connections
    .filter((conn) => conn.roomId === room.id)
    .map((conn) => conn.connectionId);

  const priority = getPriorityForEventType(event.type);

  return createBroadcastMessage(connectionIds, event, priority);
}

/**
 * Broadcast event to specific players
 */
export function createPlayerBroadcast(
  playerIds: string[],
  connections: Connection[],
  event: WSEvent
): BroadcastMessage {
  const connectionIds = connections
    .filter((conn) => playerIds.includes(conn.playerId))
    .map((conn) => conn.connectionId);

  const priority = getPriorityForEventType(event.type);

  return createBroadcastMessage(connectionIds, event, priority);
}

/**
 * Broadcast event to single connection
 */
export function createSingleBroadcast(
  connectionId: string,
  event: WSEvent
): BroadcastMessage {
  const priority = getPriorityForEventType(event.type);

  return createBroadcastMessage([connectionId], event, priority);
}

/**
 * Batch multiple events into single message
 */
export interface BatchedEvent {
  events: WSEvent[];
  timestamp: number;
}

/**
 * Create batched event
 */
export function createBatchedEvent(events: WSEvent[]): BatchedEvent {
  return {
    events,
    timestamp: Date.now(),
  };
}

/**
 * Should batch events based on timing
 */
export function shouldBatchEvents(
  lastBatchTime: number,
  batchWindowMs: number = 100
): boolean {
  return Date.now() - lastBatchTime < batchWindowMs;
}

/**
 * Compression threshold (bytes)
 */
export const COMPRESSION_THRESHOLD_BYTES = 1024;

/**
 * Should compress message
 */
export function shouldCompressMessage(message: string): boolean {
  return Buffer.byteLength(message, 'utf8') > COMPRESSION_THRESHOLD_BYTES;
}

/**
 * Calculate message size
 */
export function getMessageSize(event: WSEvent): number {
  return Buffer.byteLength(JSON.stringify(event), 'utf8');
}

/**
 * Estimate broadcast cost (for rate limiting)
 */
export function estimateBroadcastCost(message: BroadcastMessage): number {
  const messageSize = getMessageSize(message.event);
  const connectionCount = message.connectionIds.length;

  // Cost = size * connections (simplified)
  return messageSize * connectionCount;
}

/**
 * Backpressure detector
 */
export interface BackpressureStatus {
  isUnderPressure: boolean;
  queueSize: number;
  estimatedDelayMs: number;
}

/**
 * Check for backpressure
 */
export function checkBackpressure(
  queue: MessageQueue,
  maxQueueSize: number = 100
): BackpressureStatus {
  const queueSize = getQueueSize(queue);
  const isUnderPressure = queueSize >= maxQueueSize;

  // Estimate delay: ~10ms per message
  const estimatedDelayMs = queueSize * 10;

  return {
    isUnderPressure,
    queueSize,
    estimatedDelayMs,
  };
}

/**
 * Message delivery tracker
 */
export interface DeliveryTracker {
  /** Total messages sent */
  totalSent: number;

  /** Total messages delivered */
  totalDelivered: number;

  /** Total messages failed */
  totalFailed: number;

  /** Average latency in milliseconds */
  avgLatencyMs: number;

  /** Messages sent per second */
  messagesPerSecond: number;

  /** Last update timestamp */
  lastUpdateAt: number;
}

/**
 * Create delivery tracker
 */
export function createDeliveryTracker(): DeliveryTracker {
  return {
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    avgLatencyMs: 0,
    messagesPerSecond: 0,
    lastUpdateAt: Date.now(),
  };
}

/**
 * Update delivery tracker with result
 */
export function updateDeliveryTracker(
  tracker: DeliveryTracker,
  result: BroadcastResult
): DeliveryTracker {
  const now = Date.now();
  const timeDelta = now - tracker.lastUpdateAt;

  const newTotalSent = tracker.totalSent + result.totalSent;
  const newTotalDelivered = tracker.totalDelivered + result.delivered.length;
  const newTotalFailed = tracker.totalFailed + result.totalFailed;

  // Update average latency (exponential moving average)
  const alpha = 0.3;
  const newAvgLatency =
    alpha * result.durationMs + (1 - alpha) * tracker.avgLatencyMs;

  // Calculate messages per second
  const messagesPerSecond =
    timeDelta > 0 ? (result.totalSent / timeDelta) * 1000 : 0;

  return {
    totalSent: newTotalSent,
    totalDelivered: newTotalDelivered,
    totalFailed: newTotalFailed,
    avgLatencyMs: newAvgLatency,
    messagesPerSecond,
    lastUpdateAt: now,
  };
}

/**
 * Get delivery success rate
 */
export function getDeliverySuccessRate(tracker: DeliveryTracker): number {
  if (tracker.totalSent === 0) {
    return 1.0;
  }

  return tracker.totalDelivered / tracker.totalSent;
}
