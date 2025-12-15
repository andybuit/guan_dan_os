/**
 * Tests for AI auto-fill system
 */

import { describe, expect, it } from 'vitest';
import type { Player } from '../types/player';
import { SeatPosition } from '../types/room';
import {
  addAIPlayerToRoom,
  createAutoFillConfig,
  fillAllSeatsWithAI,
  getAutoFillStatus,
  getRecommendedAIDifficulty,
  handlePlayerJoinWithTimer,
  needsAutoFill,
  processAutoFillCheck,
  validateAutoFillSettings,
} from '../utils/ai-auto-fill';
import { createRoom } from '../utils/join-flow';
import { assignPlayerToSeat, isRoomFull } from '../utils/room-manager';

describe('AI Auto-fill System', () => {
  const createMockPlayer = (
    id: string,
    username: string,
    level = 10,
    isAI = false
  ): Player => ({
    profile: {
      id,
      nickname: username,
      avatar: 'avatar1',
      level,
      coins: 1000,
      isAI,
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

  describe('Auto-fill Detection', () => {
    it('should detect when auto-fill is needed', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      // Set expired timer
      const roomWithExpiredTimer = {
        ...room,
        autoFillTimerExpiry: Date.now() - 1000,
      };

      expect(needsAutoFill(roomWithExpiredTimer)).toBe(true);
    });

    it('should not need auto-fill when disabled', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host, { allowAIAutoFill: false });

      const roomWithExpiredTimer = {
        ...room,
        autoFillTimerExpiry: Date.now() - 1000,
      };

      expect(needsAutoFill(roomWithExpiredTimer)).toBe(false);
    });

    it('should not need auto-fill when room is full', () => {
      const host = createMockPlayer('host', 'Host Player');
      let room = createRoom('room1', host);

      room = assignPlayerToSeat(
        room,
        SeatPosition.NORTH,
        createMockPlayer('p2', 'P2')
      );
      room = assignPlayerToSeat(
        room,
        SeatPosition.EAST,
        createMockPlayer('p3', 'P3')
      );
      room = assignPlayerToSeat(
        room,
        SeatPosition.WEST,
        createMockPlayer('p4', 'P4')
      );

      const roomWithExpiredTimer = {
        ...room,
        autoFillTimerExpiry: Date.now() - 1000,
      };

      expect(needsAutoFill(roomWithExpiredTimer)).toBe(false);
    });

    it('should not need auto-fill when timer not expired', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      const roomWithActiveTimer = {
        ...room,
        autoFillTimerExpiry: Date.now() + 10000,
      };

      expect(needsAutoFill(roomWithActiveTimer)).toBe(false);
    });
  });

  describe('Add AI Player', () => {
    it('should add AI player to preferred seat', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      const result = addAIPlayerToRoom(room, 'normal');

      if (!result.success) {
        console.error('Failed to add AI player:', result.error);
        console.error('Room state:', JSON.stringify(room, null, 2));
      }

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.aiPlayer).toBeDefined();
      expect(result.aiPlayer?.profile.isAI).toBe(true);
      expect(result.aiPlayer?.profile.nickname).toContain('AI');

      // AI should be in East (preferred position)
      expect(result.room.seats['E'].player).toEqual(result.aiPlayer);
    });

    it('should add AI with correct difficulty', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      const resultSimple = addAIPlayerToRoom(room, 'simple');
      expect(resultSimple.success).toBe(true);

      const resultNormal = addAIPlayerToRoom(room, 'normal');
      expect(resultNormal.success).toBe(true);

      const resultHard = addAIPlayerToRoom(room, 'hard');
      expect(resultHard.success).toBe(true);
    });

    it('should fail when no seats available', () => {
      const host = createMockPlayer('host', 'Host Player');
      let room = createRoom('room1', host);

      // Fill all seats
      room = assignPlayerToSeat(
        room,
        SeatPosition.NORTH,
        createMockPlayer('p2', 'P2')
      );
      room = assignPlayerToSeat(
        room,
        SeatPosition.EAST,
        createMockPlayer('p3', 'P3')
      );
      room = assignPlayerToSeat(
        room,
        SeatPosition.WEST,
        createMockPlayer('p4', 'P4')
      );

      const result = addAIPlayerToRoom(room, 'normal');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No available seats');
    });

    it('should restart timer if room still not full', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      const result = addAIPlayerToRoom(room, 'normal');

      expect(result.success).toBe(true);
      // Room should have new timer since it's still not full
      expect(result.room.autoFillTimerExpiry).toBeDefined();
    });
  });

  describe('Fill All Seats', () => {
    it('should fill all empty seats with AI', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      const result = fillAllSeatsWithAI(room, 'normal');

      expect(result.success).toBe(true);
      expect(result.addedAI).toHaveLength(3);
      expect(isRoomFull(result.room)).toBe(true);

      // All AI should be marked as AI
      result.addedAI.forEach((ai) => {
        expect(ai.profile.isAI).toBe(true);
      });
    });

    it('should maintain existing players when filling', () => {
      const host = createMockPlayer('host', 'Host Player');
      let room = createRoom('room1', host);
      const player = createMockPlayer('p2', 'Player 2');

      room = assignPlayerToSeat(room, SeatPosition.NORTH, player);

      const result = fillAllSeatsWithAI(room, 'normal');

      expect(result.success).toBe(true);
      expect(result.addedAI).toHaveLength(2); // Only 2 seats were empty
      expect(result.room.seats['N'].player).toEqual(player); // Original player preserved
      expect(result.room.seats['S'].player).toEqual(host); // Host preserved
    });
  });

  describe('Process Auto-fill Check', () => {
    it('should add AI when timer expired', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      const roomWithExpiredTimer = {
        ...room,
        autoFillTimerExpiry: Date.now() - 1000,
      };

      const result = processAutoFillCheck(roomWithExpiredTimer, 'normal');

      expect(result.aiAdded).toBe(true);
      expect(result.aiPlayer).toBeDefined();
      expect(result.position).toBeDefined();
    });

    it('should not add AI when timer not expired', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      const roomWithActiveTimer = {
        ...room,
        autoFillTimerExpiry: Date.now() + 10000,
      };

      const result = processAutoFillCheck(roomWithActiveTimer, 'normal');

      expect(result.aiAdded).toBe(false);
    });
  });

  describe('Handle Player Join with Timer', () => {
    it('should reset timer when player joins', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      const roomWithOldTimer = {
        ...room,
        autoFillTimerExpiry: Date.now() + 5000,
      };

      const result = handlePlayerJoinWithTimer(roomWithOldTimer);

      // Timer should be reset (new expiry time)
      expect(result.autoFillTimerExpiry).toBeDefined();
      expect(result.autoFillTimerExpiry).toBeGreaterThan(
        roomWithOldTimer.autoFillTimerExpiry
      );
    });

    it('should clear timer when room becomes full', () => {
      const host = createMockPlayer('host', 'Host Player');
      let room = createRoom('room1', host);

      // Fill room to 3 players
      room = assignPlayerToSeat(
        room,
        SeatPosition.NORTH,
        createMockPlayer('p2', 'P2')
      );
      room = assignPlayerToSeat(
        room,
        SeatPosition.EAST,
        createMockPlayer('p3', 'P3')
      );

      const roomWithTimer = {
        ...room,
        autoFillTimerExpiry: Date.now() + 5000,
      };

      // Add 4th player
      const fullRoom = assignPlayerToSeat(
        roomWithTimer,
        SeatPosition.WEST,
        createMockPlayer('p4', 'P4')
      );
      const result = handlePlayerJoinWithTimer(fullRoom);

      // Timer should be cleared since room is full
      expect(result.autoFillTimerExpiry).toBeUndefined();
    });
  });

  describe('Auto-fill Status', () => {
    it('should get status when timer active', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      const expiryTime = Date.now() + 10000;
      const roomWithTimer = {
        ...room,
        autoFillTimerExpiry: expiryTime,
      };

      const status = getAutoFillStatus(roomWithTimer);

      expect(status.enabled).toBe(true);
      expect(status.timerActive).toBe(true);
      expect(status.timeRemaining).toBeLessThanOrEqual(10000);
      expect(status.willExpireAt).toBe(expiryTime);
    });

    it('should get status when timer expired', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      const roomWithExpiredTimer = {
        ...room,
        autoFillTimerExpiry: Date.now() - 1000,
      };

      const status = getAutoFillStatus(roomWithExpiredTimer);

      expect(status.timerActive).toBe(false);
    });

    it('should get status when disabled', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host, { allowAIAutoFill: false });

      const status = getAutoFillStatus(room);

      expect(status.enabled).toBe(false);
      expect(status.timerActive).toBe(false);
    });
  });

  describe('Recommended AI Difficulty', () => {
    it('should recommend simple for low-level players', () => {
      const host = createMockPlayer('host', 'Host', 5);
      let room = createRoom('room1', host);
      room = assignPlayerToSeat(
        room,
        SeatPosition.NORTH,
        createMockPlayer('p2', 'P2', 7)
      );

      expect(getRecommendedAIDifficulty(room)).toBe('simple');
    });

    it('should recommend normal for mid-level players', () => {
      const host = createMockPlayer('host', 'Host', 10);
      let room = createRoom('room1', host);
      room = assignPlayerToSeat(
        room,
        SeatPosition.NORTH,
        createMockPlayer('p2', 'P2', 12)
      );

      expect(getRecommendedAIDifficulty(room)).toBe('normal');
    });

    it('should recommend hard for high-level players', () => {
      const host = createMockPlayer('host', 'Host', 18);
      let room = createRoom('room1', host);
      room = assignPlayerToSeat(
        room,
        SeatPosition.NORTH,
        createMockPlayer('p2', 'P2', 20)
      );

      expect(getRecommendedAIDifficulty(room)).toBe('hard');
    });

    it('should default to normal with no players', () => {
      const host = createMockPlayer('host', 'Host', 10);
      const room = createRoom('room1', host);

      // Remove host to test with no human players
      const emptyRoom = { ...room };
      emptyRoom.seats['S'] = { ...emptyRoom.seats['S'], player: null };

      expect(getRecommendedAIDifficulty(emptyRoom)).toBe('normal');
    });
  });

  describe('Auto-fill Configuration', () => {
    it('should create valid auto-fill config', () => {
      const config = createAutoFillConfig(true, 15000);

      expect(config.allowAIAutoFill).toBe(true);
      expect(config.autoFillTimeoutMs).toBe(15000);
    });

    it('should enforce minimum timeout', () => {
      const config = createAutoFillConfig(true, 500);

      expect(config.autoFillTimeoutMs).toBe(1000); // Min 1 second
    });

    it('should validate auto-fill settings', () => {
      const validResult = validateAutoFillSettings({
        autoFillTimeoutMs: 10000,
      });

      expect(validResult.valid).toBe(true);

      const tooShortResult = validateAutoFillSettings({
        autoFillTimeoutMs: 500,
      });

      expect(tooShortResult.valid).toBe(false);
      expect(tooShortResult.error).toContain('at least 1000ms');

      const tooLongResult = validateAutoFillSettings({
        autoFillTimeoutMs: 400000,
      });

      expect(tooLongResult.valid).toBe(false);
      expect(tooLongResult.error).toContain('cannot exceed 300000ms');
    });
  });
});
