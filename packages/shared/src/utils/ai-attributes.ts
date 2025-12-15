/**
 * AI attribute generation utilities
 * Generates realistic attributes for AI players (nickname, level, coins, avatar)
 */

import { randomBytes } from 'crypto';
import { AILevel } from '../types/player';

/**
 * System avatar identifiers (6 default avatars)
 */
const SYSTEM_AVATARS = [
  'avatar_1',
  'avatar_2',
  'avatar_3',
  'avatar_4',
  'avatar_5',
  'avatar_6',
] as const;

/**
 * Generate a random integer in range [min, max] (inclusive)
 */
function randomInt(min: number, max: number): number {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValue = Math.pow(256, bytesNeeded);
  const threshold = maxValue - (maxValue % range);

  let value: number;
  do {
    const bytes = randomBytes(bytesNeeded);
    value = bytes.readUIntBE(0, bytesNeeded);
  } while (value >= threshold);

  return min + (value % range);
}

/**
 * Generate a random AI nickname
 * Format: "AI玩家" + number (e.g., "AI玩家1", "AI玩家42")
 */
export function generateAINickname(): string {
  const number = randomInt(1, 9999);
  return `AI玩家${number}`;
}

/**
 * Generate a random AI level (8-18)
 * Lower levels for Simple AI, higher for Hard AI
 */
export function generateAILevel(difficulty: AILevel): number {
  switch (difficulty) {
    case AILevel.SIMPLE:
      return randomInt(8, 11); // 8-11 for Simple
    case AILevel.NORMAL:
      return randomInt(12, 15); // 12-15 for Normal
    case AILevel.HARD:
      return randomInt(16, 18); // 16-18 for Hard
    default:
      return randomInt(8, 18);
  }
}

/**
 * Generate random AI coins display (50,000 - 200,000)
 * Display only, not used for actual gameplay
 */
export function generateAICoins(): number {
  return randomInt(50000, 200000);
}

/**
 * Select a random AI avatar from system defaults
 */
export function generateAIAvatar(): string {
  const index = randomInt(0, SYSTEM_AVATARS.length - 1);
  return SYSTEM_AVATARS[index];
}

/**
 * Generate complete AI player attributes
 */
export interface AIAttributes {
  nickname: string;
  level: number;
  coins: number;
  avatar: string;
  isReady: boolean; // AI is always ready
}

/**
 * Generate all attributes for an AI player at once
 */
export function generateAIAttributes(difficulty: AILevel): AIAttributes {
  return {
    nickname: generateAINickname(),
    level: generateAILevel(difficulty),
    coins: generateAICoins(),
    avatar: generateAIAvatar(),
    isReady: true, // AI is always ready
  };
}

/**
 * Generate a complete AI Player object
 */
export function generateAIPlayer(
  difficulty: 'simple' | 'normal' | 'hard' = 'normal'
): import('../types/player').Player {
  const aiLevel =
    difficulty === 'simple'
      ? AILevel.SIMPLE
      : difficulty === 'hard'
        ? AILevel.HARD
        : AILevel.NORMAL;

  const attributes = generateAIAttributes(aiLevel);

  return {
    profile: {
      id: `ai-${randomInt(100000, 999999)}`,
      nickname: attributes.nickname,
      avatar: attributes.avatar,
      level: attributes.level,
      coins: attributes.coins,
      isAI: true,
    },
    stats: {
      gamesPlayed: randomInt(100, 1000),
      gamesWon: 0,
      winRate: 0,
      currentRank: '2',
      highestRank: '2',
      bombsPlayed: 0,
      firstPlaceCount: 0,
    },
    session: undefined,
  };
}
