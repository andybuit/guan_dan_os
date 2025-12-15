/**
 * Room lifecycle management utilities
 * Handles state transitions, validation, and room operations
 */

import type { Player } from '../types/player';
import { Room, RoomState, Seat, SeatPosition } from '../types/room';

/**
 * Valid state transitions
 */
const VALID_TRANSITIONS: Record<RoomState, RoomState[]> = {
  CREATED: [RoomState.WAITING],
  WAITING: [RoomState.STARTING, RoomState.CLOSING, RoomState.PLAYING], // Allow direct WAITING->PLAYING for force start
  STARTING: [RoomState.PLAYING, RoomState.WAITING, RoomState.CLOSING],
  PLAYING: [RoomState.ENDING, RoomState.CLOSING],
  ENDING: [RoomState.WAITING, RoomState.CLOSING],
  CLOSING: [],
};

/**
 * Check if a state transition is valid
 */
export function canTransitionTo(
  currentState: RoomState,
  targetState: RoomState
): boolean {
  return VALID_TRANSITIONS[currentState].includes(targetState);
}

/**
 * Transition room to a new state with validation
 * @throws Error if transition is invalid
 */
export function transitionRoomState(
  room: Room,
  newState: RoomState,
  reason?: string
): Room {
  if (!canTransitionTo(room.state, newState)) {
    throw new Error(
      `Invalid state transition from ${room.state} to ${newState}${reason ? `: ${reason}` : ''}`
    );
  }

  return {
    ...room,
    state: newState,
    updatedAt: Date.now(),
  };
}

/**
 * Get all occupied seats in a room
 */
export function getOccupiedSeats(room: Room): Seat[] {
  return Object.values(room.seats).filter((seat) => seat.player !== null);
}

/**
 * Get all empty seats in a room
 */
export function getEmptySeats(room: Room): Seat[] {
  return Object.values(room.seats).filter((seat) => seat.player === null);
}

/**
 * Get seat by position
 */
export function getSeatByPosition(room: Room, position: SeatPosition): Seat {
  return room.seats[position];
}

/**
 * Get seat by player ID
 */
export function getSeatByPlayerId(room: Room, playerId: string): Seat | null {
  return (
    Object.values(room.seats).find(
      (seat) => seat.player?.profile.id === playerId
    ) || null
  );
}

/**
 * Check if room is full (all 4 seats occupied)
 */
export function isRoomFull(room: Room): boolean {
  return getOccupiedSeats(room).length === 4;
}

/**
 * Check if room is empty (no seats occupied)
 */
export function isRoomEmpty(room: Room): boolean {
  return getOccupiedSeats(room).length === 0;
}

/**
 * Check if all players are ready
 */
export function areAllPlayersReady(room: Room): boolean {
  const occupiedSeats = getOccupiedSeats(room);
  if (occupiedSeats.length === 0) return false;
  return occupiedSeats.every((seat) => seat.isReady);
}

/**
 * Get player count (including AI)
 */
export function getPlayerCount(room: Room): number {
  return getOccupiedSeats(room).length;
}

/**
 * Check if player is in room
 */
export function isPlayerInRoom(room: Room, playerId: string): boolean {
  return getSeatByPlayerId(room, playerId) !== null;
}

/**
 * Check if player is room host
 */
export function isPlayerHost(room: Room, playerId: string): boolean {
  return room.hostId === playerId;
}

/**
 * Get room host seat
 */
export function getHostSeat(room: Room): Seat {
  return getSeatByPosition(room, 'S' as SeatPosition);
}

/**
 * Check if room can start game
 * Requires: all 4 seats filled, all players ready
 */
export function canStartGame(room: Room): boolean {
  return isRoomFull(room) && areAllPlayersReady(room);
}

/**
 * Update seat in room
 */
export function updateSeat(
  room: Room,
  position: SeatPosition,
  seatUpdate: Partial<Seat>
): Room {
  return {
    ...room,
    seats: {
      ...room.seats,
      [position]: {
        ...room.seats[position],
        ...seatUpdate,
      },
    },
    updatedAt: Date.now(),
  };
}

/**
 * Assign player to seat
 */
export function assignPlayerToSeat(
  room: Room,
  position: SeatPosition,
  player: Player
): Room {
  const seat = getSeatByPosition(room, position);

  if (seat.player !== null) {
    throw new Error(`Seat ${position} is already occupied`);
  }

  return updateSeat(room, position, {
    player,
    isReady: player.profile.isAI || false, // AI players are always ready
  });
}

/**
 * Remove player from seat
 */
export function removePlayerFromSeat(room: Room, position: SeatPosition): Room {
  return updateSeat(room, position, {
    player: null,
    isReady: false,
  });
}

/**
 * Toggle player ready state
 */
export function togglePlayerReady(room: Room, playerId: string): Room {
  const seat = getSeatByPlayerId(room, playerId);

  if (!seat) {
    throw new Error(`Player ${playerId} not found in room`);
  }

  if (seat.player?.profile.isAI) {
    throw new Error('Cannot toggle ready state for AI players');
  }

  return updateSeat(room, seat.position, {
    isReady: !seat.isReady,
  });
}

/**
 * Set all players to not ready (for new game)
 */
export function resetAllReadyStates(room: Room): Room {
  let updatedRoom = room;

  Object.values(room.seats).forEach((seat) => {
    if (seat.player && !seat.player.profile.isAI) {
      updatedRoom = updateSeat(updatedRoom, seat.position, {
        isReady: false,
      });
    }
  });

  return updatedRoom;
}

/**
 * Validate room state for specific operations
 */
export function validateRoomState(
  room: Room,
  allowedStates: RoomState[],
  operation: string
): void {
  if (!allowedStates.includes(room.state)) {
    throw new Error(
      `Cannot ${operation} in state ${room.state}. Allowed states: ${allowedStates.join(', ')}`
    );
  }
}

/**
 * Check if room accepts new players
 */
export function canAcceptPlayers(room: Room): boolean {
  return room.state === 'WAITING' && !isRoomFull(room);
}

/**
 * Get room summary for display
 */
export function getRoomSummary(room: Room): {
  playerCount: number;
  readyCount: number;
  aiCount: number;
  humanCount: number;
  isEmpty: boolean;
  isFull: boolean;
  canStart: boolean;
} {
  const occupiedSeats = getOccupiedSeats(room);
  const readySeats = occupiedSeats.filter((seat) => seat.isReady);
  const aiSeats = occupiedSeats.filter((seat) => seat.player?.profile.isAI);
  const humanSeats = occupiedSeats.filter(
    (seat) => seat.player && !seat.player.profile.isAI
  );

  return {
    playerCount: occupiedSeats.length,
    readyCount: readySeats.length,
    aiCount: aiSeats.length,
    humanCount: humanSeats.length,
    isEmpty: isRoomEmpty(room),
    isFull: isRoomFull(room),
    canStart: canStartGame(room),
  };
}
