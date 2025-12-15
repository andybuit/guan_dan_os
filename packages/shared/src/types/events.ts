/**
 * WebSocket event types for real-time communication
 */

import type { Card } from './card';
import type {
  GameState,
  RoundResult,
  TributeAction,
  TributeReturnAction,
} from './game';
import type { AIPlayer, Player } from './player';
import type { Room, SeatPosition } from './room';

/**
 * WebSocket event type enum
 */
export enum WSEventType {
  // Connection events
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTED = 'RECONNECTED',
  ERROR = 'ERROR',

  // Room events
  ROOM_CREATED = 'ROOM_CREATED',
  ROOM_UPDATED = 'ROOM_UPDATED',
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  AI_JOINED = 'AI_JOINED',
  PLAYER_READY = 'PLAYER_READY',
  PLAYER_UNREADY = 'PLAYER_UNREADY',

  // Game start events
  GAME_STARTING = 'GAME_STARTING',
  GAME_STARTED = 'GAME_STARTED',
  CARDS_DEALT = 'CARDS_DEALT',

  // Game play events
  TURN_STARTED = 'TURN_STARTED',
  CARD_PLAYED = 'CARD_PLAYED',
  PLAYER_PASSED = 'PLAYER_PASSED',
  ROUND_END = 'ROUND_END',

  // Tribute events
  TRIBUTE_PHASE_START = 'TRIBUTE_PHASE_START',
  TRIBUTE_GIVEN = 'TRIBUTE_GIVEN',
  TRIBUTE_RETURN_GIVEN = 'TRIBUTE_RETURN_GIVEN',
  TRIBUTE_PHASE_END = 'TRIBUTE_PHASE_END',

  // Settlement events
  GAME_END = 'GAME_END',
  SETTLEMENT = 'SETTLEMENT',

  // State sync events
  STATE_UPDATE = 'STATE_UPDATE',
  FULL_STATE_SYNC = 'FULL_STATE_SYNC',
}

/**
 * Base WebSocket event
 */
export interface WSEvent<T = any> {
  /** Event type */
  type: WSEventType;

  /** Event payload */
  payload: T;

  /** Timestamp */
  timestamp: number;

  /** Event ID (for ordering) */
  eventId: string;

  /** Room ID (if applicable) */
  roomId?: string;
}

/**
 * Connection event payloads
 */
export interface ConnectedPayload {
  playerId: string;
  connectionId: string;
  sessionToken: string;
}

export interface DisconnectedPayload {
  playerId: string;
  reason: string;
}

export interface ReconnectedPayload {
  playerId: string;
  connectionId: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
  details?: any;
}

/**
 * Room event payloads
 */
export interface RoomCreatedPayload {
  room: Room;
}

export interface RoomUpdatedPayload {
  room: Room;
  changes: Partial<Room>;
}

export interface PlayerJoinedPayload {
  player: Player;
  position: SeatPosition;
  room: Room;
}

export interface PlayerLeftPayload {
  playerId: string;
  position: SeatPosition;
  room: Room;
}

export interface AIJoinedPayload {
  aiPlayer: AIPlayer;
  position: SeatPosition;
  reason: 'timeout' | 'manual';
  room: Room;
}

export interface PlayerReadyPayload {
  playerId: string;
  position: SeatPosition;
  isReady: boolean;
}

/**
 * Game start event payloads
 */
export interface GameStartingPayload {
  countdown: number; // seconds
  gameId: string;
}

export interface GameStartedPayload {
  gameState: GameState;
}

export interface CardsDealtPayload {
  /** Player's hand (only sent to that player) */
  hand: Card[];

  /** Other players' card counts */
  otherPlayerCounts: Record<SeatPosition, number>;
}

/**
 * Game play event payloads
 */
export interface TurnStartedPayload {
  playerId: string;
  position: SeatPosition;
  expiresAt: number;
  lastPlay?: {
    playerId: string;
    cards: Card[];
    cardType: string;
  };
}

export interface CardPlayedPayload {
  playerId: string;
  position: SeatPosition;
  cards: Card[];
  cardType: string;
  strength: number;
  remainingCards: number;
}

export interface PlayerPassedPayload {
  playerId: string;
  position: SeatPosition;
}

export interface RoundEndPayload {
  winnerId: string;
  winnerPosition: SeatPosition;
  nextPlayerId: string;
  nextPosition: SeatPosition;
}

/**
 * Tribute event payloads
 */
export interface TributePhaseStartPayload {
  tributes: TributeAction[];
}

export interface TributeGivenPayload {
  tribute: TributeAction;
}

export interface TributeReturnGivenPayload {
  tributeReturn: TributeReturnAction;
}

export interface TributePhaseEndPayload {
  startingPlayerId: string;
  startingPosition: SeatPosition;
}

/**
 * Settlement event payloads
 */
export interface GameEndPayload {
  winnerId: string;
  winnerPosition: SeatPosition;
  finalRank: string;
}

export interface SettlementPayload {
  roundResult: RoundResult;
  continueToNextRound: boolean;
}

/**
 * State sync event payloads
 */
export interface StateUpdatePayload {
  changes: Partial<GameState>;
  version: number;
}

export interface FullStateSyncPayload {
  gameState: GameState;
  playerHand: Card[];
  otherPlayerCounts: Record<SeatPosition, number>;
}

/**
 * Type-safe event creator
 */
export function createWSEvent<T extends WSEventType>(
  type: T,
  payload: any,
  roomId?: string
): WSEvent {
  return {
    type,
    payload,
    timestamp: Date.now(),
    eventId: `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    roomId,
  };
}
