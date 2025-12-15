/**
 * Tests for event broadcaster utilities
 */

import { describe, expect, it } from 'vitest';
import { createWSEvent, WSEventType } from '../types/events';
import type { Player } from '../types/player';
import { createConnection } from '../utils/connection-manager';
import {
  checkBackpressure,
  createBroadcastMessage,
  createDeliveryTracker,
  createMessageQueue,
  createRoomBroadcast,
  dequeueMessage,
  enqueueMessage,
  getDeliverySuccessRate,
  getPriorityForEventType,
  getQueueSize,
  MessagePriority,
  updateDeliveryTracker,
  type BroadcastResult,
} from '../utils/event-broadcaster';
import { createRoom } from '../utils/join-flow';

describe('Event Broadcaster', () => {
  const createMockPlayer = (id: string, nickname: string): Player => ({
    profile: {
      id,
      nickname,
      avatar: 'avatar1',
      level: 10,
      coins: 1000,
      isAI: false,
    },
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      winRate: 0,
      currentRank: '2',
      highestRank: '2',
      bombsPlayed: 0,
      firstPlaceCount: 0,
    },
  });

  describe('Message Priority', () => {
    it('should assign critical priority to state updates', () => {
      expect(getPriorityForEventType(WSEventType.STATE_UPDATE)).toBe(
        MessagePriority.CRITICAL
      );
      expect(getPriorityForEventType(WSEventType.FULL_STATE_SYNC)).toBe(
        MessagePriority.CRITICAL
      );
      expect(getPriorityForEventType(WSEventType.GAME_STARTED)).toBe(
        MessagePriority.CRITICAL
      );
    });

    it('should assign high priority to play actions', () => {
      expect(getPriorityForEventType(WSEventType.CARD_PLAYED)).toBe(
        MessagePriority.HIGH
      );
      expect(getPriorityForEventType(WSEventType.PLAYER_PASSED)).toBe(
        MessagePriority.HIGH
      );
      expect(getPriorityForEventType(WSEventType.TURN_STARTED)).toBe(
        MessagePriority.HIGH
      );
    });

    it('should assign normal priority to general events', () => {
      expect(getPriorityForEventType(WSEventType.PLAYER_JOINED)).toBe(
        MessagePriority.NORMAL
      );
      expect(getPriorityForEventType(WSEventType.PLAYER_READY)).toBe(
        MessagePriority.NORMAL
      );
    });
  });

  describe('Message Queue', () => {
    it('should create empty queue', () => {
      const queue = createMessageQueue();

      expect(getQueueSize(queue)).toBe(0);
    });

    it('should enqueue messages by priority', () => {
      let queue = createMessageQueue();

      const event = createWSEvent(WSEventType.PLAYER_JOINED, {}, 'room1');
      const message = createBroadcastMessage(
        ['conn1'],
        event,
        MessagePriority.NORMAL
      );

      queue = enqueueMessage(queue, message);

      expect(getQueueSize(queue)).toBe(1);
      expect(queue.normal).toHaveLength(1);
    });

    it('should dequeue messages in priority order', () => {
      let queue = createMessageQueue();

      // Add messages with different priorities
      const normalEvent = createWSEvent(WSEventType.PLAYER_JOINED, {}, 'room1');
      const criticalEvent = createWSEvent(
        WSEventType.STATE_UPDATE,
        {},
        'room1'
      );

      const normalMsg = createBroadcastMessage(
        ['conn1'],
        normalEvent,
        MessagePriority.NORMAL
      );
      const criticalMsg = createBroadcastMessage(
        ['conn1'],
        criticalEvent,
        MessagePriority.CRITICAL
      );

      queue = enqueueMessage(queue, normalMsg);
      queue = enqueueMessage(queue, criticalMsg);

      // Should dequeue critical first
      const result1 = dequeueMessage(queue);
      expect(result1.message?.priority).toBe(MessagePriority.CRITICAL);

      // Then normal
      const result2 = dequeueMessage(result1.queue);
      expect(result2.message?.priority).toBe(MessagePriority.NORMAL);
    });

    it('should return null when queue is empty', () => {
      const queue = createMessageQueue();
      const result = dequeueMessage(queue);

      expect(result.message).toBeNull();
    });
  });

  describe('Room Broadcast', () => {
    it('should create broadcast for all room connections', () => {
      const host = createMockPlayer('host', 'Host');
      const room = createRoom('room1', host);

      const conn1 = createConnection('conn1', 'player1', 'room1');
      const conn2 = createConnection('conn2', 'player2', 'room1');
      const conn3 = createConnection('conn3', 'player3', 'room2'); // Different room

      const connections = [conn1, conn2, conn3];

      const event = createWSEvent(WSEventType.PLAYER_JOINED, {}, 'room1');
      const broadcast = createRoomBroadcast(room, connections, event);

      expect(broadcast.connectionIds).toHaveLength(2);
      expect(broadcast.connectionIds).toContain('conn1');
      expect(broadcast.connectionIds).toContain('conn2');
      expect(broadcast.connectionIds).not.toContain('conn3');
    });
  });

  describe('Backpressure Detection', () => {
    it('should detect backpressure when queue is large', () => {
      let queue = createMessageQueue();

      // Add 100 messages
      for (let i = 0; i < 100; i++) {
        const event = createWSEvent(WSEventType.PLAYER_JOINED, {}, 'room1');
        const message = createBroadcastMessage(['conn1'], event);
        queue = enqueueMessage(queue, message);
      }

      const status = checkBackpressure(queue, 50);

      expect(status.isUnderPressure).toBe(true);
      expect(status.queueSize).toBe(100);
      expect(status.estimatedDelayMs).toBeGreaterThan(0);
    });

    it('should not detect backpressure when queue is small', () => {
      let queue = createMessageQueue();

      const event = createWSEvent(WSEventType.PLAYER_JOINED, {}, 'room1');
      const message = createBroadcastMessage(['conn1'], event);
      queue = enqueueMessage(queue, message);

      const status = checkBackpressure(queue, 50);

      expect(status.isUnderPressure).toBe(false);
      expect(status.queueSize).toBe(1);
    });
  });

  describe('Delivery Tracking', () => {
    it('should create delivery tracker', () => {
      const tracker = createDeliveryTracker();

      expect(tracker.totalSent).toBe(0);
      expect(tracker.totalDelivered).toBe(0);
      expect(tracker.totalFailed).toBe(0);
      expect(tracker.avgLatencyMs).toBe(0);
    });

    it('should update delivery tracker with result', () => {
      let tracker = createDeliveryTracker();

      const result: BroadcastResult = {
        delivered: ['conn1', 'conn2'],
        failed: ['conn3'],
        totalSent: 3,
        totalFailed: 1,
        durationMs: 50,
      };

      tracker = updateDeliveryTracker(tracker, result);

      expect(tracker.totalSent).toBe(3);
      expect(tracker.totalDelivered).toBe(2);
      expect(tracker.totalFailed).toBe(1);
      expect(tracker.avgLatencyMs).toBeGreaterThan(0);
    });

    it('should calculate delivery success rate', () => {
      let tracker = createDeliveryTracker();

      const result: BroadcastResult = {
        delivered: ['conn1', 'conn2'],
        failed: [],
        totalSent: 2,
        totalFailed: 0,
        durationMs: 50,
      };

      tracker = updateDeliveryTracker(tracker, result);

      const successRate = getDeliverySuccessRate(tracker);
      expect(successRate).toBe(1.0);
    });

    it('should handle zero messages sent', () => {
      const tracker = createDeliveryTracker();
      const successRate = getDeliverySuccessRate(tracker);

      expect(successRate).toBe(1.0);
    });
  });
});
