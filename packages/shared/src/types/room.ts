/**
 * Room types and lifecycle states
 */

import type { Player } from './player';

/**
 * Room lifecycle states (6 states)
 */
export enum RoomState {
  CREATED = 'CREATED', // Room just created
  WAITING = 'WAITING', // Accepting players
  STARTING = 'STARTING', // Countdown to game start
  PLAYING = 'PLAYING', // Game in progress
  ENDING = 'ENDING', // Settlement in progress
  CLOSING = 'CLOSING', // Cleanup before close
}

/**
 * Seat positions (absolute directional)
 */
export enum SeatPosition {
  NORTH = 'N', // 北 (上方) - Host's teammate
  SOUTH = 'S', // 南 (下方) - Host
  EAST = 'E', // 东 (右方) - Opponent
  WEST = 'W', // 西 (左方) - Opponent
}

/**
 * Team assignment
 * N-S are teammates, E-W are opponents
 */
export enum Team {
  NS = 'NS', // North-South team
  EW = 'EW', // East-West team
}

/**
 * Seat information
 */
export interface Seat {
  /** Seat position */
  position: SeatPosition;

  /** Player in this seat (null if empty) */
  player: Player | null;

  /** Whether this seat is ready */
  isReady: boolean;

  /** Whether this seat is the host */
  isHost: boolean;

  /** Team assignment */
  team: Team;
}

/**
 * Room configuration
 */
export interface RoomConfig {
  /** Bet amount (virtual coins) */
  bet: number;

  /** Starting rank for this game */
  startingRank: string;

  /** Whether to allow AI auto-fill */
  allowAIAutoFill: boolean;

  /** AI auto-fill timeout (default 10s) */
  autoFillTimeoutMs: number;

  /** Turn timeout (default 30s) */
  turnTimeoutMs: number;

  /** Whether this is a private room */
  isPrivate: boolean;
}

/**
 * Room information
 */
export interface Room {
  /** Unique room ID */
  id: string;

  /** 6-digit room code for joining */
  roomCode: string;

  /** Current room state */
  state: RoomState;

  /** Room configuration */
  config: RoomConfig;

  /** All 4 seats (N/S/E/W) */
  seats: {
    [SeatPosition.NORTH]: Seat;
    [SeatPosition.SOUTH]: Seat;
    [SeatPosition.EAST]: Seat;
    [SeatPosition.WEST]: Seat;
  };

  /** Host player ID */
  hostId: string;

  /** Room created at timestamp */
  createdAt: number;

  /** Room last updated timestamp */
  updatedAt: number;

  /** Current game ID (if game in progress) */
  currentGameId?: string;

  /** AI auto-fill timer (timestamp when AI should be added) */
  autoFillTimerExpiry?: number;
}

/**
 * Room list item (for lobby display)
 */
export interface RoomListItem {
  id: string;
  roomCode: string;
  state: RoomState;
  playerCount: number;
  maxPlayers: number;
  hostName: string;
  bet: number;
  isPrivate: boolean;
  createdAt: number;
}
