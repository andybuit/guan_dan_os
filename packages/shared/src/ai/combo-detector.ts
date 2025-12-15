/**
 * Combo Detector and Optimizer
 * Finds the best playable combinations in a hand
 */

import { Card, CardType, Rank } from '../types/card';
import { canBeat, isBomb } from '../utils/card-comparator';
import { identifyCardType } from '../utils/card-validators';
import { countByRank, isWildcard, sortCardsByRank } from '../utils/validation';

/**
 * Playable combo found in hand
 */
export interface PlayableCombo {
  /** Cards in this combo */
  cards: Card[];

  /** Type of card combination */
  type: CardType;

  /** Strength score (higher = stronger) */
  strength: number;

  /** Whether this combo uses wildcards */
  usesWildcards: boolean;

  /** Number of wildcards used */
  wildcardCount: number;
}

/**
 * Find all valid playable combos in hand
 * @param hand Player's current hand
 * @param currentRank Current rank in the game (for wildcard detection)
 * @param lastPlay The last play on the table (optional - if provided, only return combos that can beat it)
 * @returns Array of playable combos sorted by strength (strongest first)
 */
export function findPlayableCombos(
  hand: Card[],
  currentRank: Rank,
  lastPlay?: { cards: Card[]; type: CardType }
): PlayableCombo[] {
  const combos: PlayableCombo[] = [];

  // Find all possible combos
  combos.push(...findSingles(hand, currentRank));
  combos.push(...findPairs(hand, currentRank));
  combos.push(...findTriples(hand, currentRank));
  combos.push(...findStraights(hand, currentRank));
  combos.push(...findBombs(hand, currentRank));

  // Filter by what can beat last play
  let validCombos = combos;
  if (lastPlay) {
    validCombos = combos.filter(
      (combo) => canBeat(combo.cards, lastPlay.cards, currentRank).canBeat
    );
  }

  // Sort by strength (strongest first)
  validCombos.sort((a, b) => b.strength - a.strength);

  return validCombos;
}

/**
 * Find the best combo to play
 * @param hand Player's current hand
 * @param currentRank Current rank in the game
 * @param lastPlay The last play on the table (optional)
 * @returns Best combo to play, or null if no valid plays
 */
export function findBestCombo(
  hand: Card[],
  currentRank: Rank,
  lastPlay?: { cards: Card[]; type: CardType }
): PlayableCombo | null {
  const combos = findPlayableCombos(hand, currentRank, lastPlay);
  return combos.length > 0 ? combos[0] : null;
}

/**
 * Find all single card plays
 */
function findSingles(hand: Card[], currentRank: Rank): PlayableCombo[] {
  return hand.map((card) => ({
    cards: [card],
    type: CardType.SINGLE,
    strength: calculateComboStrength([card], CardType.SINGLE, currentRank),
    usesWildcards: isWildcard(card, currentRank),
    wildcardCount: isWildcard(card, currentRank) ? 1 : 0,
  }));
}

/**
 * Find all pair plays
 */
function findPairs(hand: Card[], currentRank: Rank): PlayableCombo[] {
  const combos: PlayableCombo[] = [];
  const rankCounts = countByRank(hand);

  for (const [rank, count] of rankCounts.entries()) {
    if (count >= 2) {
      const cardsOfRank = hand.filter((c) => c.rank === rank);

      // Just take first valid pair (no need for all combinations)
      if (cardsOfRank.length >= 2) {
        const cards = [cardsOfRank[0], cardsOfRank[1]];
        const result = identifyCardType(cards, currentRank);

        if (result.isValid && result.type === CardType.PAIR) {
          combos.push({
            cards,
            type: CardType.PAIR,
            strength: calculateComboStrength(cards, CardType.PAIR, currentRank),
            usesWildcards: cards.some((c) => isWildcard(c, currentRank)),
            wildcardCount: cards.filter((c) => isWildcard(c, currentRank))
              .length,
          });
        }
      }
    }
  }

  return combos;
}

/**
 * Find all triple plays
 */
function findTriples(hand: Card[], currentRank: Rank): PlayableCombo[] {
  const combos: PlayableCombo[] = [];
  const rankCounts = countByRank(hand);

  for (const [rank, count] of rankCounts.entries()) {
    if (count >= 3) {
      const cardsOfRank = hand.filter((c) => c.rank === rank);

      // Just take first valid triple
      if (cardsOfRank.length >= 3) {
        const cards = [cardsOfRank[0], cardsOfRank[1], cardsOfRank[2]];
        const result = identifyCardType(cards, currentRank);

        if (result.isValid && result.type === CardType.TRIPLE) {
          combos.push({
            cards,
            type: CardType.TRIPLE,
            strength: calculateComboStrength(
              cards,
              CardType.TRIPLE,
              currentRank
            ),
            usesWildcards: cards.some((c) => isWildcard(c, currentRank)),
            wildcardCount: cards.filter((c) => isWildcard(c, currentRank))
              .length,
          });
        }
      }
    }
  }

  return combos;
}

/**
 * Find all straight plays (5+ consecutive cards)
 */
function findStraights(hand: Card[], currentRank: Rank): PlayableCombo[] {
  const combos: PlayableCombo[] = [];
  const sorted = sortCardsByRank(hand);

  // Try all possible straight lengths (5 to hand.length)
  for (let length = 5; length <= sorted.length; length++) {
    // Try all possible starting positions
    for (let start = 0; start <= sorted.length - length; start++) {
      const cards = sorted.slice(start, start + length);
      const result = identifyCardType(cards, currentRank);

      if (
        result.isValid &&
        (result.type === CardType.STRAIGHT ||
          result.type === CardType.STRAIGHT_FLUSH)
      ) {
        combos.push({
          cards,
          type: result.type,
          strength: calculateComboStrength(cards, result.type, currentRank),
          usesWildcards: cards.some((c) => isWildcard(c, currentRank)),
          wildcardCount: cards.filter((c) => isWildcard(c, currentRank)).length,
        });
      }
    }
  }

  return combos;
}

