/**
 * Seat allocation and management utilities
 * Handles seat assignment with priority logic, release, and teammate tracking
 */

import type { Player } from '../types/player';
import { Room, Seat, SeatPosition, Team } from '../types/room';
import {
  assignPlayerToSeat,
  getSeatByPosition,
  removePlayerFromSeat,
} from './room-manager';

/**
 * Seat priority order for joining (after host takes South)
 * Priority: N > W > E
 */
const SEAT_PRIORITY: SeatPosition[] = [
  'N' as SeatPosition,
  'W' as SeatPosition,
  'E' as SeatPosition,
];

/**
 * Get team for a seat position
 */
export function getTeamForPosition(position: SeatPosition): Team {
  return position === 'N' || position === 'S' ? Team.NS : Team.EW;
}

/**
 * Get teammate position
 */
export function getTeammatePosition(position: SeatPosition): SeatPosition {
  const teammates: Record<SeatPosition, SeatPosition> = {
    N: 'S' as SeatPosition,
    S: 'N' as SeatPosition,
    E: 'W' as SeatPosition,
    W: 'E' as SeatPosition,
  };
  return teammates[position];
}

/**
 * Get opponent positions
 */
export function getOpponentPositions(
  position: SeatPosition
): [SeatPosition, SeatPosition] {
  const opponents: Record<SeatPosition, [SeatPosition, SeatPosition]> = {
    N: ['E' as SeatPosition, 'W' as SeatPosition],
    S: ['E' as SeatPosition, 'W' as SeatPosition],
    E: ['N' as SeatPosition, 'S' as SeatPosition],
    W: ['N' as SeatPosition, 'S' as SeatPosition],
  };
  return opponents[position];
}

/**
 * Get all positions for a team
 */
export function getTeamPositions(team: Team): [SeatPosition, SeatPosition] {
  return team === 'NS'
    ? ['N' as SeatPosition, 'S' as SeatPosition]
    : ['E' as SeatPosition, 'W' as SeatPosition];
}

/**
 * Find next available seat based on priority
 * Priority: N > W > E (South is always host)
 */
export function findNextAvailableSeat(room: Room): SeatPosition | null {
  for (const position of SEAT_PRIORITY) {
    const seat = getSeatByPosition(room, position);
    if (seat.player === null) {
      return position;
    }
  }
  return null;
}

/**
 * Find empty seats
 */
export function findEmptySeats(room: Room): SeatPosition[] {
  const emptySeats: SeatPosition[] = [];

  for (const position of Object.values([
    'N',
    'S',
    'E',
    'W',
  ]) as SeatPosition[]) {
    const seat = getSeatByPosition(room, position);
    if (seat.player === null) {
      emptySeats.push(position);
    }
  }

  return emptySeats;
}

/**
 * Find preferred seat for AI (East > West > North)
 * AI prefers opponent seats first to balance teams
 */
export function findPreferredAISeat(room: Room): SeatPosition | null {
  const aiPriority: SeatPosition[] = [
    'E' as SeatPosition,
    'W' as SeatPosition,
    'N' as SeatPosition,
  ];

  for (const position of aiPriority) {
    const seat = getSeatByPosition(room, position);
    if (seat.player === null) {
      return position;
    }
  }

  return null;
}

/**
 * Assign player to next available seat
 */
export function assignPlayerToNextSeat(
  room: Room,
  player: Player
): { room: Room; position: SeatPosition } {
  const position = findNextAvailableSeat(room);

  if (!position) {
    throw new Error('No available seats in room');
  }

  const updatedRoom = assignPlayerToSeat(room, position, player);

  return { room: updatedRoom, position };
}

/**
 * Assign player to specific seat if available
 */
export function assignPlayerToSpecificSeat(
  room: Room,
  player: Player,
  position: SeatPosition
): Room {
  const seat = getSeatByPosition(room, position);

  if (seat.player !== null) {
    throw new Error(
      `Seat ${position} is already occupied by ${seat.player?.profile.nickname}`
    );
  }

  return assignPlayerToSeat(room, position, player);
}

