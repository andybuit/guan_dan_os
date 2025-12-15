/**
 * Hand Evaluation System
 * Evaluates hand strength by counting valuable card combinations
 */

import { Card, Rank, RANK_VALUES } from '../types/card';
import { isWildcard, sortCardsByRank } from '../utils/validation';

/**
 * Hand strength evaluation result
 */
export interface HandEvaluation {
  /** Overall hand strength score (0-1000+) */
  strength: number;

  /** Number of bombs in hand */
  bombCount: number;

  /** Number of straights (5+ cards) */
  straightCount: number;

  /** Number of pairs */
  pairCount: number;

  /** Number of triples */
  tripleCount: number;

  /** Number of wildcards */
  wildcardCount: number;

  /** Highest card value */
  highestValue: number;

  /** Estimated turns to finish (1-15) */
  turnsToFinish: number;

  /** Whether hand can potentially win in 1-2 turns */
  hasKillShot: boolean;
}

/**
 * Card value scoring
 * Higher ranks = higher scores
 */
const CARD_SCORES: Record<Rank, number> = {
  [Rank.TWO]: 15, // Special card in Guandan
  [Rank.THREE]: 3,
  [Rank.FOUR]: 4,
  [Rank.FIVE]: 5,
  [Rank.SIX]: 6,
  [Rank.SEVEN]: 7,
  [Rank.EIGHT]: 8,
  [Rank.NINE]: 9,
  [Rank.TEN]: 10,
  [Rank.JACK]: 11,
  [Rank.QUEEN]: 12,
  [Rank.KING]: 13,
  [Rank.ACE]: 14,
  [Rank.SMALL_JOKER]: 16,
  [Rank.BIG_JOKER]: 17,
};

/**
 * Evaluate hand strength
 * @param hand Player's current hand
 * @param currentRank Current rank in the game (for wildcard detection)
 * @returns Hand evaluation with strength score and statistics
 */
export function evaluateHand(hand: Card[], currentRank: Rank): HandEvaluation {
  const sorted = sortCardsByRank(hand);

  // Count basic statistics
  const wildcardCount = countWildcards(sorted, currentRank);
  const bombCount = countBombs(sorted, currentRank);
  const straightCount = countStraights(sorted, currentRank);
  const { pairCount, tripleCount } = countPairsAndTriples(sorted, currentRank);

  // Calculate highest card value
  const highestValue = getHighestValue(sorted);

  // Calculate strength score (0-1000+)
  const strength = calculateStrength({
    bombCount,
    straightCount,
    pairCount,
    tripleCount,
    wildcardCount,
    highestValue,
    handSize: hand.length,
  });

  // Estimate turns to finish
  const turnsToFinish = estimateTurns(hand.length, {
    bombCount,
    straightCount,
    pairCount,
    tripleCount,
    wildcardCount,
  });

  // Check for kill shot potential
  const hasKillShot = checkKillShot(hand.length, {
    bombCount,
    straightCount,
    wildcardCount,
  });

  return {
    strength,
    bombCount,
    straightCount,
    pairCount,
    tripleCount,
    wildcardCount,
    highestValue,
    turnsToFinish,
    hasKillShot,
  };
}

/**
 * Count wildcards in hand
 */
function countWildcards(hand: Card[], currentRank: Rank): number {
  return hand.filter((card) => isWildcard(card, currentRank)).length;
}

/**
 * Count bombs in hand
 * Simplified approach: look for 4+ same rank or joker combinations
 */
function countBombs(hand: Card[], currentRank: Rank): number {
  if (hand.length < 4) return 0;

  let count = 0;
  const rankCounts = new Map<Rank, number>();

  // Count cards by rank
  for (const card of hand) {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
  }

  // Check each rank for bombs (4+ of same rank)
  for (const [rank, cnt] of rankCounts.entries()) {
    if (cnt >= 4) {
      count++;
    }
  }

  // Special case: 4-joker bomb (2 small + 2 big = 1 bomb, not 2)
  const smallJokers = rankCounts.get(Rank.SMALL_JOKER) || 0;
  const bigJokers = rankCounts.get(Rank.BIG_JOKER) || 0;

  if (smallJokers >= 2 && bigJokers >= 2) {
    // If both small and big have exactly 2, it's one 4-joker bomb
    // We already counted them as 0 individual bombs (since <4 each)
    // So just add 1
    count += 1;
  }

  return count;
}

/**
 * Count straights in hand (5+ consecutive cards)
 * Simplified: just count potential straights, not exact detection
 */
function countStraights(hand: Card[], currentRank: Rank): number {
  if (hand.length < 5) return 0;

  // Count consecutive sequences in sorted hand
  const sorted = sortCardsByRank(hand);
  let count = 0;
  let consecutiveCount = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = RANK_VALUES[sorted[i - 1].rank];
    const curr = RANK_VALUES[sorted[i].rank];

    // Skip if same rank (duplicates)
    if (prev === curr) continue;

    // Check if consecutive
    if (curr === prev + 1) {
      consecutiveCount++;
      if (consecutiveCount >= 5) {
        // Found a straight of at least 5
        count++;
        consecutiveCount = 1; // Reset to look for next straight
      }
    } else {
      consecutiveCount = 1;
    }
  }

  return count;
}

