/**
 * Player join flow utilities
 * Handles room code generation, validation, and player join logic
 */

import type { Player } from '../types/player';
import { Room, RoomConfig, RoomState } from '../types/room';
import {
  canAcceptPlayers,
  isPlayerInRoom,
  transitionRoomState,
  validateRoomState,
} from './room-manager';
import { assignPlayerToNextSeat, createInitialSeats } from './seat-manager';

/**
 * Generate a random 6-digit room code
 */
export function generateRoomCode(): string {
  const min = 100000;
  const max = 999999;
  const code = Math.floor(Math.random() * (max - min + 1)) + min;
  return code.toString();
}

/**
 * Validate room code format
 */
export function isValidRoomCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Create a new room with host
 */
export function createRoom(
  roomId: string,
  host: Player,
  config: Partial<RoomConfig> = {}
): Room {
  const now = Date.now();

  const defaultConfig: RoomConfig = {
    bet: 100,
    startingRank: '2',
    allowAIAutoFill: true,
    autoFillTimeoutMs: 10000, // 10 seconds
    turnTimeoutMs: 30000, // 30 seconds
    isPrivate: false,
  };

  const roomConfig: RoomConfig = {
    ...defaultConfig,
    ...config,
  };

  const room: Room = {
    id: roomId,
    roomCode: generateRoomCode(),
    state: 'CREATED' as RoomState,
    config: roomConfig,
    seats: createInitialSeats(host),
    hostId: host.profile.id,
    createdAt: now,
    updatedAt: now,
  };

  // Transition to WAITING state after creation
  return transitionRoomState(room, 'WAITING' as RoomState, 'Room created');
}

/**
 * Validate if a player can join a room
 */
export function canPlayerJoinRoom(
  room: Room,
  player: Player
): { canJoin: boolean; reason?: string } {
  // Check if room accepts players
  if (!canAcceptPlayers(room)) {
    if (room.state !== 'WAITING') {
      return {
        canJoin: false,
        reason: `Room is ${room.state.toLowerCase()}, not accepting new players`,
      };
    }
    return {
      canJoin: false,
      reason: 'Room is full',
    };
  }

  // Check if player is already in room
  if (isPlayerInRoom(room, player.profile.id)) {
    return {
      canJoin: false,
      reason: 'You are already in this room',
    };
  }

  return { canJoin: true };
}

/**
 * Add a player to a room
 */
export function addPlayerToRoom(
  room: Room,
  player: Player
): { room: Room; position: string; success: boolean; error?: string } {
  // Validate room state
  try {
    validateRoomState(room, [RoomState.WAITING], 'add player');
  } catch (error) {
    return {
      room,
      position: '',
      success: false,
      error: error instanceof Error ? error.message : 'Invalid room state',
    };
  }

  // Validate player can join
  const { canJoin, reason } = canPlayerJoinRoom(room, player);
  if (!canJoin) {
    return {
      room,
      position: '',
      success: false,
      error: reason,
    };
  }

  // Assign to next available seat
  try {
    const { room: updatedRoom, position } = assignPlayerToNextSeat(
      room,
      player
    );

    return {
      room: updatedRoom,
      position,
      success: true,
    };
  } catch (error) {
    return {
      room,
      position: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign seat',
    };
  }
}

/**
 * Remove a player from a room
 */
export function removePlayerFromRoom(
  room: Room,
  playerId: string
): { room: Room; success: boolean; error?: string } {
  // Check if player is in room
  if (!isPlayerInRoom(room, playerId)) {
    return {
      room,
      success: false,
      error: 'Player not in room',
    };
  }

  // Cannot remove host while room has other players
  if (room.hostId === playerId) {
    const occupiedSeats = Object.values(room.seats).filter(
      (seat) => seat.player !== null && seat.player.profile.id !== playerId
    );

    if (occupiedSeats.length > 0) {
      return {
        room,
        success: false,
        error: 'Host cannot leave while other players are in the room',
      };
    }
  }

  // Find and clear the seat
  let updatedRoom = { ...room };
  let found = false;

  for (const position of Object.keys(room.seats)) {
    const seat = room.seats[position as keyof typeof room.seats];
    if (seat.player?.profile.id === playerId) {
      updatedRoom = {
        ...updatedRoom,
        seats: {
          ...updatedRoom.seats,
          [position]: {
            ...seat,
            player: null,
            isReady: false,
          },
        },
        updatedAt: Date.now(),
      };
      found = true;
      break;
    }
  }

  if (!found) {
    return {
      room,
      success: false,
      error: 'Player seat not found',
    };
  }

  return {
    room: updatedRoom,
    success: true,
  };
}

/**
 * Get room join info (for lobby display)
 */
export function getRoomJoinInfo(room: Room): {
  roomCode: string;
  canJoin: boolean;
  playerCount: number;
  maxPlayers: number;
  state: RoomState;
  isPrivate: boolean;
  bet: number;
} {
  const playerCount = Object.values(room.seats).filter(
    (seat) => seat.player !== null
  ).length;

  return {
    roomCode: room.roomCode,
    canJoin: canAcceptPlayers(room),
    playerCount,
    maxPlayers: 4,
    state: room.state,
    isPrivate: room.config.isPrivate,
    bet: room.config.bet,
  };
}

/**
 * Find room by code (helper for database lookup)
 */
export function validateAndParseRoomCode(code: string): {
  valid: boolean;
  normalizedCode?: string;
  error?: string;
} {
  const trimmed = code.trim();

  if (!isValidRoomCode(trimmed)) {
    return {
      valid: false,
      error: 'Room code must be 6 digits',
    };
  }

  return {
    valid: true,
    normalizedCode: trimmed,
  };
}

/**
 * Check if room should start AI auto-fill timer
 */
export function shouldStartAutoFillTimer(room: Room): boolean {
  // Auto-fill is disabled
  if (!room.config.allowAIAutoFill) {
    return false;
  }

  // Not in waiting state
  if (room.state !== 'WAITING') {
    return false;
  }

  // Room is full
  const emptySeats = Object.values(room.seats).filter(
    (seat) => seat.player === null
  );

  if (emptySeats.length === 0) {
    return false;
  }

  // At least one player in room
  const occupiedSeats = Object.values(room.seats).filter(
    (seat) => seat.player !== null
  );

  return occupiedSeats.length > 0;
}

/**
 * Set auto-fill timer expiry
 */
export function setAutoFillTimer(room: Room): Room {
  if (!shouldStartAutoFillTimer(room)) {
    return room;
  }

  return {
    ...room,
    autoFillTimerExpiry: Date.now() + room.config.autoFillTimeoutMs,
    updatedAt: Date.now(),
  };
}

/**
 * Clear auto-fill timer
 */
export function clearAutoFillTimer(room: Room): Room {
  return {
    ...room,
    autoFillTimerExpiry: undefined,
    updatedAt: Date.now(),
  };
}

/**
 * Check if auto-fill timer has expired
 */
export function hasAutoFillTimerExpired(room: Room): boolean {
  if (!room.autoFillTimerExpiry) {
    return false;
  }

  return Date.now() >= room.autoFillTimerExpiry;
}
