/**
 * Card type validators for Guandan game
 * Implements validation for all 13 card types
 */

import { Card, CardType } from '../types/card';
import {
  countByRank,
  getRankValue,
  haveSameRank,
  haveSameSuit,
  isJoker,
  isWildcard,
  sortCardsByRank,
} from './validation';

/**
 * Result of card type identification
 */
export interface CardTypeResult {
  /** Identified card type (or null if invalid) */
  type: CardType | null;

  /** Whether the play is valid */
  isValid: boolean;

  /** Numeric strength for comparison */
  strength: number;

  /** Error message if invalid */
  error?: string;

  /** Additional metadata */
  metadata?: {
    /** Highest card rank value */
    highestRank?: number;
    /** Number of wildcards used */
    wildcardCount?: number;
    /** Bomb size (for bombs) */
    bombSize?: number;
  };
}

/**
 * Identify and validate card type for a play
 */
export function identifyCardType(
  cards: Card[],
  currentRank: string
): CardTypeResult {
  if (cards.length === 0) {
    return {
      type: null,
      isValid: false,
      strength: 0,
      error: 'No cards provided',
    };
  }

  // Mark wildcards based on current rank
  const cardsWithWildcards = cards.map((card) => ({
    ...card,
    isWildcard: isWildcard(card, currentRank),
  }));

  // Try to identify card type in order of priority
  // Four Kings (highest priority)
  const fourKings = validateFourKings(cardsWithWildcards);
  if (fourKings.isValid) return fourKings;

  // 8+ Bomb
  const bomb8Plus = validateBomb8Plus(cardsWithWildcards, currentRank);
  if (bomb8Plus.isValid) return bomb8Plus;

  // Straight Flush
  const straightFlush = validateStraightFlush(cardsWithWildcards, currentRank);
  if (straightFlush.isValid) return straightFlush;

  // 5-7 Bombs
  const bomb7 = validateBombN(cardsWithWildcards, 7, currentRank);
  if (bomb7.isValid) return bomb7;

  const bomb6 = validateBombN(cardsWithWildcards, 6, currentRank);
  if (bomb6.isValid) return bomb6;

  const bomb5 = validateBombN(cardsWithWildcards, 5, currentRank);
  if (bomb5.isValid) return bomb5;

  // 4 Bomb
  const bomb4 = validateBombN(cardsWithWildcards, 4, currentRank);
  if (bomb4.isValid) return bomb4;

  // Triple Pair Straight
  const triplePairStraight = validateTriplePairStraight(
    cardsWithWildcards,
    currentRank
  );
  if (triplePairStraight.isValid) return triplePairStraight;

  // Triple Straight
  const tripleStraight = validateTripleStraight(
    cardsWithWildcards,
    currentRank
  );
  if (tripleStraight.isValid) return tripleStraight;

  // Straight
  const straight = validateStraight(cardsWithWildcards, currentRank);
  if (straight.isValid) return straight;

  // Three with Two
  const threeWithTwo = validateThreeWithTwo(cardsWithWildcards, currentRank);
  if (threeWithTwo.isValid) return threeWithTwo;

  // Triple
  const triple = validateTriple(cardsWithWildcards, currentRank);
  if (triple.isValid) return triple;

  // Pair
  const pair = validatePair(cardsWithWildcards, currentRank);
  if (pair.isValid) return pair;

  // Single
  const single = validateSingle(cardsWithWildcards, currentRank);
  if (single.isValid) return single;

  // No valid card type identified
  return {
    type: null,
    isValid: false,
    strength: 0,
    error: 'No valid card type identified',
  };
}

/**
 * Validate Four Kings (四王)
 * Must be 4 jokers (any combination of big and small)
 */
export function validateFourKings(cards: Card[]): CardTypeResult {
  if (cards.length !== 4) {
    return { type: null, isValid: false, strength: 0 };
  }

  const allJokers = cards.every((c) => isJoker(c));
  if (!allJokers) {
    return { type: null, isValid: false, strength: 0 };
  }

  return {
    type: CardType.FOUR_KINGS,
    isValid: true,
    strength: 1000000, // Highest possible strength
  };
}

/**
 * Validate 8+ Bomb (8张及以上炸弹)
 * 8 or more cards of the same rank
 */
