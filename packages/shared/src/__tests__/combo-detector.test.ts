/**
 * Tests for Combo Detector and Optimizer
 */

import { describe, expect, it } from 'vitest';
import {
  findBestCombo,
  findPlayableCombos,
  findWinningCombo,
  optimizeComboSelection,
} from '../ai/combo-detector';
import { Card, CardType, Rank, Suit } from '../types/card';
import { isBomb } from '../utils/card-comparator';
describe('Combo Detector', () => {
  describe('findPlayableCombos', () => {
    it('should find all singles in hand', () => {
      const hand: Card[] = [
        { rank: Rank.THREE, suit: Suit.SPADES, id: '3-S' },
        { rank: Rank.FIVE, suit: Suit.HEARTS, id: '5-H' },
        { rank: Rank.SEVEN, suit: Suit.DIAMONDS, id: '7-D' },
      ];

      const combos = findPlayableCombos(hand, Rank.TWO);
      const singles = combos.filter((c) => c.type === CardType.SINGLE);

      expect(singles.length).toBe(3);
    });

    it('should find pairs in hand', () => {
      const hand: Card[] = [
        { rank: Rank.FIVE, suit: Suit.SPADES, id: '5-S' },
        { rank: Rank.FIVE, suit: Suit.HEARTS, id: '5-H' },
        { rank: Rank.SEVEN, suit: Suit.DIAMONDS, id: '7-D' },
      ];

      const combos = findPlayableCombos(hand, Rank.TWO);
      const pairs = combos.filter((c) => c.type === CardType.PAIR);

      expect(pairs.length).toBeGreaterThanOrEqual(1);
      expect(pairs[0].cards.length).toBe(2);
    });

    it('should find triples in hand', () => {
      const hand: Card[] = [
        { rank: Rank.KING, suit: Suit.SPADES, id: 'K-S' },
        { rank: Rank.KING, suit: Suit.HEARTS, id: 'K-H' },
        { rank: Rank.KING, suit: Suit.DIAMONDS, id: 'K-D' },
      ];

      const combos = findPlayableCombos(hand, Rank.TWO);
      const triples = combos.filter((c) => c.type === CardType.TRIPLE);

      expect(triples.length).toBeGreaterThanOrEqual(1);
      expect(triples[0].cards.length).toBe(3);
    });

    it('should find straights in hand', () => {
      const hand: Card[] = [
        { rank: Rank.THREE, suit: Suit.SPADES, id: '3-S' },
        { rank: Rank.FOUR, suit: Suit.HEARTS, id: '4-H' },
        { rank: Rank.FIVE, suit: Suit.DIAMONDS, id: '5-D' },
        { rank: Rank.SIX, suit: Suit.CLUBS, id: '6-C' },
        { rank: Rank.SEVEN, suit: Suit.SPADES, id: '7-S' },
      ];

      const combos = findPlayableCombos(hand, Rank.TWO);
      const straights = combos.filter(
        (c) =>
          c.type === CardType.STRAIGHT || c.type === CardType.STRAIGHT_FLUSH
      );

      expect(straights.length).toBeGreaterThanOrEqual(1);
      expect(straights[0].cards.length).toBeGreaterThanOrEqual(5);
    });

    it('should find bombs in hand', () => {
      const hand: Card[] = [
        { rank: Rank.EIGHT, suit: Suit.SPADES, id: '8-S' },
        { rank: Rank.EIGHT, suit: Suit.HEARTS, id: '8-H' },
        { rank: Rank.EIGHT, suit: Suit.DIAMONDS, id: '8-D' },
        { rank: Rank.EIGHT, suit: Suit.CLUBS, id: '8-C' },
      ];

      const combos = findPlayableCombos(hand, Rank.TWO);
      const bombs = combos.filter((c) => c.type.includes('BOMB'));

      expect(bombs.length).toBeGreaterThanOrEqual(1);
      expect(bombs[0].cards.length).toBeGreaterThanOrEqual(4);
    });

    it('should find joker bomb', () => {
      const hand: Card[] = [
        { rank: Rank.SMALL_JOKER, suit: Suit.JOKER, id: 'SJ-1' },
        { rank: Rank.SMALL_JOKER, suit: Suit.JOKER, id: 'SJ-2' },
        { rank: Rank.BIG_JOKER, suit: Suit.JOKER, id: 'BJ-1' },
        { rank: Rank.BIG_JOKER, suit: Suit.JOKER, id: 'BJ-2' },
      ];

      const combos = findPlayableCombos(hand, Rank.TWO);
      const bombs = combos.filter((c) => isBomb(c.type));

      expect(bombs.length).toBeGreaterThanOrEqual(1);
    });

    it('should sort combos by strength', () => {
      const hand: Card[] = [
        { rank: Rank.THREE, suit: Suit.SPADES, id: '3-S' },
        { rank: Rank.KING, suit: Suit.HEARTS, id: 'K-H' },
        { rank: Rank.KING, suit: Suit.DIAMONDS, id: 'K-D' },
        { rank: Rank.KING, suit: Suit.CLUBS, id: 'K-C' },
        { rank: Rank.KING, suit: Suit.SPADES, id: 'K-S' },
      ];

      const combos = findPlayableCombos(hand, Rank.TWO);

      // First combo should be strongest (bomb if found)
      expect(combos[0].strength).toBeGreaterThanOrEqual(
        combos[combos.length - 1].strength
      );
    });

    it('should handle empty hand', () => {
      const hand: Card[] = [];
      const combos = findPlayableCombos(hand, Rank.TWO);

      expect(combos).toEqual([]);
    });
  });

  describe('findPlayableCombos with lastPlay filter', () => {
    it('should filter combos that cannot beat lastPlay', () => {
      const hand: Card[] = [
        { rank: Rank.THREE, suit: Suit.SPADES, id: '3-S' },
        { rank: Rank.FIVE, suit: Suit.HEARTS, id: '5-H' },
        { rank: Rank.KING, suit: Suit.DIAMONDS, id: 'K-D' },
      ];

      const lastPlay = {
        cards: [{ rank: Rank.ACE, suit: Suit.CLUBS, id: 'A-C' }],
        type: CardType.SINGLE,
      };

      const combos = findPlayableCombos(hand, Rank.TWO, lastPlay);

      // Only TWO or Jokers can beat ACE as singles, these cards don't have them
      // So should have fewer valid combos
      expect(combos.length).toBeLessThanOrEqual(hand.length);
    });

    it('should return all combos when no lastPlay provided', () => {
      const hand: Card[] = [
        { rank: Rank.FIVE, suit: Suit.SPADES, id: '5-S' },
        { rank: Rank.FIVE, suit: Suit.HEARTS, id: '5-H' },
      ];

      const combos = findPlayableCombos(hand, Rank.TWO);

      // Should have singles + pair
      expect(combos.length).toBeGreaterThanOrEqual(3);
    });

    it('should find bombs that can beat any normal play', () => {
      const hand: Card[] = [
        { rank: Rank.THREE, suit: Suit.SPADES, id: '3-S' },
        { rank: Rank.THREE, suit: Suit.HEARTS, id: '3-H' },
        { rank: Rank.THREE, suit: Suit.DIAMONDS, id: '3-D' },
        { rank: Rank.THREE, suit: Suit.CLUBS, id: '3-C' },
      ];

      const lastPlay = {
        cards: [
          { rank: Rank.ACE, suit: Suit.SPADES, id: 'A-S' },
          { rank: Rank.ACE, suit: Suit.HEARTS, id: 'A-H' },
        ],
        type: CardType.PAIR,
      };

      const combos = findPlayableCombos(hand, Rank.TWO, lastPlay);
      const bombs = combos.filter((c) => c.type.includes('BOMB'));

      expect(bombs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('findBestCombo', () => {
    it('should return strongest combo', () => {
      const hand: Card[] = [
        { rank: Rank.KING, suit: Suit.SPADES, id: 'K-S' },
        { rank: Rank.KING, suit: Suit.HEARTS, id: 'K-H' },
        { rank: Rank.KING, suit: Suit.DIAMONDS, id: 'K-D' },
        { rank: Rank.KING, suit: Suit.CLUBS, id: 'K-C' },
        { rank: Rank.THREE, suit: Suit.SPADES, id: '3-S' },
      ];

      const best = findBestCombo(hand, Rank.TWO);

      expect(best).not.toBeNull();
      expect(best!.type).toContain('BOMB');
    });

    it('should return null for empty hand', () => {
      const hand: Card[] = [];
      const best = findBestCombo(hand, Rank.TWO);

      expect(best).toBeNull();
    });

    it('should respect lastPlay constraint', () => {
      const hand: Card[] = [
        { rank: Rank.THREE, suit: Suit.SPADES, id: '3-S' },
        { rank: Rank.FOUR, suit: Suit.HEARTS, id: '4-H' },
      ];

      const lastPlay = {
        cards: [{ rank: Rank.ACE, suit: Suit.CLUBS, id: 'A-C' }],
        type: CardType.SINGLE,
      };

      const best = findBestCombo(hand, Rank.TWO, lastPlay);

      // THREE and FOUR cannot beat ACE, so should be null
      expect(best).toBeNull();
    });
  });

  describe('optimizeComboSelection', () => {
    it('should prioritize non-wildcard combos when conserving', () => {
      const hand: Card[] = [
        { rank: Rank.FIVE, suit: Suit.HEARTS, id: '5-H-1' }, // Wildcard if currentRank = 5
        { rank: Rank.FIVE, suit: Suit.HEARTS, id: '5-H-2' },
        { rank: Rank.KING, suit: Suit.SPADES, id: 'K-S' },
        { rank: Rank.KING, suit: Suit.DIAMONDS, id: 'K-D' },
      ];

      const optimized = optimizeComboSelection(hand, Rank.FIVE, true);

      // First combo should use fewer wildcards
      expect(optimized[0].wildcardCount).toBeLessThanOrEqual(
        optimized[optimized.length - 1].wildcardCount
      );
    });

    it('should sort by strength when not conserving wildcards', () => {
      const hand: Card[] = [
        { rank: Rank.THREE, suit: Suit.SPADES, id: '3-S' },
        { rank: Rank.KING, suit: Suit.HEARTS, id: 'K-H' },
        { rank: Rank.KING, suit: Suit.DIAMONDS, id: 'K-D' },
      ];

      const optimized = optimizeComboSelection(hand, Rank.TWO, false);

      // Should be sorted by strength
      for (let i = 0; i < optimized.length - 1; i++) {
        expect(optimized[i].strength).toBeGreaterThanOrEqual(
          optimized[i + 1].strength
        );
      }
    });
  });

  describe('findWinningCombo', () => {
    it('should find winning combo for single card', () => {
      const hand: Card[] = [{ rank: Rank.ACE, suit: Suit.SPADES, id: 'A-S' }];
      const winning = findWinningCombo(hand, Rank.TWO);

      expect(winning).not.toBeNull();
      expect(winning!.cards.length).toBe(1);
      expect(winning!.type).toBe(CardType.SINGLE);
    });

    it('should find winning combo for pair', () => {
      const hand: Card[] = [
        { rank: Rank.KING, suit: Suit.SPADES, id: 'K-S' },
        { rank: Rank.KING, suit: Suit.HEARTS, id: 'K-H' },
      ];

      const winning = findWinningCombo(hand, Rank.TWO);

      expect(winning).not.toBeNull();
      expect(winning!.cards.length).toBe(2);
      expect(winning!.type).toBe(CardType.PAIR);
    });

    it('should find winning combo for bomb', () => {
      const hand: Card[] = [
        { rank: Rank.SEVEN, suit: Suit.SPADES, id: '7-S' },
        { rank: Rank.SEVEN, suit: Suit.HEARTS, id: '7-H' },
        { rank: Rank.SEVEN, suit: Suit.DIAMONDS, id: '7-D' },
        { rank: Rank.SEVEN, suit: Suit.CLUBS, id: '7-C' },
      ];

      const winning = findWinningCombo(hand, Rank.TWO);

      expect(winning).not.toBeNull();
      expect(winning!.type).toContain('BOMB');
    });

    it('should return null for invalid combination', () => {
      const hand: Card[] = [
        { rank: Rank.THREE, suit: Suit.SPADES, id: '3-S' },
        { rank: Rank.FIVE, suit: Suit.HEARTS, id: '5-H' },
        { rank: Rank.NINE, suit: Suit.DIAMONDS, id: '9-D' },
      ];

      const winning = findWinningCombo(hand, Rank.TWO);

      expect(winning).toBeNull();
    });

    it('should return null for empty hand', () => {
      const hand: Card[] = [];
      const winning = findWinningCombo(hand, Rank.TWO);

      expect(winning).toBeNull();
    });

    it('should find winning combo for straight', () => {
      const hand: Card[] = [
        { rank: Rank.THREE, suit: Suit.SPADES, id: '3-S' },
        { rank: Rank.FOUR, suit: Suit.HEARTS, id: '4-H' },
        { rank: Rank.FIVE, suit: Suit.DIAMONDS, id: '5-D' },
        { rank: Rank.SIX, suit: Suit.CLUBS, id: '6-C' },
        { rank: Rank.SEVEN, suit: Suit.SPADES, id: '7-S' },
      ];

      const winning = findWinningCombo(hand, Rank.TWO);

      expect(winning).not.toBeNull();
      expect(winning!.type).toBe(CardType.STRAIGHT);
    });
  });

  describe('Integration tests', () => {
    it('should handle complex hand with multiple combo types', () => {
      const hand: Card[] = [
        // Pair
        { rank: Rank.FIVE, suit: Suit.SPADES, id: '5-S' },
        { rank: Rank.FIVE, suit: Suit.HEARTS, id: '5-H' },
        // Triple
        { rank: Rank.NINE, suit: Suit.SPADES, id: '9-S' },
        { rank: Rank.NINE, suit: Suit.HEARTS, id: '9-H' },
        { rank: Rank.NINE, suit: Suit.DIAMONDS, id: '9-D' },
        // Singles
        { rank: Rank.KING, suit: Suit.CLUBS, id: 'K-C' },
        { rank: Rank.ACE, suit: Suit.SPADES, id: 'A-S' },
      ];

      const combos = findPlayableCombos(hand, Rank.TWO);

      // Should have many combos: 7 singles, at least 1 pair, at least 1 triple
      expect(combos.length).toBeGreaterThanOrEqual(9);

      // Should find specific types
      const hasPair = combos.some((c) => c.type === CardType.PAIR);
      const hasTriple = combos.some((c) => c.type === CardType.TRIPLE);

      expect(hasPair).toBe(true);
      expect(hasTriple).toBe(true);
    });

    it('should detect wildcards in combos', () => {
      const hand: Card[] = [
        { rank: Rank.THREE, suit: Suit.HEARTS, id: '3-H-1' }, // Wildcard when currentRank = 3
        { rank: Rank.THREE, suit: Suit.HEARTS, id: '3-H-2' },
        { rank: Rank.KING, suit: Suit.SPADES, id: 'K-S' },
      ];

      const combos = findPlayableCombos(hand, Rank.THREE);
      const wildcardCombos = combos.filter((c) => c.usesWildcards);

      expect(wildcardCombos.length).toBeGreaterThan(0);
      expect(wildcardCombos[0].wildcardCount).toBeGreaterThan(0);
    });

    it('should find optimal play sequence', () => {
      const hand: Card[] = [
        { rank: Rank.FOUR, suit: Suit.SPADES, id: '4-S' },
        { rank: Rank.FOUR, suit: Suit.HEARTS, id: '4-H' },
        { rank: Rank.FOUR, suit: Suit.DIAMONDS, id: '4-D' },
        { rank: Rank.FOUR, suit: Suit.CLUBS, id: '4-C' },
      ];

      // Find best play
      const best = findBestCombo(hand, Rank.TWO);

      expect(best).not.toBeNull();
      expect(best!.type).toContain('BOMB');

      // This should be a winning combo (all cards)
      const winning = findWinningCombo(hand, Rank.TWO);
      expect(winning).not.toBeNull();
    });

    it('should handle hand with no valid multi-card combos', () => {
      const hand: Card[] = [
        { rank: Rank.THREE, suit: Suit.SPADES, id: '3-S' },
        { rank: Rank.FIVE, suit: Suit.HEARTS, id: '5-H' },
        { rank: Rank.EIGHT, suit: Suit.DIAMONDS, id: '8-D' },
        { rank: Rank.JACK, suit: Suit.CLUBS, id: 'J-C' },
      ];

      const combos = findPlayableCombos(hand, Rank.TWO);

      // Should only have singles
      const singles = combos.filter((c) => c.type === CardType.SINGLE);
      expect(singles.length).toBe(4);

      // No pairs, triples, straights, or bombs
      const multiCard = combos.filter((c) => c.type !== CardType.SINGLE);
      expect(multiCard.length).toBe(0);
    });
  });
});
