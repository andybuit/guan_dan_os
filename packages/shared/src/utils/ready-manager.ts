/**
 * Ready state and game start management
 * Handles player ready toggles, countdown timer, and game initialization
 */

import type { GameState } from '../types/game';
import { GamePhase } from '../types/game';
import type { Room, RoomState } from '../types/room';
import { SeatPosition } from '../types/room';
import { createDeck, dealCards, shuffleDeck } from './deck';
import { clearAutoFillTimer } from './join-flow';
import {
  areAllPlayersReady,
  canStartGame,
  getOccupiedSeats,
  getSeatByPosition,
  isRoomFull,
  transitionRoomState,
} from './room-manager';

/**
 * Game start countdown state
 */
export interface GameStartCountdown {
  startTime: number;
  expiresAt: number;
  durationMs: number;
  isActive: boolean;
}

/**
 * Check if countdown should start
 * Requirements: Room full, all players ready, in WAITING state
 */
export function shouldStartCountdown(room: Room): boolean {
  return (
    room.state === 'WAITING' && isRoomFull(room) && areAllPlayersReady(room)
  );
}

/**
 * Start game countdown
 */
export function startGameCountdown(
  room: Room,
  countdownMs: number = 10000
): { room: Room; countdown: GameStartCountdown } {
  if (!shouldStartCountdown(room)) {
    throw new Error('Cannot start countdown: room not ready');
  }

  const now = Date.now();
  const countdown: GameStartCountdown = {
    startTime: now,
    expiresAt: now + countdownMs,
    durationMs: countdownMs,
    isActive: true,
  };

  // Transition to STARTING state
  const updatedRoom = transitionRoomState(
    room,
    'STARTING' as RoomState,
    'Game countdown started'
  );

  return {
    room: updatedRoom,
    countdown,
  };
}

/**
 * Cancel game countdown (if a player becomes not ready)
 */
export function cancelGameCountdown(room: Room): Room {
  if (room.state !== 'STARTING') {
    return room;
  }

  // Transition back to WAITING
  return transitionRoomState(
    room,
    'WAITING' as RoomState,
    'Countdown cancelled'
  );
}

/**
 * Check if countdown has expired
 */
export function hasCountdownExpired(countdown: GameStartCountdown): boolean {
  return Date.now() >= countdown.expiresAt;
}

/**
 * Get remaining time on countdown
 */
export function getCountdownTimeRemaining(
  countdown: GameStartCountdown
): number {
  if (!countdown.isActive) return 0;
  return Math.max(0, countdown.expiresAt - Date.now());
}

/**
 * Force start game (host override, skip countdown)
 */
export function forceStartGame(room: Room, hostId: string): Room {
  // Validate host
  if (room.hostId !== hostId) {
    throw new Error('Only host can force start the game');
  }

  // Validate room is ready
  if (!canStartGame(room)) {
    throw new Error('Cannot start game: not all conditions met');
  }

  // Transition to PLAYING
  return transitionRoomState(
    room,
    'PLAYING' as RoomState,
    'Game force started by host'
  );
}

/**
 * Initialize game state for a room
 */
export function initializeGameState(
  room: Room,
  gameId: string,
  currentRank: string = '2'
): GameState {
  // Get players in seat order (S, N, E, W) - host is South
  const seatOrder: SeatPosition[] = [
    'S' as SeatPosition,
    'N' as SeatPosition,
    'E' as SeatPosition,
    'W' as SeatPosition,
  ];

  const players = seatOrder
    .map((pos) => getSeatByPosition(room, pos))
    .filter((seat) => seat.player !== null)
    .map((seat) => ({
      ...seat.player!,
      position: seat.position,
    }));

  if (players.length !== 4) {
    throw new Error('Cannot initialize game: need exactly 4 players');
  }

  // Create and shuffle deck
  const deck = shuffleDeck(createDeck());

  // Deal cards to players - pass player IDs in correct order
  const playerIds = players.map((p) => p.profile.id);
  const hands = dealCards(deck, playerIds, seatOrder);

  // Initialize game state
  const gameState: GameState = {
    id: gameId,
    roomId: room.id,
    phase: GamePhase.PLAYING,
    roundNumber: 1,
    currentRank,
    hands,
    turn: {
      playerId: room.hostId,
      position: SeatPosition.SOUTH,
      startedAt: Date.now(),
      expiresAt: Date.now() + (room.config.turnTimeoutMs || 30000),
      consecutivePasses: 0,
    },
    playHistory: [],
    roundResults: [],
    startedAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
  };

  return gameState;
}