export function validateBomb8Plus(
  cards: Card[],
  currentRank: string
): CardTypeResult {
  if (cards.length < 8) {
    return { type: null, isValid: false, strength: 0 };
  }

  const wildcardCount = cards.filter((c) => c.isWildcard).length;
  const nonWildcards = cards.filter((c) => !c.isWildcard);

  if (nonWildcards.length === 0) {
    return { type: null, isValid: false, strength: 0 };
  }

  // All non-wildcards must be same rank
  if (!haveSameRank(nonWildcards)) {
    return { type: null, isValid: false, strength: 0 };
  }

  const baseRank = getRankValue(nonWildcards[0].rank);
  const strength = cards.length * 100 + baseRank;

  return {
    type: CardType.BOMB_8_PLUS,
    isValid: true,
    strength,
    metadata: {
      highestRank: baseRank,
      wildcardCount,
      bombSize: cards.length,
    },
  };
}

/**
 * Validate Straight Flush (同花顺)
 * Exactly 5 consecutive cards of the same suit
 */
export function validateStraightFlush(
  cards: Card[],
  currentRank: string
): CardTypeResult {
  if (cards.length !== 5) {
    return { type: null, isValid: false, strength: 0 };
  }

  const wildcardCount = cards.filter((c) => c.isWildcard).length;
  const nonWildcards = cards.filter((c) => !c.isWildcard);

  // All non-wildcards must be same suit
  if (nonWildcards.length > 0 && !haveSameSuit(nonWildcards)) {
    return { type: null, isValid: false, strength: 0 };
  }

  // Check if consecutive (wildcards can fill gaps)
  if (!areConsecutiveWithWildcards(cards, wildcardCount)) {
    return { type: null, isValid: false, strength: 0 };
  }

  const sorted = sortCardsByRank(cards);
  const highestRank = getRankValue(sorted[sorted.length - 1].rank);
  const strength = 5000 + highestRank;

  return {
    type: CardType.STRAIGHT_FLUSH,
    isValid: true,
    strength,
    metadata: {
      highestRank,
      wildcardCount,
    },
  };
}

/**
 * Validate N-card bomb (4, 5, 6, or 7 cards of same rank)
 */
export function validateBombN(
  cards: Card[],
  n: number,
  currentRank: string
): CardTypeResult {
  if (cards.length !== n) {
    return { type: null, isValid: false, strength: 0 };
  }

  const wildcardCount = cards.filter((c) => c.isWildcard).length;
  const nonWildcards = cards.filter((c) => !c.isWildcard);

  if (nonWildcards.length === 0) {
    return { type: null, isValid: false, strength: 0 };
  }

  // All non-wildcards must be same rank (wildcards can complete the bomb)
  if (!haveSameRank(nonWildcards)) {
    return { type: null, isValid: false, strength: 0 };
  }

  const baseRank = getRankValue(nonWildcards[0].rank);
  const strength = n * 100 + baseRank;

  const typeMap: Record<number, CardType> = {
    4: CardType.BOMB_4,
    5: CardType.BOMB_5,
    6: CardType.BOMB_6,
    7: CardType.BOMB_7,
  };

  return {
    type: typeMap[n] || null,
    isValid: true,
    strength,
    metadata: {
      highestRank: baseRank,
      wildcardCount,
      bombSize: n,
    },
  };
}

/**
 * Validate Triple Pair Straight (三连对)
 * 3 or more consecutive pairs (6+ cards total)
 */
export function validateTriplePairStraight(
  cards: Card[],
  currentRank: string
): CardTypeResult {
  if (cards.length < 6 || cards.length % 2 !== 0) {
    return { type: null, isValid: false, strength: 0 };
  }

  const wildcardCount = cards.filter((c) => c.isWildcard).length;
  const rankCounts = countByRank(cards.filter((c) => !c.isWildcard));

  // Each rank should appear exactly twice (with wildcards filling gaps)
  const numPairs = cards.length / 2;
  if (rankCounts.size + wildcardCount / 2 < numPairs) {
    return { type: null, isValid: false, strength: 0 };
  }

  // Ranks must be consecutive
  const ranks = Array.from(rankCounts.keys()).map((r) => getRankValue(r));
  ranks.sort((a, b) => a - b);

  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] - ranks[i - 1] > 1 + wildcardCount / 2) {
      return { type: null, isValid: false, strength: 0 };
    }
  }

  const highestRank = Math.max(...ranks);
  const strength = 3000 + highestRank;

  return {
    type: CardType.TRIPLE_PAIR_STRAIGHT,
    isValid: true,
    strength,
    metadata: {
      highestRank,
      wildcardCount,
    },
  };
}

