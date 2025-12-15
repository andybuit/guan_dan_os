/**
 * Tests for seat manager utilities
 */

import { describe, expect, it } from 'vitest';
import type { Player } from '../types/player';
import type { Room, SeatPosition } from '../types/room';
import { createRoom } from '../utils/join-flow';
import {
  assignPlayerToNextSeat,
  createInitialSeats,
  findNextAvailableSeat,
  findPreferredAISeat,
  getOpponentPositions,
  getSeatDisplayInfo,
  getSeatOccupancy,
  getTeamForPosition,
  getTeammatePosition,
  getTeammates,
  validateSeatAssignment,
} from '../utils/seat-manager';

describe('Seat Manager', () => {
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

  describe('Team Management', () => {
    it('should identify team for position', () => {
      expect(getTeamForPosition('N' as SeatPosition)).toBe('NS');
      expect(getTeamForPosition('S' as SeatPosition)).toBe('NS');
      expect(getTeamForPosition('E' as SeatPosition)).toBe('EW');
      expect(getTeamForPosition('W' as SeatPosition)).toBe('EW');
    });

    it('should get teammate position', () => {
      expect(getTeammatePosition('N' as SeatPosition)).toBe('S');
      expect(getTeammatePosition('S' as SeatPosition)).toBe('N');
      expect(getTeammatePosition('E' as SeatPosition)).toBe('W');
      expect(getTeammatePosition('W' as SeatPosition)).toBe('E');
    });

    it('should get opponent positions', () => {
      const northOpponents = getOpponentPositions('N' as SeatPosition);
      expect(northOpponents).toContain('E');
      expect(northOpponents).toContain('W');

      const eastOpponents = getOpponentPositions('E' as SeatPosition);
      expect(eastOpponents).toContain('N');
      expect(eastOpponents).toContain('S');
    });

    it('should get teammates in room', () => {
      const room = createTestRoom();
      const player2 = createMockPlayer('p2', 'Player 2');
      const player3 = createMockPlayer('p3', 'Player 3');

      let updatedRoom = { ...room };
      updatedRoom.seats['N'] = { ...updatedRoom.seats['N'], player: player2 };
      updatedRoom.seats['E'] = { ...updatedRoom.seats['E'], player: player3 };

      const teammates = getTeammates(updatedRoom, 'S' as SeatPosition);

      expect(teammates.teammate.position).toBe('N');
      expect(teammates.teammate.player?.profile.id).toBe('p2');
      expect(teammates.opponents).toHaveLength(2);
    });
  });

  describe('Seat Finding', () => {
    it('should find next available seat with priority', () => {
      const room = createTestRoom();

      // First available should be N (highest priority)
      expect(findNextAvailableSeat(room)).toBe('N');

      // After N is filled, should be W
      const player2 = createMockPlayer('p2', 'Player 2');
      const roomWithN = { ...room };
      roomWithN.seats['N'] = { ...roomWithN.seats['N'], player: player2 };

      expect(findNextAvailableSeat(roomWithN)).toBe('W');
    });

    it('should return null when no seats available', () => {
      const room = createTestRoom();

      // Fill all seats
      let updatedRoom = { ...room };
      updatedRoom.seats['N'] = {
        ...updatedRoom.seats['N'],
        player: createMockPlayer('p2', 'P2'),
      };
      updatedRoom.seats['E'] = {
        ...updatedRoom.seats['E'],
        player: createMockPlayer('p3', 'P3'),
      };
      updatedRoom.seats['W'] = {
        ...updatedRoom.seats['W'],
        player: createMockPlayer('p4', 'P4'),
      };

      expect(findNextAvailableSeat(updatedRoom)).toBeNull();
    });

    it('should find preferred AI seat (E > W > N)', () => {
      const room = createTestRoom();

      // First AI should go to E
      expect(findPreferredAISeat(room)).toBe('E');

      // After E is filled, should be W
      const ai1 = createMockPlayer('ai1', 'AI 1', true);
      const roomWithE = { ...room };
      roomWithE.seats['E'] = { ...roomWithE.seats['E'], player: ai1 };

      expect(findPreferredAISeat(roomWithE)).toBe('W');

      // After W is filled, should be N
      const ai2 = createMockPlayer('ai2', 'AI 2', true);
      const roomWithEW = { ...roomWithE };
      roomWithEW.seats['W'] = { ...roomWithEW.seats['W'], player: ai2 };

      expect(findPreferredAISeat(roomWithEW)).toBe('N');
    });
  });

  describe('Seat Assignment', () => {
    it('should assign player to next available seat', () => {
      const room = createTestRoom();
      const player = createMockPlayer('p2', 'Player 2');

      const result = assignPlayerToNextSeat(room, player);

      expect(result.position).toBe('N');
      expect(result.room.seats['N'].player).toEqual(player);
    });

    it('should throw error when no seats available', () => {
      const room = createTestRoom();

      // Fill all seats
      let updatedRoom = { ...room };
      updatedRoom.seats['N'] = {
        ...updatedRoom.seats['N'],
        player: createMockPlayer('p2', 'P2'),
      };
      updatedRoom.seats['E'] = {
        ...updatedRoom.seats['E'],
        player: createMockPlayer('p3', 'P3'),
      };
      updatedRoom.seats['W'] = {
        ...updatedRoom.seats['W'],
        player: createMockPlayer('p4', 'P4'),
      };

      expect(() => {
        assignPlayerToNextSeat(updatedRoom, createMockPlayer('p5', 'P5'));
      }).toThrow('No available seats');
    });
  });

  describe('Seat Occupancy', () => {
    it('should get seat occupancy status', () => {
      const room = createTestRoom();
      const occupancy = getSeatOccupancy(room);

      expect(occupancy.occupied).toHaveLength(1);
      expect(occupancy.occupied).toContain('S');
      expect(occupancy.empty).toHaveLength(3);
      expect(occupancy.occupiedCount).toBe(1);
      expect(occupancy.emptyCount).toBe(3);
      expect(occupancy.total).toBe(4);
    });
  });

  describe('Initial Seats', () => {
    it('should create initial seats with host in South', () => {
      const host = createMockPlayer('host', 'Host Player');
      const seats = createInitialSeats(host);

      expect(seats['S'].player).toEqual(host);
      expect(seats['S'].isHost).toBe(true);
      expect(seats['N'].player).toBeNull();
      expect(seats['E'].player).toBeNull();
      expect(seats['W'].player).toBeNull();
    });

    it('should mark AI players as ready in initial seats', () => {
      const aiHost = createMockPlayer('host', 'AI Host', true);
      const seats = createInitialSeats(aiHost);

      expect(seats['S'].isReady).toBe(true);
    });

    it('should assign correct teams', () => {
      const host = createMockPlayer('host', 'Host Player');
      const seats = createInitialSeats(host);

      expect(seats['N'].team).toBe('NS');
      expect(seats['S'].team).toBe('NS');
      expect(seats['E'].team).toBe('EW');
      expect(seats['W'].team).toBe('EW');
    });
  });

  describe('Seat Validation', () => {
    it('should validate valid seat assignment', () => {
      const room = createTestRoom();
      const player = createMockPlayer('p2', 'Player 2');

      const result = validateSeatAssignment(room, 'N' as SeatPosition, player);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject assignment to occupied seat', () => {
      const room = createTestRoom();
      const player = createMockPlayer('p2', 'Player 2');

      const result = validateSeatAssignment(room, 'S' as SeatPosition, player);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('occupied');
    });

    it('should reject if player already in another seat', () => {
      const room = createTestRoom();
      const player = createMockPlayer('host', 'Host Player'); // Same ID as host

      const result = validateSeatAssignment(room, 'N' as SeatPosition, player);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('already in seat');
    });

    it('should reject host in non-South seat', () => {
      const room = createTestRoom();
      const host = room.seats['S'].player!;

      // Remove host from South first
      const updatedRoom = { ...room };
      updatedRoom.seats['S'] = { ...updatedRoom.seats['S'], player: null };

      const result = validateSeatAssignment(
        updatedRoom,
        'N' as SeatPosition,
        host
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Host must occupy South');
    });
  });

  describe('Seat Display Info', () => {
    it('should get display info for empty seat', () => {
      const room = createTestRoom();
      const info = getSeatDisplayInfo(room.seats['N']);

      expect(info.isEmpty).toBe(true);
      expect(info.isAI).toBe(false);
      expect(info.isHost).toBe(false);
      expect(info.isReady).toBe(false);
      expect(info.playerName).toBeNull();
      expect(info.team).toBe('NS');
      expect(info.position).toBe('N');
    });

    it('should get display info for occupied seat', () => {
      const room = createTestRoom();
      const info = getSeatDisplayInfo(room.seats['S']);

      expect(info.isEmpty).toBe(false);
      expect(info.isHost).toBe(true);
      expect(info.playerName).toBe('Host Player');
      expect(info.team).toBe('NS');
    });

    it('should identify AI players', () => {
      const room = createTestRoom();
      const aiPlayer = createMockPlayer('ai1', 'AI Player', true);

      const updatedRoom = { ...room };
      updatedRoom.seats['N'] = {
        ...updatedRoom.seats['N'],
        player: aiPlayer,
        isReady: true,
      };

      const info = getSeatDisplayInfo(updatedRoom.seats['N']);

      expect(info.isAI).toBe(true);
      expect(info.isReady).toBe(true);
    });
  });
});
