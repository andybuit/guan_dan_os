/**
 * Tests for join flow and room creation utilities
 */

import { describe, expect, it } from 'vitest';
import type { Player } from '../types/player';
import { SeatPosition } from '../types/room';
import {
  addPlayerToRoom,
  canPlayerJoinRoom,
  clearAutoFillTimer,
  createRoom,
  generateRoomCode,
  getRoomJoinInfo,
  hasAutoFillTimerExpired,
  isValidRoomCode,
  removePlayerFromRoom,
  setAutoFillTimer,
  shouldStartAutoFillTimer,
  validateAndParseRoomCode,
} from '../utils/join-flow';
import { assignPlayerToSeat } from '../utils/room-manager';

describe('Join Flow', () => {
  const createMockPlayer = (
    id: string,
    nickname: string,
    isAI = false
  ): Player => ({
    profile: {
      id,
      nickname,
      avatar: 'avatar1',
      level: 10,
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
    session: undefined,
  });

  describe('Room Code Generation', () => {
    it('should generate valid 6-digit room code', () => {
      const code = generateRoomCode();

      expect(code).toMatch(/^\d{6}$/);
      expect(code.length).toBe(6);
      expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code)).toBeLessThanOrEqual(999999);
    });

    it('should generate unique codes', () => {
      const codes = new Set();

      for (let i = 0; i < 100; i++) {
        codes.add(generateRoomCode());
      }

      // Should have high uniqueness (allowing for some collisions in 100 tries)
      expect(codes.size).toBeGreaterThan(95);
    });

    it('should validate room code format', () => {
      expect(isValidRoomCode('123456')).toBe(true);
      expect(isValidRoomCode('000000')).toBe(true);
      expect(isValidRoomCode('999999')).toBe(true);

      expect(isValidRoomCode('12345')).toBe(false);
      expect(isValidRoomCode('1234567')).toBe(false);
      expect(isValidRoomCode('12345a')).toBe(false);
      expect(isValidRoomCode('abc123')).toBe(false);
      expect(isValidRoomCode('')).toBe(false);
    });

    it('should parse and normalize room code', () => {
      const result1 = validateAndParseRoomCode('123456');
      expect(result1.valid).toBe(true);
      expect(result1.normalizedCode).toBe('123456');

      const result2 = validateAndParseRoomCode('  123456  ');
      expect(result2.valid).toBe(true);
      expect(result2.normalizedCode).toBe('123456');

      const result3 = validateAndParseRoomCode('12345');
      expect(result3.valid).toBe(false);
      expect(result3.error).toBeDefined();
    });
  });

  describe('Room Creation', () => {
    it('should create room with host', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      expect(room.id).toBe('room1');
      expect(room.hostId).toBe('host');
      expect(room.state).toBe('WAITING');
      expect(room.seats['S'].player).toEqual(host);
      expect(room.seats['S'].isHost).toBe(true);
      expect(isValidRoomCode(room.roomCode)).toBe(true);
    });

    it('should create room with custom config', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host, {
        bet: 500,
        startingRank: 'A',
        allowAIAutoFill: false,
      });

      expect(room.config.bet).toBe(500);
      expect(room.config.startingRank).toBe('A');
      expect(room.config.allowAIAutoFill).toBe(false);
    });

    it('should use default config values', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      expect(room.config.bet).toBe(100);
      expect(room.config.startingRank).toBe('2');
      expect(room.config.allowAIAutoFill).toBe(true);
      expect(room.config.autoFillTimeoutMs).toBe(10000);
      expect(room.config.turnTimeoutMs).toBe(30000);
      expect(room.config.isPrivate).toBe(false);
    });
  });

  describe('Player Join Validation', () => {
    it('should allow player to join room', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);
      const player = createMockPlayer('p2', 'Player 2');

      const result = canPlayerJoinRoom(room, player);

      expect(result.canJoin).toBe(true);
    });

    it('should reject player when room is full', () => {
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

      const player = createMockPlayer('p5', 'Player 5');
      const result = canPlayerJoinRoom(room, player);

      expect(result.canJoin).toBe(false);
      expect(result.reason).toContain('full');
    });

    it('should reject player already in room', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      const result = canPlayerJoinRoom(room, host);

      expect(result.canJoin).toBe(false);
      expect(result.reason).toContain('already in this room');
    });

    it('should reject when room not in WAITING state', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);
      const playingRoom = { ...room, state: 'PLAYING' as any };
      const player = createMockPlayer('p2', 'Player 2');

      const result = canPlayerJoinRoom(playingRoom, player);

      expect(result.canJoin).toBe(false);
      expect(result.reason).toContain('not accepting new players');
    });
  });

  describe('Add Player to Room', () => {
    it('should add player to room successfully', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);
      const player = createMockPlayer('p2', 'Player 2');

      const result = addPlayerToRoom(room, player);

      expect(result.success).toBe(true);
      expect(result.position).toBe('N'); // First available
      expect(result.room.seats['N'].player).toEqual(player);
    });

    it('should fail to add player when room full', () => {
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

      const player = createMockPlayer('p5', 'Player 5');
      const result = addPlayerToRoom(room, player);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Remove Player from Room', () => {
    it('should remove player from room successfully', () => {
      const host = createMockPlayer('host', 'Host Player');
      let room = createRoom('room1', host);
      const player = createMockPlayer('p2', 'Player 2');

      room = assignPlayerToSeat(room, SeatPosition.NORTH, player);

      const result = removePlayerFromRoom(room, 'p2');

      expect(result.success).toBe(true);
      expect(result.room.seats['N'].player).toBeNull();
    });

    it('should fail to remove non-existent player', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      const result = removePlayerFromRoom(room, 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not in room');
    });

    it('should not allow host to leave with other players present', () => {
      const host = createMockPlayer('host', 'Host Player');
      let room = createRoom('room1', host);
      const player = createMockPlayer('p2', 'Player 2');

      room = assignPlayerToSeat(room, SeatPosition.NORTH, player);

      const result = removePlayerFromRoom(room, 'host');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Host cannot leave');
    });

    it('should allow host to leave when alone', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      const result = removePlayerFromRoom(room, 'host');

      expect(result.success).toBe(true);
    });
  });

  describe('Room Join Info', () => {
    it('should get room join info', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host, { bet: 200, isPrivate: true });

      const info = getRoomJoinInfo(room);

      expect(info.roomCode).toBe(room.roomCode);
      expect(info.canJoin).toBe(true);
      expect(info.playerCount).toBe(1);
      expect(info.maxPlayers).toBe(4);
      expect(info.state).toBe('WAITING');
      expect(info.isPrivate).toBe(true);
      expect(info.bet).toBe(200);
    });
  });

  describe('Auto-fill Timer', () => {
    it('should detect when auto-fill timer should start', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      expect(shouldStartAutoFillTimer(room)).toBe(true);
    });

    it('should not start timer when disabled', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host, { allowAIAutoFill: false });

      expect(shouldStartAutoFillTimer(room)).toBe(false);
    });

    it('should not start timer when room is full', () => {
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

      expect(shouldStartAutoFillTimer(room)).toBe(false);
    });

    it('should set auto-fill timer', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      const roomWithTimer = setAutoFillTimer(room);

      expect(roomWithTimer.autoFillTimerExpiry).toBeDefined();
      expect(roomWithTimer.autoFillTimerExpiry).toBeGreaterThan(Date.now());
    });

    it('should clear auto-fill timer', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);
      const roomWithTimer = setAutoFillTimer(room);

      const roomWithoutTimer = clearAutoFillTimer(roomWithTimer);

      expect(roomWithoutTimer.autoFillTimerExpiry).toBeUndefined();
    });

    it('should detect expired timer', () => {
      const host = createMockPlayer('host', 'Host Player');
      const room = createRoom('room1', host);

      // Set timer that expires immediately
      const expiredRoom = {
        ...room,
        autoFillTimerExpiry: Date.now() - 1000,
      };

      expect(hasAutoFillTimerExpired(expiredRoom)).toBe(true);

      // Set timer that hasn't expired
      const activeRoom = {
        ...room,
        autoFillTimerExpiry: Date.now() + 10000,
      };

      expect(hasAutoFillTimerExpired(activeRoom)).toBe(false);
    });
  });
});