/**
 * Find all bomb plays
 */
function findBombs(hand: Card[], currentRank: Rank): PlayableCombo[] {
  const combos: PlayableCombo[] = [];
  const rankCounts = countByRank(hand);

  // Find 4+ of same rank bombs
  for (const [rank, count] of rankCounts.entries()) {
    if (count >= 4) {
      const cardsOfRank = hand.filter((c) => c.rank === rank);

      // Try all possible bomb sizes (4, 5, 6, 7, 8)
      for (let size = 4; size <= Math.min(count, 8); size++) {
        // Generate all possible combinations of this size
        const combinations = generateCombinations(cardsOfRank, size);

        for (const cards of combinations) {
          const result = identifyCardType(cards, currentRank);

          if (result.isValid && result.type && isBomb(result.type)) {
            combos.push({
              cards,
              type: result.type,
              strength: calculateComboStrength(cards, result.type, currentRank),
              usesWildcards: cards.some((c) => isWildcard(c, currentRank)),
              wildcardCount: cards.filter((c) => isWildcard(c, currentRank))
                .length,
            });
          }
        }
      }
    }
  }

  // Find joker bombs (2 small + 2 big)
  const smallJokers = hand.filter((c) => c.rank === Rank.SMALL_JOKER);
  const bigJokers = hand.filter((c) => c.rank === Rank.BIG_JOKER);

  if (smallJokers.length >= 2 && bigJokers.length >= 2) {
    const cards = [smallJokers[0], smallJokers[1], bigJokers[0], bigJokers[1]];
    const result = identifyCardType(cards, currentRank);

    if (result.isValid && result.type && isBomb(result.type)) {
      combos.push({
        cards,
        type: result.type,
        strength: calculateComboStrength(cards, result.type, currentRank),
        usesWildcards: false,
        wildcardCount: 0,
      });
    }
  }

  return combos;
}

/**
 * Calculate strength score for a combo
 * Higher scores = stronger combos
 */
function calculateComboStrength(
  cards: Card[],
  type: CardType,
  currentRank: Rank
): number {
  let strength = 0;

  // Base strength by type
  const typeStrength: Record<string, number> = {
    [CardType.SINGLE]: 10,
    [CardType.PAIR]: 30,
    [CardType.TRIPLE]: 50,
    [CardType.STRAIGHT]: 100,
    [CardType.STRAIGHT_FLUSH]: 150,
    [CardType.BOMB_4]: 500,
    [CardType.BOMB_5]: 600,
    [CardType.BOMB_6]: 700,
    [CardType.BOMB_7]: 800,
    [CardType.BOMB_8_PLUS]: 900,
    [CardType.FOUR_KINGS]: 1100,
  };

  strength += typeStrength[type] || 0;

  // Add rank value of highest card
  if (cards.length > 0) {
    const highestRank = Math.max(
      ...cards.map((c) => {
        if (c.rank === Rank.BIG_JOKER) return 17;
        if (c.rank === Rank.SMALL_JOKER) return 16;
        if (c.rank === Rank.TWO) return 15;
        if (c.rank === Rank.ACE) return 14;
        if (c.rank === Rank.KING) return 13;
        if (c.rank === Rank.QUEEN) return 12;
        if (c.rank === Rank.JACK) return 11;
        return parseInt(c.rank);
      })
    );
    strength += highestRank;
  }

  return strength;
}

/**
 * Generate all combinations of size k from array
 */
function generateCombinations<T>(array: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (array.length === 0) return [];

  const [first, ...rest] = array;

  // Combinations including first element
  const withFirst = generateCombinations(rest, k - 1).map((combo) => [
    first,
    ...combo,
  ]);

  // Combinations not including first element
  const withoutFirst = generateCombinations(rest, k);

  return [...withFirst, ...withoutFirst];
}

/**
 * Optimize combo selection with wildcard usage
 * @param hand Player's current hand
 * @param currentRank Current rank in the game
 * @param conserveWildcards If true, prefer combos that don't use wildcards
 * @returns Optimized combo selection strategy
 */
export function optimizeComboSelection(
  hand: Card[],
  currentRank: Rank,
  conserveWildcards: boolean = false
): PlayableCombo[] {
  const combos = findPlayableCombos(hand, currentRank);

  if (conserveWildcards) {
    // Sort to prioritize combos without wildcards
    return combos.sort((a, b) => {
      // First by wildcard usage (fewer is better)
      if (a.wildcardCount !== b.wildcardCount) {
        return a.wildcardCount - b.wildcardCount;
      }
      // Then by strength
      return b.strength - a.strength;
    });
  }

  return combos;
}

/**
 * Check if hand can finish in one play
 * @param hand Player's current hand
 * @param currentRank Current rank in the game
 * @returns Combo to win with, or null if cannot win in one play
 */
export function findWinningCombo(
  hand: Card[],
  currentRank: Rank
): PlayableCombo | null {
  if (hand.length === 0) return null;

  // Try to play all cards as one combo
  const result = identifyCardType(hand, currentRank);

  if (result.isValid && result.type) {
    return {
      cards: hand,
      type: result.type,
      strength: calculateComboStrength(hand, result.type, currentRank),
      usesWildcards: hand.some((c) => isWildcard(c, currentRank)),
      wildcardCount: hand.filter((c) => isWildcard(c, currentRank)).length,
    };
  }

  return null;
}
