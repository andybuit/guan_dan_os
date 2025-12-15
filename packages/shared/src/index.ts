/**
 * Shared types, utilities, and constants for Guandan Game Platform
 */

// Export all type definitions
export * from './types/card';
export * from './types/events';
export * from './types/game';
export * from './types/player';
export * from './types/room';

// Export utility functions
export * from './utils/card-comparator';
export * from './utils/card-validators';
export * from './utils/deck';
export * from './utils/rank-system';
export * from './utils/validation';

// Export room management utilities
export * from './utils/ai-auto-fill';
export {
  addPlayerToRoom,
  canPlayerJoinRoom,
  clearAutoFillTimer,
  createRoom,
  getRoomJoinInfo,
  hasAutoFillTimerExpired,
  removePlayerFromRoom,
  setAutoFillTimer,
  shouldStartAutoFillTimer,
  validateAndParseRoomCode,
} from './utils/join-flow';
export * from './utils/ready-manager';
export * from './utils/room-manager';
export * from './utils/seat-manager';

// Export WebSocket and real-time sync utilities
export * from './utils/connection-manager';
export * from './utils/event-broadcaster';
export * from './utils/reconnection-handler';
export * from './utils/state-sync';

// Export AI modules
export * from './ai/ai-generator';
export * from './ai/combo-detector';
export * from './ai/hand-evaluator';

// Export AI utilities
export {
  generateAIAttributes,
  generateAIAvatar,
  generateAICoins,
  generateAILevel,
  type AIAttributes,
} from './utils/ai-attributes';
export * from './utils/ai-decision';
export * from './utils/ai-player';

// Re-export PlayableCombo type explicitly for clarity
export type { PlayableCombo } from './ai/combo-detector';

// Constants
export const constants = {
  APP_NAME: 'Guan Dan OS',
  VERSION: '0.0.1',

  // Game constants
  DECK_SIZE: 108,
  CARDS_PER_PLAYER: 27,
  NUM_PLAYERS: 4,

  // Timing constants
  AI_AUTO_FILL_TIMEOUT_MS: 10000, // 10 seconds
  TURN_TIMEOUT_MS: 30000, // 30 seconds
  RECONNECT_GRACE_PERIOD_MS: 30000, // 30 seconds
  GAME_START_COUNTDOWN_MS: 10000, // 10 seconds

  // AI constants
  AI_THINK_DELAY_SIMPLE_MS: 3000, // 3 seconds
  AI_THINK_DELAY_NORMAL_MS: 2000, // 2 seconds
  AI_THINK_DELAY_HARD_MS: 1000, // 1 second

  AI_TARGET_WIN_RATE_SIMPLE: 0.3, // 30%
  AI_TARGET_WIN_RATE_NORMAL: 0.45, // 45%
  AI_TARGET_WIN_RATE_HARD: 0.55, // 55%

  // Performance targets
  TARGET_SYNC_LATENCY_MS: 200, // p95 target
  TARGET_AI_DECISION_MS: 3000, // p99 target
} as const;
