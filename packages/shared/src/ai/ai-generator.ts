/**
 * AI Player Attribute Generator
 * Generates random attributes for AI players including nicknames, levels, coins, and avatars
 */

import { Rank } from '../types/card';
import { AILevel, AIPlayer } from '../types/player';

// System default AI avatars (6 options)
const AI_AVATARS = [
  'avatar_robot_1',
  'avatar_robot_2',
  'avatar_robot_3',
  'avatar_robot_4',
  'avatar_robot_5',
  'avatar_robot_6',
] as const;

export type AIAvatar = (typeof AI_AVATARS)[number];

/**
 * Generate a random AI player with all attributes
 * @param difficulty The AI difficulty level (SIMPLE, NORMAL, HARD)
 * @param seed Optional seed for deterministic generation (for testing)
 * @returns Fully configured AI player
 */
export function generateAIPlayer(difficulty: AILevel, seed?: number): AIPlayer {
  const playerNumber = generatePlayerNumber(seed);
  const nickname = generateNickname(playerNumber);
  const level = generateLevel(seed);
  const coins = generateCoins(seed);
  const avatar = generateAvatar(seed);

  return {
    id: `ai_${Date.now()}_${playerNumber}`,
    nickname,
    avatar,
    level,
    coins,
    currentRank: Rank.TWO, // All AI start at rank 2
    aiLevel: difficulty,
    isReady: true, // AI is always ready
  };
}

/**
 * Generate AI player number (used for nickname)
 * @param seed Optional seed for deterministic generation
 * @returns Random number between 1000-9999
 */
function generatePlayerNumber(seed?: number): number {
  if (seed !== undefined) {
    // Simple seeded random for testing
    const x = Math.sin(seed) * 10000;
    return 1000 + Math.floor((x - Math.floor(x)) * 9000);
  }
  return 1000 + Math.floor(Math.random() * 9000);
}

/**
 * Generate AI player nickname
 * Format: "AI玩家{number}" where number is 1000-9999
 * @param playerNumber The player number (1000-9999)
 * @returns Formatted nickname
 */
function generateNickname(playerNumber: number): string {
  return `AI玩家${playerNumber}`;
}

/**
 * Generate random AI level between 8-18
 * @param seed Optional seed for deterministic generation
 * @returns Random level between 8 and 18 inclusive
 */
function generateLevel(seed?: number): number {
  if (seed !== undefined) {
    const x = Math.sin(seed * 1.5) * 10000;
    return 8 + Math.floor((x - Math.floor(x)) * 11);
  }
  return 8 + Math.floor(Math.random() * 11);
}

/**
 * Generate random AI coins display between 50k-200k
 * @param seed Optional seed for deterministic generation
 * @returns Random coins between 50000 and 200000
 */
function generateCoins(seed?: number): number {
  if (seed !== undefined) {
    const x = Math.sin(seed * 2.3) * 10000;
    return 50000 + Math.floor((x - Math.floor(x)) * 150000);
  }
  return 50000 + Math.floor(Math.random() * 150000);
}

/**
 * Select random AI avatar from 6 system defaults
 * @param seed Optional seed for deterministic generation
 * @returns Random avatar identifier
 */
function generateAvatar(seed?: number): AIAvatar {
  if (seed !== undefined) {
    const x = Math.sin(seed * 3.7) * 10000;
    const index = Math.floor((x - Math.floor(x)) * AI_AVATARS.length);
    return AI_AVATARS[index];
  }
  const index = Math.floor(Math.random() * AI_AVATARS.length);
  return AI_AVATARS[index];
}

/**
 * Generate multiple AI players
 * @param count Number of AI players to generate
 * @param difficulty The AI difficulty level
 * @param seed Optional seed for deterministic generation
 * @returns Array of AI players
 */
export function generateAIPlayers(
  count: number,
  difficulty: AILevel,
  seed?: number
): AIPlayer[] {
  const players: AIPlayer[] = [];
  for (let i = 0; i < count; i++) {
    const playerSeed = seed !== undefined ? seed + i : undefined;
    players.push(generateAIPlayer(difficulty, playerSeed));
  }
  return players;
}

/**
 * Check if a player ID belongs to an AI player
 * @param playerId The player ID to check
 * @returns True if the player is an AI
 */
export function isAIPlayerId(playerId: string): boolean {
  return playerId.startsWith('ai_');
}

/**
 * Get AI avatar URLs (for frontend integration)
 * @returns Array of avatar identifiers
 */
export function getAIAvatars(): readonly AIAvatar[] {
  return AI_AVATARS;
}
