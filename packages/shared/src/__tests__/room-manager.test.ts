/**
 * Tests for room manager utilities
 */

import { describe, expect, it } from 'vitest';
import type { Player } from '../types/player';
import { RoomState, type Room, type SeatPosition } from '../types/room';
import { createRoom } from '../utils/join-flow';
import {
  areAllPlayersReady,
  assignPlayerToSeat,
  canAcceptPlayers,
  canStartGame,
  canTransitionTo,
  getEmptySeats,
  getOccupiedSeats,
  getPlayerCount,
  getRoomSummary,
  isPlayerInRoom,
  isRoomEmpty,
  isRoomFull,
  removePlayerFromSeat,
  togglePlayerReady,
  transitionRoomState,
  validateRoomState,
} from '../utils/room-manager';

describe('Room Manager', () => {
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

  const createTestRoom = (): Room => {
    const host = createMockPlayer('host', 'Host Player');
    return createRoom('room1', host, { bet: 100 });
  };

  describe('State Transitions', () => {
    it('should allow valid transitions', () => {
      expect(
        canTransitionTo('CREATED' as RoomState, 'WAITING' as RoomState)
      ).toBe(true);
      expect(
        canTransitionTo('WAITING' as RoomState, 'STARTING' as RoomState)
      ).toBe(true);
      expect(
        canTransitionTo('STARTING' as RoomState, 'PLAYING' as RoomState)
      ).toBe(true);
      expect(
        canTransitionTo('PLAYING' as RoomState, 'ENDING' as RoomState)
      ).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(
        canTransitionTo('CREATED' as RoomState, 'PLAYING' as RoomState)
      ).toBe(false);
      expect(
        canTransitionTo('WAITING' as RoomState, 'ENDING' as RoomState)
      ).toBe(false);
      expect(
        canTransitionTo('CLOSING' as RoomState, 'WAITING' as RoomState)
      ).toBe(false);
    });

    it('should transition room state', () => {
      const room = createTestRoom();
      const beforeUpdate = room.updatedAt;

      // Small delay to ensure timestamp difference
      const updatedRoom = transitionRoomState(room, 'STARTING' as RoomState);

      expect(updatedRoom.state).toBe('STARTING');
      expect(updatedRoom.updatedAt).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it('should throw error on invalid transition', () => {
      const room = createTestRoom();

      expect(() => {
        transitionRoomState(room, 'ENDING' as RoomState);
      }).toThrow();
    });
  });

  describe('Seat Management', () => {
    it('should identify occupied seats', () => {
      const room = createTestRoom();
      const occupied = getOccupiedSeats(room);

      expect(occupied).toHaveLength(1);
      expect(occupied[0].position).toBe('S');
    });

    it('should identify empty seats', () => {
      const room = createTestRoom();
      const empty = getEmptySeats(room);

      expect(empty).toHaveLength(3);
    });

    it('should check if room is full', () => {
      const room = createTestRoom();

      expect(isRoomFull(room)).toBe(false);

      // Add 3 more players
      let updatedRoom = assignPlayerToSeat(
        room,
        'N' as SeatPosition,
        createMockPlayer('p2', 'Player 2')
      );
      updatedRoom = assignPlayerToSeat(
        updatedRoom,
        'E' as SeatPosition,
        createMockPlayer('p3', 'Player 3')
      );
      updatedRoom = assignPlayerToSeat(
        updatedRoom,
        'W' as SeatPosition,
        createMockPlayer('p4', 'Player 4')
      );

      expect(isRoomFull(updatedRoom)).toBe(true);
    });

    it('should check if room is empty', () => {
      const room = createTestRoom();
      const emptyRoom = removePlayerFromSeat(room, 'S' as SeatPosition);

      expect(isRoomEmpty(room)).toBe(false);
      expect(isRoomEmpty(emptyRoom)).toBe(true);
    });

    it('should get player count', () => {
      const room = createTestRoom();

      expect(getPlayerCount(room)).toBe(1);
    });

    it('should check if player is in room', () => {
      const room = createTestRoom();

      expect(isPlayerInRoom(room, 'host')).toBe(true);
      expect(isPlayerInRoom(room, 'nonexistent')).toBe(false);
    });
  });

  describe('Ready State', () => {
    it('should check if all players are ready', () => {
      const room = createTestRoom();

      expect(areAllPlayersReady(room)).toBe(false);

      const readyRoom = togglePlayerReady(room, 'host');
      expect(areAllPlayersReady(readyRoom)).toBe(true);
    });

    it('should toggle player ready state', () => {
      const room = createTestRoom();

      expect(room.seats['S'].isReady).toBe(false);

      const readyRoom = togglePlayerReady(room, 'host');
      expect(readyRoom.seats['S'].isReady).toBe(true);

      const notReadyRoom = togglePlayerReady(readyRoom, 'host');
      expect(notReadyRoom.seats['S'].isReady).toBe(false);
    });

    it('should not allow toggling AI player ready state', () => {
      const room = createTestRoom();
      const aiPlayer = createMockPlayer('ai1', 'AI Player', true);
      const roomWithAI = assignPlayerToSeat(
        room,
        'N' as SeatPosition,
        aiPlayer
      );

      expect(() => {
        togglePlayerReady(roomWithAI, 'ai1');
      }).toThrow();
    });

    it('should have AI players always ready', () => {
      const room = createTestRoom();
      const aiPlayer = createMockPlayer('ai1', 'AI Player', true);
      const roomWithAI = assignPlayerToSeat(
        room,
        'N' as SeatPosition,
        aiPlayer
      );

      expect(roomWithAI.seats['N'].isReady).toBe(true);
    });
  });

  describe('Game Start', () => {
    it('should check if game can start', () => {
      const room = createTestRoom();

      expect(canStartGame(room)).toBe(false);

      // Add 3 more players and set all ready
      let updatedRoom = assignPlayerToSeat(
        room,
        'N' as SeatPosition,
        createMockPlayer('p2', 'Player 2')
      );
      updatedRoom = assignPlayerToSeat(
        updatedRoom,
        'E' as SeatPosition,
        createMockPlayer('p3', 'Player 3')
      );
      updatedRoom = assignPlayerToSeat(
        updatedRoom,
        'W' as SeatPosition,
        createMockPlayer('p4', 'Player 4')
      );

      // Set all players ready
      updatedRoom = togglePlayerReady(updatedRoom, 'host');
      updatedRoom = togglePlayerReady(updatedRoom, 'p2');
      updatedRoom = togglePlayerReady(updatedRoom, 'p3');
      updatedRoom = togglePlayerReady(updatedRoom, 'p4');

      expect(canStartGame(updatedRoom)).toBe(true);
    });
  });

  describe('Room Validation', () => {
    it('should validate room state for operations', () => {
      const room = createTestRoom();

      expect(() => {
        validateRoomState(room, [RoomState.WAITING], 'test operation');
      }).not.toThrow();

      expect(() => {
        validateRoomState(room, [RoomState.PLAYING], 'test operation');
      }).toThrow();
    });

    it('should check if room can accept players', () => {
      const room = createTestRoom();

      expect(canAcceptPlayers(room)).toBe(true);

      // Transition to PLAYING
      const playingRoom = { ...room, state: 'PLAYING' as RoomState };
      expect(canAcceptPlayers(playingRoom)).toBe(false);
    });
  });

  describe('Room Summary', () => {
    it('should provide accurate room summary', () => {
      const room = createTestRoom();
      const summary = getRoomSummary(room);

      expect(summary.playerCount).toBe(1);
      expect(summary.readyCount).toBe(0);
      expect(summary.aiCount).toBe(0);
      expect(summary.humanCount).toBe(1);
      expect(summary.isEmpty).toBe(false);
      expect(summary.isFull).toBe(false);
      expect(summary.canStart).toBe(false);
    });

    it('should count AI and human players separately', () => {
      const room = createTestRoom();
      const aiPlayer = createMockPlayer('ai1', 'AI Player', true);
      const roomWithAI = assignPlayerToSeat(
        room,
        'N' as SeatPosition,
        aiPlayer
      );

      const summary = getRoomSummary(roomWithAI);

      expect(summary.aiCount).toBe(1);
      expect(summary.humanCount).toBe(1);
      expect(summary.playerCount).toBe(2);
    });
  });

  describe('Seat Assignment', () => {
    it('should assign player to seat', () => {
      const room = createTestRoom();
      const player = createMockPlayer('p2', 'Player 2');

      const updatedRoom = assignPlayerToSeat(room, 'N' as SeatPosition, player);

      expect(updatedRoom.seats['N'].player).toEqual(player);
    });

    it('should throw error when seat is occupied', () => {
      const room = createTestRoom();
      const player = createMockPlayer('p2', 'Player 2');

      expect(() => {
        assignPlayerToSeat(room, 'S' as SeatPosition, player);
      }).toThrow();
    });

    it('should remove player from seat', () => {
      const room = createTestRoom();
      const updatedRoom = removePlayerFromSeat(room, 'S' as SeatPosition);

      expect(updatedRoom.seats['S'].player).toBeNull();
      expect(updatedRoom.seats['S'].isReady).toBe(false);
    });
  });
});
