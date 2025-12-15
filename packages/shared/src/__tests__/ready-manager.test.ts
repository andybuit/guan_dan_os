/**
 * Tests for ready manager and game start utilities
 */

import { describe, expect, it } from 'vitest';
import type { Player } from '../types/player';
import { SeatPosition } from '../types/room';
import { createRoom } from '../utils/join-flow';
import type { GameStartCountdown } from '../utils/ready-manager';
import {
  canAcceptReadyChanges,
  cancelGameCountdown,
  canToggleReady,
  forceStartGame,
  getCountdownInfo,
  getCountdownTimeRemaining,
  getGameStartRequirements,
  getReadyStatus,
  hasCountdownExpired,
  initializeGameState,
  shouldStartCountdown,
  startGame,
  startGameCountdown,
} from '../utils/ready-manager';
import { assignPlayerToSeat, togglePlayerReady } from '../utils/room-manager';

describe('Ready Manager', () => {
  const createMockPlayer = (
    id: string,
    username: string,
    isAI = false
  ): Player => ({
    profile: {
      id,
      nickname: username,
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
  });

  const createFullReadyRoom = () => {
    const host = createMockPlayer('host', 'Host');
    let room = createRoom('room1', host);

    // Add 3 more players
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

    // Set all ready
    room = togglePlayerReady(room, 'host');
    room = togglePlayerReady(room, 'p2');
    room = togglePlayerReady(room, 'p3');
    room = togglePlayerReady(room, 'p4');

    return room;
  };

  describe('Countdown Start Conditions', () => {
    it('should detect when countdown should start', () => {
      const room = createFullReadyRoom();

      expect(shouldStartCountdown(room)).toBe(true);
    });

    it('should not start countdown when room not full', () => {
      const host = createMockPlayer('host', 'Host');
      let room = createRoom('room1', host);
      room = togglePlayerReady(room, 'host');

      expect(shouldStartCountdown(room)).toBe(false);
    });

    it('should not start countdown when not all ready', () => {
      const host = createMockPlayer('host', 'Host');
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

      // Only set host ready
      room = togglePlayerReady(room, 'host');

      expect(shouldStartCountdown(room)).toBe(false);
    });

    it('should not start countdown when not in WAITING state', () => {
      const room = createFullReadyRoom();
      const playingRoom = { ...room, state: 'PLAYING' as any };

      expect(shouldStartCountdown(playingRoom)).toBe(false);
    });
  });

  describe('Countdown Management', () => {
    it('should start countdown', () => {
      const room = createFullReadyRoom();

      const result = startGameCountdown(room, 10000);

      expect(result.countdown.isActive).toBe(true);
      expect(result.countdown.durationMs).toBe(10000);
      expect(result.countdown.expiresAt).toBeGreaterThan(Date.now());
      expect(result.room.state).toBe('STARTING');
    });

    it('should throw error when starting invalid countdown', () => {
      const host = createMockPlayer('host', 'Host');
      const room = createRoom('room1', host);

      expect(() => {
        startGameCountdown(room, 10000);
      }).toThrow('Cannot start countdown');
    });

    it('should cancel countdown', () => {
      const room = createFullReadyRoom();
      const { room: startingRoom } = startGameCountdown(room, 10000);

      const cancelledRoom = cancelGameCountdown(startingRoom);

      expect(cancelledRoom.state).toBe('WAITING');
    });

    it('should detect expired countdown', () => {
      const expiredCountdown: GameStartCountdown = {
        startTime: Date.now() - 11000,
        expiresAt: Date.now() - 1000,
        durationMs: 10000,
        isActive: true,
      };

      expect(hasCountdownExpired(expiredCountdown)).toBe(true);

      const activeCountdown: GameStartCountdown = {
        startTime: Date.now(),
        expiresAt: Date.now() + 10000,
        durationMs: 10000,
        isActive: true,
      };

      expect(hasCountdownExpired(activeCountdown)).toBe(false);
    });

    it('should get remaining time', () => {
      const countdown: GameStartCountdown = {
        startTime: Date.now(),
        expiresAt: Date.now() + 5000,
        durationMs: 10000,
        isActive: true,
      };

      const remaining = getCountdownTimeRemaining(countdown);

      expect(remaining).toBeLessThanOrEqual(5000);
      expect(remaining).toBeGreaterThan(4900);
    });

    it('should get countdown info', () => {
      const countdown: GameStartCountdown = {
        startTime: Date.now() - 5000,
        expiresAt: Date.now() + 5000,
        durationMs: 10000,
        isActive: true,
      };

      const info = getCountdownInfo(countdown);

      expect(info.isActive).toBe(true);
      expect(info.timeRemaining).toBeLessThanOrEqual(5000);
      expect(info.progress).toBeGreaterThan(0.4);
      expect(info.progress).toBeLessThan(0.6);
    });

    it('should handle null countdown', () => {
      const info = getCountdownInfo(null);

      expect(info.isActive).toBe(false);
      expect(info.timeRemaining).toBe(0);
      expect(info.progress).toBe(0);
    });
  });

  describe('Force Start', () => {
    it('should allow host to force start', () => {
      const room = createFullReadyRoom();

      const startedRoom = forceStartGame(room, 'host');

      expect(startedRoom.state).toBe('PLAYING');
    });

    it('should reject non-host force start', () => {
      const room = createFullReadyRoom();

      expect(() => {
        forceStartGame(room, 'p2');
      }).toThrow('Only host can force start');
    });

    it('should reject force start when not ready', () => {
      const host = createMockPlayer('host', 'Host');
      const room = createRoom('room1', host);

      expect(() => {
        forceStartGame(room, 'host');
      }).toThrow('Cannot start game');
    });
  });

  describe('Game Initialization', () => {
    it('should initialize game state', () => {
      const room = createFullReadyRoom();

      const gameState = initializeGameState(room, 'game1', '2');

      expect(gameState.id).toBe('game1');
      expect(gameState.roomId).toBe('room1');
      expect(Object.keys(gameState.hands)).toHaveLength(4);
      expect(gameState.currentRank).toBe('2');
      expect(gameState.hands).toBeDefined();
      expect(Object.keys(gameState.hands)).toHaveLength(4);

      // Each player should have 27 cards in their hand
      Object.values(gameState.hands).forEach((hand) => {
        expect(hand.cards).toHaveLength(27);
        expect(hand.cardCount).toBe(27);
      });
    });

    it('should set host as first player', () => {
      const room = createFullReadyRoom();

      const gameState = initializeGameState(room, 'game1', '2');

      expect(gameState.turn.playerId).toBe('host');
    });

    it('should throw error with less than 4 players', () => {
      const host = createMockPlayer('host', 'Host');
      const room = createRoom('room1', host);

      expect(() => {
        initializeGameState(room, 'game1', '2');
      }).toThrow('need exactly 4 players');
    });
  });

  describe('Game Start', () => {
    it('should start game successfully', () => {
      const room = createFullReadyRoom();

      const result = startGame(room, 'game1');

      expect(result.room.state).toBe('PLAYING');
      expect(result.room.currentGameId).toBe('game1');
      expect(result.gameState.id).toBe('game1');
      expect(Object.keys(result.gameState.hands)).toHaveLength(4);
    });

    it('should clear auto-fill timer on game start', () => {
      const room = createFullReadyRoom();
      const roomWithTimer = {
        ...room,
        autoFillTimerExpiry: Date.now() + 5000,
      };

      const result = startGame(roomWithTimer, 'game1');

      expect(result.room.autoFillTimerExpiry).toBeUndefined();
    });
  });

  describe('Ready Status', () => {
    it('should get ready status for room', () => {
      const host = createMockPlayer('host', 'Host');
      let room = createRoom('room1', host);

      room = assignPlayerToSeat(
        room,
        SeatPosition.NORTH,
        createMockPlayer('p2', 'P2')
      );
      room = togglePlayerReady(room, 'host');

      const status = getReadyStatus(room);

      expect(status.totalPlayers).toBe(2);
      expect(status.readyCount).toBe(1);
      expect(status.notReadyCount).toBe(1);
      expect(status.allReady).toBe(false);
      expect(status.readyPlayers).toContain('Host');
      expect(status.notReadyPlayers).toContain('P2');
    });

    it('should detect when all ready', () => {
      const room = createFullReadyRoom();

      const status = getReadyStatus(room);

      expect(status.allReady).toBe(true);
      expect(status.readyCount).toBe(4);
      expect(status.notReadyCount).toBe(0);
    });
  });

  describe('Ready Toggle Validation', () => {
    it('should allow ready toggle in WAITING state', () => {
      const host = createMockPlayer('host', 'Host');
      const room = createRoom('room1', host);

      const result = canToggleReady(room, 'host');

      expect(result.canToggle).toBe(true);
    });

    it('should reject toggle in non-WAITING state', () => {
      const room = createFullReadyRoom();
      const playingRoom = { ...room, state: 'PLAYING' as any };

      const result = canToggleReady(playingRoom, 'host');

      expect(result.canToggle).toBe(false);
      expect(result.reason).toContain('Cannot toggle ready');
    });

    it('should reject toggle for player not in room', () => {
      const host = createMockPlayer('host', 'Host');
      const room = createRoom('room1', host);

      const result = canToggleReady(room, 'nonexistent');

      expect(result.canToggle).toBe(false);
      expect(result.reason).toContain('not in room');
    });

    it('should reject toggle for AI players', () => {
      const host = createMockPlayer('host', 'Host');
      let room = createRoom('room1', host);
      const aiPlayer = createMockPlayer('ai1', 'AI', true);

      room = assignPlayerToSeat(room, SeatPosition.NORTH, aiPlayer);

      const result = canToggleReady(room, 'ai1');

      expect(result.canToggle).toBe(false);
      expect(result.reason).toContain('AI players are always ready');
    });
  });

  describe('Ready Changes Acceptance', () => {
    it('should accept ready changes in WAITING state', () => {
      const host = createMockPlayer('host', 'Host');
      const room = createRoom('room1', host);

      expect(canAcceptReadyChanges(room)).toBe(true);
    });

    it('should not accept ready changes in other states', () => {
      const room = createFullReadyRoom();
      const playingRoom = { ...room, state: 'PLAYING' as any };

      expect(canAcceptReadyChanges(playingRoom)).toBe(false);
    });
  });

  describe('Game Start Requirements', () => {
    it('should show all requirements met', () => {
      const room = createFullReadyRoom();

      const requirements = getGameStartRequirements(room);

      expect(requirements.canStart).toBe(true);
      expect(requirements.requirements.roomFull).toBe(true);
      expect(requirements.requirements.allReady).toBe(true);
      expect(requirements.requirements.correctState).toBe(true);
      expect(requirements.missingRequirements).toHaveLength(0);
    });

    it('should show missing room full requirement', () => {
      const host = createMockPlayer('host', 'Host');
      const room = createRoom('room1', host);

      const requirements = getGameStartRequirements(room);

      expect(requirements.canStart).toBe(false);
      expect(requirements.requirements.roomFull).toBe(false);
      expect(requirements.missingRequirements).toContain(
        'Room must have 4 players'
      );
    });

    it('should show missing all ready requirement', () => {
      const host = createMockPlayer('host', 'Host');
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

      const requirements = getGameStartRequirements(room);

      expect(requirements.canStart).toBe(false);
      expect(requirements.requirements.allReady).toBe(false);
      expect(requirements.missingRequirements).toContain(
        'All players must be ready'
      );
    });

    it('should show incorrect state requirement', () => {
      const room = createFullReadyRoom();
      const playingRoom = { ...room, state: 'PLAYING' as any };

      const requirements = getGameStartRequirements(playingRoom);

      expect(requirements.canStart).toBe(false);
      expect(requirements.requirements.correctState).toBe(false);
      expect(requirements.missingRequirements).toContain(
        'Room must be in WAITING or STARTING state'
      );
    });
  });
});