/**
 * Validate Triple Straight (三顺/钢板)
 * 2 or more consecutive triples (6+ cards total)
 */
export function validateTripleStraight(
  cards: Card[],
  currentRank: string
): CardTypeResult {
  if (cards.length < 6 || cards.length % 3 !== 0) {
    return { type: null, isValid: false, strength: 0 };
  }

  const wildcardCount = cards.filter((c) => c.isWildcard).length;
  const nonWildcards = cards.filter((c) => !c.isWildcard);
  const rankCounts = countByRank(nonWildcards);

  // Each rank should appear exactly 3 times (with wildcards)
  const numTriples = cards.length / 3;

  // Check if we can form consecutive triples
  const ranks = Array.from(rankCounts.keys()).map((r) => getRankValue(r));
  ranks.sort((a, b) => a - b);

  if (ranks.length + wildcardCount / 3 < numTriples) {
    return { type: null, isValid: false, strength: 0 };
  }

  const highestRank = Math.max(...ranks);
  const strength = 2500 + highestRank;

  return {
    type: CardType.TRIPLE_STRAIGHT,
    isValid: true,
    strength,
    metadata: {
      highestRank,
      wildcardCount,
    },
  };
}

/**
 * Validate Straight (顺子)
 * 5 or more consecutive cards
 */
export function validateStraight(
  cards: Card[],
  currentRank: string
): CardTypeResult {
  if (cards.length < 5) {
    return { type: null, isValid: false, strength: 0 };
  }

  const wildcardCount = cards.filter((c) => c.isWildcard).length;

  if (!areConsecutiveWithWildcards(cards, wildcardCount)) {
    return { type: null, isValid: false, strength: 0 };
  }

  const sorted = sortCardsByRank(cards);
  const highestRank = getRankValue(sorted[sorted.length - 1].rank);
  const strength = 2000 + highestRank;

  return {
    type: CardType.STRAIGHT,
    isValid: true,
    strength,
    metadata: {
      highestRank,
      wildcardCount,
    },
  };
}

/**
 * Validate Three with Two (三带二/葫芦)
 * Exactly 5 cards: 3 of one rank + 2 of another
 */
export function validateThreeWithTwo(
  cards: Card[],
  currentRank: string
): CardTypeResult {
  if (cards.length !== 5) {
    return { type: null, isValid: false, strength: 0 };
  }

  const wildcardCount = cards.filter((c) => c.isWildcard).length;
  const nonWildcards = cards.filter((c) => !c.isWildcard);
  const rankCounts = countByRank(nonWildcards);

  // Should have exactly 2 distinct ranks with counts 3 and 2
  if (rankCounts.size !== 2) {
    return { type: null, isValid: false, strength: 0 };
  }

  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);

  if (counts[0] === 3 && counts[1] === 2) {
    const tripleRank = Array.from(rankCounts.entries()).find(
      ([_, count]) => count === 3
    )?.[0];

    const highestRank = tripleRank ? getRankValue(tripleRank) : 0;
    const strength = 1500 + highestRank;

    return {
      type: CardType.THREE_WITH_TWO,
      isValid: true,
      strength,
      metadata: {
        highestRank,
        wildcardCount,
      },
    };
  }

  // With wildcards, check if we can form 3+2
  if (wildcardCount > 0) {
    // Complex wildcard logic - simplified for now
    // TODO: Implement full wildcard flexibility
  }

  return { type: null, isValid: false, strength: 0 };
}

/**
 * Validate Triple (三张)
 * Exactly 3 cards of the same rank
 */
