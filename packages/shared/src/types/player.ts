/**
 * Player types and related structures
 */

/**
 * AI difficulty levels
 */
export enum AILevel {
  SIMPLE = 'Simple',
  NORMAL = 'Normal',
  HARD = 'Hard',
}

/**
 * Player profile information
 */
export interface PlayerProfile {
  /** Unique player ID */
  id: string;

  /** Display name/nickname */
  nickname: string;

  /** Avatar URL or identifier */
  avatar: string;

  /** Player level (8-18 for AI, can be higher for humans) */
  level: number;

  /** Display coins (virtual currency) */
  coins: number;

  /** Whether this is an AI player */
  isAI: boolean;

  /** AI difficulty if AI player */
  aiDifficulty?: 'Simple' | 'Normal' | 'Hard';
}

/**
 * Player statistics
 */
export interface PlayerStats {
  /** Total games played */
  gamesPlayed: number;

  /** Games won */
  gamesWon: number;

  /** Win rate (0-1) */
  winRate: number;

  /** Current rank (2-A) */
  currentRank: string;

  /** Highest rank achieved */
  highestRank: string;

  /** Total bombs played */
  bombsPlayed: number;

  /** 头游 (first place) count */
  firstPlaceCount: number;
}

/**
 * Player session information
 */
export interface PlayerSession {
  /** Player ID */
  playerId: string;

  /** WebSocket connection ID */
  connectionId?: string;

  /** Session token for authentication */
  sessionToken: string;

  /** Session created at */
  createdAt: number;

  /** Last activity timestamp */
  lastActivity: number;

  /** Whether player is currently connected */
  isConnected: boolean;
}

/**
 * Complete player object
 */
export interface Player {
  /** Player profile */
  profile: PlayerProfile;

  /** Player statistics */
  stats: PlayerStats;

  /** Current session (if connected) */
  session?: PlayerSession;
}

/**
 * Simplified AI player for game logic
 * Used by AI generator and game engine
 */
export interface AIPlayer {
  /** Unique AI player ID (starts with 'ai_') */
  id: string;

  /** Display nickname */
  nickname: string;

  /** Avatar identifier */
  avatar: string;

  /** Player level (8-18) */
  level: number;

  /** Display coins (50k-200k) */
  coins: number;

  /** Current rank in game */
  currentRank: string;

  /** AI difficulty level */
  aiLevel: AILevel;

  /** Whether AI is ready (always true) */
  isReady: boolean;
}

/**
 * Full AI player extends Player with AI-specific properties
 * Used for complete player management
 */
export interface AIPlayerFull extends Player {
  profile: PlayerProfile & {
    isAI: true;
    aiDifficulty: AILevel;
  };

  /** AI decision delay (ms) */
  thinkDelay: number;

  /** AI win rate target (0-1) */
  targetWinRate: number;
}