/**
 * Release seat (remove player)
 */
export function releaseSeat(room: Room, position: SeatPosition): Room {
  return removePlayerFromSeat(room, position);
}

/**
 * Release seat by player ID
 */
export function releaseSeatByPlayerId(
  room: Room,
  playerId: string
): Room | null {
  for (const position of Object.values([
    'N',
    'S',
    'E',
    'W',
  ]) as SeatPosition[]) {
    const seat = getSeatByPosition(room, position);
    if (seat.player?.profile.id === playerId) {
      return releaseSeat(room, position);
    }
  }

  return null;
}

/**
 * Get seat occupancy status
 */
export function getSeatOccupancy(room: Room): {
  occupied: SeatPosition[];
  empty: SeatPosition[];
  total: number;
  occupiedCount: number;
  emptyCount: number;
} {
  const occupied: SeatPosition[] = [];
  const empty: SeatPosition[] = [];

  for (const position of Object.values([
    'N',
    'S',
    'E',
    'W',
  ]) as SeatPosition[]) {
    const seat = getSeatByPosition(room, position);
    if (seat.player) {
      occupied.push(position);
    } else {
      empty.push(position);
    }
  }

  return {
    occupied,
    empty,
    total: 4,
    occupiedCount: occupied.length,
    emptyCount: empty.length,
  };
}

/**
 * Get teammates in room
 */
export function getTeammates(
  room: Room,
  position: SeatPosition
): {
  teammate: Seat;
  opponents: [Seat, Seat];
} {
  const teammatePos = getTeammatePosition(position);
  const opponentPositions = getOpponentPositions(position);

  return {
    teammate: getSeatByPosition(room, teammatePos),
    opponents: [
      getSeatByPosition(room, opponentPositions[0]),
      getSeatByPosition(room, opponentPositions[1]),
    ],
  };
}

/**
 * Create initial seat structure for new room
 * Host is always assigned to South position
 */
export function createInitialSeats(host: Player): Room['seats'] {
  const createSeat = (
    position: SeatPosition,
    player: Player | null = null
  ): Seat => ({
    position,
    player,
    isReady: player?.profile?.isAI || false, // AI players are always ready
    isHost: position === 'S',
    team: getTeamForPosition(position),
  });

  return {
    N: createSeat('N' as SeatPosition),
    S: createSeat('S' as SeatPosition, host), // Host takes South
    E: createSeat('E' as SeatPosition),
    W: createSeat('W' as SeatPosition),
  };
}

/**
 * Validate seat assignment
 */
export function validateSeatAssignment(
  room: Room,
  position: SeatPosition,
  player: Player
): { valid: boolean; error?: string } {
  const seat = getSeatByPosition(room, position);

  // Check if seat is occupied
  if (seat.player !== null) {
    return {
      valid: false,
      error: `Seat ${position} is already occupied by ${seat.player?.profile.nickname}`,
    };
  }

  // Check if player is already in another seat
  for (const pos of Object.values(['N', 'S', 'E', 'W']) as SeatPosition[]) {
    const s = getSeatByPosition(room, pos);
    if (s.player?.profile.id === player.profile.id) {
      return {
        valid: false,
        error: `Player ${player.profile.nickname} is already in seat ${pos}`,
      };
    }
  }

  // Host must be in South
  if (room.hostId === player.profile.id && position !== 'S') {
    return {
      valid: false,
      error: 'Host must occupy South seat',
    };
  }

  return { valid: true };
}

/**
 * Get seat display info (for UI)
 */
export function getSeatDisplayInfo(seat: Seat): {
  isEmpty: boolean;
  isAI: boolean;
  isHost: boolean;
  isReady: boolean;
  playerName: string | null;
  team: Team;
  position: SeatPosition;
} {
  return {
    isEmpty: seat.player === null,
    isAI: seat.player?.profile.isAI || false,
    isHost: seat.isHost,
    isReady: seat.isReady,
    playerName: seat.player?.profile.nickname || null,
    team: seat.team,
    position: seat.position,
  };
}