export function validateTriple(
  cards: Card[],
  currentRank: string
): CardTypeResult {
  if (cards.length !== 3) {
    return { type: null, isValid: false, strength: 0 };
  }

  const wildcardCount = cards.filter((c) => c.isWildcard).length;
  const nonWildcards = cards.filter((c) => !c.isWildcard);

  if (nonWildcards.length === 0) {
    return { type: null, isValid: false, strength: 0 };
  }

  // If wildcards present, they can complete the triple
  if (wildcardCount > 0 && nonWildcards.length > 0) {
    // All non-wildcards must be same rank
    if (!haveSameRank(nonWildcards)) {
      return { type: null, isValid: false, strength: 0 };
    }

    const baseRank = getRankValue(nonWildcards[0].rank);
    const strength = 1000 + baseRank;

    return {
      type: CardType.TRIPLE,
      isValid: true,
      strength,
      metadata: {
        highestRank: baseRank,
        wildcardCount,
      },
    };
  }

  if (!haveSameRank(nonWildcards)) {
    return { type: null, isValid: false, strength: 0 };
  }

  const baseRank = getRankValue(nonWildcards[0].rank);
  const strength = 1000 + baseRank;

  return {
    type: CardType.TRIPLE,
    isValid: true,
    strength,
    metadata: {
      highestRank: baseRank,
      wildcardCount,
    },
  };
}

/**
 * Validate Pair (对牌)
 * Exactly 2 cards of the same rank
 */
export function validatePair(
  cards: Card[],
  currentRank: string
): CardTypeResult {
  if (cards.length !== 2) {
    return { type: null, isValid: false, strength: 0 };
  }

  const wildcardCount = cards.filter((c) => c.isWildcard).length;
  const nonWildcards = cards.filter((c) => !c.isWildcard);

  if (nonWildcards.length === 0) {
    return { type: null, isValid: false, strength: 0 };
  }

  // If one wildcard, the pair is valid
  if (wildcardCount === 1 && nonWildcards.length === 1) {
    const baseRank = getRankValue(nonWildcards[0].rank);
    const strength = 500 + baseRank;

    return {
      type: CardType.PAIR,
      isValid: true,
      strength,
      metadata: {
        highestRank: baseRank,
        wildcardCount,
      },
    };
  }

  if (nonWildcards.length === 2 && !haveSameRank(nonWildcards)) {
    return { type: null, isValid: false, strength: 0 };
  }

  const baseRank = getRankValue(nonWildcards[0].rank);
  const strength = 500 + baseRank;

  return {
    type: CardType.PAIR,
    isValid: true,
    strength,
    metadata: {
      highestRank: baseRank,
      wildcardCount,
    },
  };
}

/**
 * Validate Single (单牌)
 * Exactly 1 card
 */
export function validateSingle(
  cards: Card[],
  currentRank: string
): CardTypeResult {
  if (cards.length !== 1) {
    return { type: null, isValid: false, strength: 0 };
  }

  const card = cards[0];
  const baseRank = getRankValue(card.rank);
  const strength = baseRank;

  return {
    type: CardType.SINGLE,
    isValid: true,
    strength,
    metadata: {
      highestRank: baseRank,
      wildcardCount: card.isWildcard ? 1 : 0,
    },
  };
}

/**
 * Helper: Check if cards are consecutive allowing wildcards to fill gaps
 */
function areConsecutiveWithWildcards(
  cards: Card[],
  wildcardCount: number
): boolean {
  const nonWildcards = cards.filter((c) => !c.isWildcard);

  if (nonWildcards.length === 0) return wildcardCount === cards.length;

  const sorted = sortCardsByRank(nonWildcards);
  const ranks = sorted.map((c) => getRankValue(c.rank));

  // Check for A-2-3-4-5 special case (A as 1)
  if (
    cards.length === 5 &&
    nonWildcards.some((c) => c.rank === '3') &&
    nonWildcards.some((c) => c.rank === 'A')
  ) {
    // Check if it's A-2-3-4-5 pattern
    const expectedRanks = [1, 2, 3, 4, 5]; // A=1, 2, 3, 4, 5
    const actualRanks = nonWildcards
      .map((c) => (c.rank === 'A' ? 1 : getRankValue(c.rank)))
      .sort((a, b) => a - b);

    let wildcardsNeeded = 0;
    let j = 0; // Index for actualRanks
    for (let i = 0; i < expectedRanks.length; i++) {
      if (j < actualRanks.length && actualRanks[j] === expectedRanks[i]) {
        j++;
      } else {
        wildcardsNeeded++;
      }
    }

    if (wildcardsNeeded <= wildcardCount) {
      return true;
    }
  }

  // Normal consecutive check
  let wildcardsNeeded = 0;
  for (let i = 1; i < ranks.length; i++) {
    const gap = ranks[i] - ranks[i - 1] - 1;
    if (gap < 0) return false; // Duplicate ranks
    wildcardsNeeded += gap;
  }

  return wildcardsNeeded <= wildcardCount;
}
