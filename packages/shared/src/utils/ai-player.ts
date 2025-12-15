/**
 * AI Player Implementation
 * Manages AI behavior with difficulty levels: Simple, Normal, Hard
 */

import { randomBytes } from 'crypto';
import { PlayableCombo } from '../ai/combo-detector';
import { AILevel } from '../types/player';
import {
  DecisionContext,
  makeAIDecision,
  PlayDecision,
  shouldPass,
} from './ai-decision';

/**
 * AI difficulty configuration
 */
interface DifficultyConfig {
  /** Randomness factor (0-1, higher = more random) */
  randomness: number;

  /** Think delay range in milliseconds [min, max] */
  thinkDelay: [number, number];

  /** Target win rate (0-1) */
  targetWinRate: number;

  /** Number of top plays to consider */
  topPlaysCount: number;
}

/**
 * Difficulty configurations
 */
const DIFFICULTY_CONFIGS: Record<AILevel, DifficultyConfig> = {
  [AILevel.SIMPLE]: {
    randomness: 0.5, // 50% random choice
    thinkDelay: [1000, 2000], // 1-2 seconds
    targetWinRate: 0.3, // 30% win rate
    topPlaysCount: 3, // Choose from top 3 plays
  },
  [AILevel.NORMAL]: {
    randomness: 0.2, // 20% random choice
    thinkDelay: [1500, 2500], // 1.5-2.5 seconds
    targetWinRate: 0.45, // 45% win rate
    topPlaysCount: 2, // Choose from top 2 plays
  },
  [AILevel.HARD]: {
    randomness: 0.05, // 5% random choice
    thinkDelay: [2000, 3000], // 2-3 seconds
    targetWinRate: 0.55, // 55% win rate
    topPlaysCount: 1, // Always choose best play
  },
};

/**
 * Generate random float in range [0, 1)
 */
function randomFloat(): number {
  const bytes = randomBytes(4);
  const value = bytes.readUInt32BE(0);
  return value / 0xffffffff;
}

/**
 * Generate random integer in range [min, max] (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(randomFloat() * (max - min + 1)) + min;
}

/**
 * Get think delay for AI difficulty
 */
export function getThinkDelay(difficulty: AILevel): number {
  const config = DIFFICULTY_CONFIGS[difficulty];
  return randomInt(config.thinkDelay[0], config.thinkDelay[1]);
}

/**
 * AI player decision maker
 * Returns best play or null to pass, accounting for difficulty
 */
export async function makeAIPlay(
  difficulty: AILevel,
  context: DecisionContext
): Promise<PlayableCombo | null> {
  const config = DIFFICULTY_CONFIGS[difficulty];

  // Check if should pass
  if (shouldPass(context)) {
    return null;
  }

  // Get best decision
  const decision = makeAIDecision(context);
  if (!decision) {
    return null;
  }

  // Apply difficulty-based randomness
  const play = applyDifficultyRandomness(difficulty, context, decision);

  return play;
}

/**
 * Apply randomness based on difficulty level
 * Simple: Random from top 3 plays
 * Normal: Weighted choice with 20% randomness
 * Hard: Optimal with 5% randomness
 */
function applyDifficultyRandomness(
  difficulty: AILevel,
  context: DecisionContext,
  bestDecision: PlayDecision
): PlayableCombo {
  const config = DIFFICULTY_CONFIGS[difficulty];

  // Random chance to make suboptimal play
  if (randomFloat() < config.randomness) {
    return makeRandomPlay(context, config.topPlaysCount);
  }

  // Otherwise, use best decision
  return bestDecision.play;
}

/**
 * Make a random play from top N options
 */
function makeRandomPlay(context: DecisionContext, topN: number): PlayableCombo {
  // Get all possible decisions
  const allDecisions: PlayDecision[] = [];

  // For simplicity, just get one decision per valid play
  const { findPlayableCombos } = require('../ai/combo-detector');
  const validPlays = findPlayableCombos(
    context.hand,
    context.currentRank,
    context.gameState.turn?.lastPlay
      ? {
          cards: context.gameState.turn.lastPlay.cards,
          type: context.gameState.turn.lastPlay.cardType,
        }
      : undefined
  );

  for (const play of validPlays) {
    const decision = makeAIDecision(context);
    if (decision) {
      allDecisions.push(decision);
    }
  }

  // Sort by score
  allDecisions.sort((a, b) => b.score - a.score);

  // Pick random from top N
  const topDecisions = allDecisions.slice(0, topN);
  if (topDecisions.length === 0) {
    // Fallback to first valid play
    return validPlays[0];
  }

  const randomIndex = randomInt(0, topDecisions.length - 1);
  return topDecisions[randomIndex].play;
}

