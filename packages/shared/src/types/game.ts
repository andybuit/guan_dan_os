/**
 * Game state types and structures
 */

import type { Card, CardPlay, PlayerHand } from './card';
import type { SeatPosition } from './room';

/**
 * Game phase
 */
export enum GamePhase {
  TRIBUTE = 'TRIBUTE', // 进贡/抗贡 phase
  TRIBUTE_RETURN = 'TRIBUTE_RETURN', // 还贡 phase
  PLAYING = 'PLAYING', // Normal play
  ROUND_END = 'ROUND_END', // Round ended (all passed)
  GAME_END = 'GAME_END', // Game ended (someone reached A)
}

/**
 * Player ranking in a round
 */
export enum PlayerRanking {
  FIRST = 'FIRST', // 头游
  SECOND = 'SECOND', // 二游
  THIRD = 'THIRD', // 三游
  LAST = 'LAST', // 末游
}

/**
 * Tribute action
 */
export interface TributeAction {
  /** Player giving tribute */
  fromPlayerId: string;
  fromPosition: SeatPosition;

  /** Player receiving tribute */
  toPlayerId: string;
  toPosition: SeatPosition;

  /** Card(s) being tributed */
  cards: Card[];

  /** Whether this is counter-tribute (抗贡) */
  isCounterTribute: boolean;
}

/**
 * Tribute return action
 */
export interface TributeReturnAction {
  /** Player returning tribute */
  fromPlayerId: string;
  fromPosition: SeatPosition;

  /** Player receiving return */
  toPlayerId: string;
  toPosition: SeatPosition;

  /** Card being returned (must be ≤10) */
  card: Card;
}

/**
 * Round result
 */
export interface RoundResult {
  /** Round number */
  roundNumber: number;

  /** Player rankings */
  rankings: {
    playerId: string;
    position: SeatPosition;
    ranking: PlayerRanking;
  }[];

  /** Tribute actions */
  tributes: TributeAction[];

  /** Tribute return actions */
  tributeReturns: TributeReturnAction[];

  /** Rank progression for winners */
  rankProgression: {
    playerId: string;
    position: SeatPosition;
    oldRank: string;
    newRank: string;
    levelsGained: number; // 1, 2, or 3
  }[];

  /** Coin changes */
  coinChanges: {
    playerId: string;
    change: number; // positive or negative
  }[];
}

/**
 * Turn information
 */
export interface Turn {
  /** Current player's ID */
  playerId: string;

  /** Current player's seat position */
  position: SeatPosition;

  /** Turn started at timestamp */
  startedAt: number;

  /** Turn expires at timestamp (30s timeout) */
  expiresAt: number;

  /** Last play in current round (cards to beat) */
  lastPlay?: CardPlay;

  /** Player who made last play */
  lastPlayerId?: string;

  /** Number of consecutive passes */
  consecutivePasses: number;
}

/**
 * Complete game state
 */
export interface GameState {
  /** Unique game ID */
  id: string;

  /** Room ID */
  roomId: string;

  /** Current game phase */
  phase: GamePhase;

  /** Current round number */
  roundNumber: number;

  /** Current rank being played (2-A) */
  currentRank: string;

  /** Player hands (map of playerId -> hand) */
  hands: Record<string, PlayerHand>;

  /** Current turn information */
  turn: Turn;

  /** Play history for current round */
  playHistory: CardPlay[];

  /** Round results history */
  roundResults: RoundResult[];

  /** Game started at timestamp */
  startedAt: number;

  /** Game updated at timestamp */
  updatedAt: number;

  /** State version (for conflict resolution) */
  version: number;
}

/**
 * Game state snapshot (for reconnection)
 */
export interface GameStateSnapshot {
  /** Full game state */
  state: GameState;

  /** Player-specific hand (filtered) */
  playerHand: Card[];

  /** Other players' card counts */
  otherPlayerCounts: Record<SeatPosition, number>;

  /** Snapshot timestamp */
  timestamp: number;
}