/**
 * Start game from room
 */
export function startGame(
  room: Room,
  gameId: string
): { room: Room; gameState: GameState } {
  // Validate room can start
  if (!canStartGame(room)) {
    throw new Error('Cannot start game: room not ready');
  }

  // Clear auto-fill timer
  let updatedRoom = clearAutoFillTimer(room);

  // Initialize game state
  const gameState = initializeGameState(
    updatedRoom,
    gameId,
    updatedRoom.config.startingRank
  );

  // Transition room to PLAYING
  updatedRoom = transitionRoomState(
    updatedRoom,
    'PLAYING' as RoomState,
    'Game started'
  );

  // Set current game ID
  updatedRoom = {
    ...updatedRoom,
    currentGameId: gameId,
    updatedAt: Date.now(),
  };

  return {
    room: updatedRoom,
    gameState,
  };
}

/**
 * Get ready status for all players
 */
export function getReadyStatus(room: Room): {
  totalPlayers: number;
  readyCount: number;
  notReadyCount: number;
  allReady: boolean;
  readyPlayers: string[];
  notReadyPlayers: string[];
} {
  const occupiedSeats = getOccupiedSeats(room);
  const readySeats = occupiedSeats.filter((seat) => seat.isReady);
  const notReadySeats = occupiedSeats.filter((seat) => !seat.isReady);

  return {
    totalPlayers: occupiedSeats.length,
    readyCount: readySeats.length,
    notReadyCount: notReadySeats.length,
    allReady: areAllPlayersReady(room),
    readyPlayers: readySeats.map((seat) => seat.player!.profile.nickname),
    notReadyPlayers: notReadySeats.map((seat) => seat.player!.profile.nickname),
  };
}

/**
 * Validate ready state change
 */
export function canToggleReady(
  room: Room,
  playerId: string
): { canToggle: boolean; reason?: string } {
  // Room must be in WAITING state
  if (room.state !== 'WAITING') {
    return {
      canToggle: false,
      reason: `Cannot toggle ready in ${room.state} state`,
    };
  }

  // Find player's seat
  const seat = Object.values(room.seats).find(
    (s) => s.player?.profile.id === playerId
  );

  if (!seat || !seat.player) {
    return {
      canToggle: false,
      reason: 'Player not in room',
    };
  }

  // AI players cannot toggle ready
  if (seat.player.profile.isAI) {
    return {
      canToggle: false,
      reason: 'AI players are always ready',
    };
  }

  return { canToggle: true };
}

/**
 * Get countdown display info
 */
export function getCountdownInfo(countdown: GameStartCountdown | null): {
  isActive: boolean;
  timeRemaining: number;
  progress: number; // 0-1
} {
  if (!countdown || !countdown.isActive) {
    return {
      isActive: false,
      timeRemaining: 0,
      progress: 0,
    };
  }

  const timeRemaining = getCountdownTimeRemaining(countdown);
  const progress = 1 - timeRemaining / countdown.durationMs;

  return {
    isActive: true,
    timeRemaining,
    progress: Math.max(0, Math.min(1, progress)),
  };
}

/**
 * Check if room can accept ready state changes
 */
export function canAcceptReadyChanges(room: Room): boolean {
  return room.state === 'WAITING';
}

/**
 * Get game start requirements status
 */
export function getGameStartRequirements(room: Room): {
  canStart: boolean;
  requirements: {
    roomFull: boolean;
    allReady: boolean;
    correctState: boolean;
  };
  missingRequirements: string[];
} {
  const roomFull = isRoomFull(room);
  const allReady = areAllPlayersReady(room) && roomFull;
  const correctState = room.state === 'WAITING' || room.state === 'STARTING';

  const missingRequirements: string[] = [];
  if (!roomFull) missingRequirements.push('Room must have 4 players');
  if (!allReady) missingRequirements.push('All players must be ready');
  if (!correctState)
    missingRequirements.push('Room must be in WAITING or STARTING state');

  return {
    canStart: roomFull && allReady && correctState,
    requirements: {
      roomFull,
      allReady,
      correctState,
    },
    missingRequirements,
  };
}