/**
 * AI player state tracking
 */
export interface AIPlayerState {
  playerId: string;
  difficulty: AILevel;
  gamesPlayed: number;
  gamesWon: number;
  currentWinRate: number;
}

/**
 * Create new AI player state
 */
export function createAIPlayerState(
  playerId: string,
  difficulty: AILevel
): AIPlayerState {
  return {
    playerId,
    difficulty,
    gamesPlayed: 0,
    gamesWon: 0,
    currentWinRate: 0,
  };
}

/**
 * Update AI player stats after game
 */
export function updateAIStats(
  state: AIPlayerState,
  won: boolean
): AIPlayerState {
  const newGamesPlayed = state.gamesPlayed + 1;
  const newGamesWon = state.gamesWon + (won ? 1 : 0);
  const newWinRate = newGamesWon / newGamesPlayed;

  return {
    ...state,
    gamesPlayed: newGamesPlayed,
    gamesWon: newGamesWon,
    currentWinRate: newWinRate,
  };
}

/**
 * Check if AI win rate needs adjustment
 * Returns true if win rate is significantly off target
 */
export function needsWinRateAdjustment(state: AIPlayerState): boolean {
  const config = DIFFICULTY_CONFIGS[state.difficulty];

  // Need at least 20 games for meaningful stats
  if (state.gamesPlayed < 20) return false;

  // Check if win rate is ±10% off target
  const difference = Math.abs(state.currentWinRate - config.targetWinRate);
  return difference > 0.1;
}

/**
 * Adjust AI difficulty if win rate is off target
 * Returns new difficulty level or null if no adjustment needed
 */
export function adjustDifficulty(state: AIPlayerState): AILevel | null {
  if (!needsWinRateAdjustment(state)) return null;

  const config = DIFFICULTY_CONFIGS[state.difficulty];

  // If winning too much, reduce difficulty
  if (state.currentWinRate > config.targetWinRate + 0.1) {
    if (state.difficulty === AILevel.HARD) return AILevel.NORMAL;
    if (state.difficulty === AILevel.NORMAL) return AILevel.SIMPLE;
  }

  // If winning too little, increase difficulty
  if (state.currentWinRate < config.targetWinRate - 0.1) {
    if (state.difficulty === AILevel.SIMPLE) return AILevel.NORMAL;
    if (state.difficulty === AILevel.NORMAL) return AILevel.HARD;
  }

  return null;
}

/**
 * Log AI decision for debugging
 */
export function logAIDecision(
  playerId: string,
  difficulty: AILevel,
  decision: PlayDecision | null,
  passed: boolean
): void {
  // Only log in debug mode (check environment variable)
  if (process.env.AI_DEBUG !== 'true') return;

  const timestamp = new Date().toISOString();
  const action = passed ? 'PASS' : 'PLAY';

  console.log(
    JSON.stringify({
      timestamp,
      playerId,
      difficulty,
      action,
      decision: decision
        ? {
            priority: decision.priority,
            score: decision.score,
            reason: decision.reason,
            cardCount: decision.play.cards.length,
            cardType: decision.play.type,
          }
        : null,
    })
  );
}

/**
 * Get AI difficulty display info
 */
export function getAIDifficultyInfo(difficulty: AILevel): {
  name: string;
  targetWinRate: number;
  description: string;
} {
  const config = DIFFICULTY_CONFIGS[difficulty];

  const descriptions: Record<AILevel, string> = {
    [AILevel.SIMPLE]: 'Makes occasional mistakes, plays conservatively',
    [AILevel.NORMAL]: 'Balanced play with good strategy',
    [AILevel.HARD]: 'Near-optimal play with advanced tactics',
  };

  return {
    name: difficulty,
    targetWinRate: config.targetWinRate,
    description: descriptions[difficulty],
  };
}