/**
 * Count pairs and triples in hand
 */
function countPairsAndTriples(
  hand: Card[],
  currentRank: Rank
): { pairCount: number; tripleCount: number } {
  const rankCounts = new Map<Rank, number>();

  // Count occurrences of each rank
  for (const card of hand) {
    const rank = card.rank;
    rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
  }

  let pairCount = 0;
  let tripleCount = 0;

  // Count pairs and triples
  for (const count of rankCounts.values()) {
    if (count >= 3) {
      tripleCount += Math.floor(count / 3);
      const remainder = count % 3;
      if (remainder >= 2) {
        pairCount += 1;
      }
    } else if (count >= 2) {
      pairCount += Math.floor(count / 2);
    }
  }

  return { pairCount, tripleCount };
}

/**
 * Get highest card value in hand
 */
function getHighestValue(hand: Card[]): number {
  let highest = 0;
  for (const card of hand) {
    const value = CARD_SCORES[card.rank] || 0;
    if (value > highest) {
      highest = value;
    }
  }
  return highest;
}

/**
 * Calculate overall strength score
 * Higher scores indicate stronger hands
 */
function calculateStrength(stats: {
  bombCount: number;
  straightCount: number;
  pairCount: number;
  tripleCount: number;
  wildcardCount: number;
  highestValue: number;
  handSize: number;
}): number {
  let score = 0;

  // Bombs are extremely valuable
  score += stats.bombCount * 200;

  // Straights are very valuable (can clear many cards)
  score += stats.straightCount * 80;

  // Triples are valuable
  score += stats.tripleCount * 40;

  // Pairs are moderately valuable
  score += stats.pairCount * 20;

  // Wildcards are flexible and valuable
  score += stats.wildcardCount * 30;

  // High cards add value
  score += stats.highestValue * 5;

  // Fewer cards remaining = stronger position (but not for empty hand)
  if (stats.handSize > 0) {
    score += (27 - stats.handSize) * 10;
  }

  return score;
}

/**
 * Estimate turns needed to finish hand
 * @returns Estimated turns (1-15)
 */
function estimateTurns(
  handSize: number,
  stats: {
    bombCount: number;
    straightCount: number;
    pairCount: number;
    tripleCount: number;
    wildcardCount: number;
  }
): number {
  // Cards that can be played in combos
  let cardsInCombos = 0;
  cardsInCombos += stats.bombCount * 4; // Min 4 cards per bomb
  cardsInCombos += stats.straightCount * 5; // Min 5 cards per straight
  cardsInCombos += stats.tripleCount * 3;
  cardsInCombos += stats.pairCount * 2;

  // Remaining singles
  const singles = handSize - cardsInCombos;

  // Estimate turns
  // Combos use 1 turn each, singles use 1 turn each
  // Wildcards can help reduce singles
  const effectiveSingles = Math.max(0, singles - stats.wildcardCount);
  const totalPlays =
    stats.bombCount +
    stats.straightCount +
    stats.tripleCount +
    stats.pairCount +
    effectiveSingles;

  // Account for opponent plays (can't always play)
  const estimatedTurns = Math.ceil(totalPlays * 1.5);

  return Math.max(1, Math.min(15, estimatedTurns));
}

/**
 * Check if hand has kill shot potential (can win in 1-2 turns)
 */
function checkKillShot(
  handSize: number,
  stats: {
    bombCount: number;
    straightCount: number;
    wildcardCount: number;
  }
): boolean {
  // Very few cards left
  if (handSize <= 3) return true;

  // Has bomb and few cards
  if (stats.bombCount >= 1 && handSize <= 8) return true;

  // Has multiple bombs
  if (stats.bombCount >= 2) return true;

  // Has straight covering most of hand
  if (stats.straightCount >= 1 && handSize <= 10) return true;

  // Has many wildcards for flexibility
  if (stats.wildcardCount >= 3 && handSize <= 10) return true;

  return false;
}

/**
 * Get card value score for a single card
 * Used for sorting and prioritization
 * @param card The card to score
 * @returns Score (2-17)
 */
export function getCardValue(card: Card): number {
  return CARD_SCORES[card.rank] || 0;
}

/**
 * Compare two hands and return which is stronger
 * @returns 1 if hand1 is stronger, -1 if hand2 is stronger, 0 if equal
 */
export function compareHands(
  hand1: Card[],
  hand2: Card[],
  currentRank: Rank
): number {
  const eval1 = evaluateHand(hand1, currentRank);
  const eval2 = evaluateHand(hand2, currentRank);

  if (eval1.strength > eval2.strength) return 1;
  if (eval1.strength < eval2.strength) return -1;
  return 0;
}
