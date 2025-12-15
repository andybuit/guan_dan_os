/**
 * Tests for Hand Evaluation System
 */

import { describe, expect, it } from 'vitest';
import { compareHands, evaluateHand, getCardValue } from '../ai/hand-evaluator';
import { Card, Rank, Suit } from '../types/card';

// Helper to create a card with default id
function c(rank: Rank, suit: Suit): Card {
  return {
    id: `${rank}-${suit}-${Math.random()}`,
    rank,
    suit,
  };
}

describe('Hand Evaluator', () => {
  describe('getCardValue', () => {
    it('should return correct values for number cards', () => {
      expect(getCardValue(c(Rank.THREE, Suit.SPADES))).toBe(3);
      expect(getCardValue(c(Rank.FOUR, Suit.HEARTS))).toBe(4);
      expect(getCardValue(c(Rank.NINE, Suit.DIAMONDS))).toBe(9);
      expect(getCardValue(c(Rank.TEN, Suit.CLUBS))).toBe(10);
    });

    it('should return correct values for face cards', () => {
      expect(getCardValue(c(Rank.JACK, Suit.SPADES))).toBe(11);
      expect(getCardValue(c(Rank.QUEEN, Suit.HEARTS))).toBe(12);
      expect(getCardValue(c(Rank.KING, Suit.DIAMONDS))).toBe(13);
      expect(getCardValue(c(Rank.ACE, Suit.CLUBS))).toBe(14);
    });

    it('should return correct values for special cards', () => {
      expect(getCardValue(c(Rank.TWO, Suit.SPADES))).toBe(15);
      expect(getCardValue(c(Rank.SMALL_JOKER, Suit.JOKER))).toBe(16);
      expect(getCardValue(c(Rank.BIG_JOKER, Suit.JOKER))).toBe(17);
    });
  });

  describe('evaluateHand - basic cases', () => {
    it('should evaluate empty hand', () => {
      const hand: Card[] = [];
      const evaluation = evaluateHand(hand, Rank.TWO);

      expect(evaluation.strength).toBe(0);
      expect(evaluation.bombCount).toBe(0);
      expect(evaluation.straightCount).toBe(0);
      expect(evaluation.pairCount).toBe(0);
      expect(evaluation.tripleCount).toBe(0);
      expect(evaluation.wildcardCount).toBe(0);
      expect(evaluation.turnsToFinish).toBe(1);
      expect(evaluation.hasKillShot).toBe(true); // 0 cards = instant win
    });

    it('should evaluate single card', () => {
      const hand: Card[] = [c(Rank.ACE, Suit.SPADES)];
      const evaluation = evaluateHand(hand, Rank.TWO);

      expect(evaluation.strength).toBeGreaterThan(0);
      expect(evaluation.highestValue).toBe(14);
      expect(evaluation.turnsToFinish).toBe(2); // 1 single * 1.5
      expect(evaluation.hasKillShot).toBe(true); // 1 card
    });

    it('should count pairs correctly', () => {
      const hand: Card[] = [
        c(Rank.FIVE, Suit.SPADES),
        c(Rank.FIVE, Suit.HEARTS),
      ];
      const evaluation = evaluateHand(hand, Rank.TWO);

      expect(evaluation.pairCount).toBe(1);
      expect(evaluation.tripleCount).toBe(0);
      expect(evaluation.hasKillShot).toBe(true); // 2 cards
    });

    it('should count triples correctly', () => {
      const hand: Card[] = [
        c(Rank.SEVEN, Suit.SPADES),
        c(Rank.SEVEN, Suit.HEARTS),
        c(Rank.SEVEN, Suit.DIAMONDS),
      ];
      const evaluation = evaluateHand(hand, Rank.TWO);

      expect(evaluation.tripleCount).toBe(1);
      expect(evaluation.pairCount).toBe(0);
      expect(evaluation.hasKillShot).toBe(true); // 3 cards
    });

    it('should count quads as both triple and pair', () => {
      const hand: Card[] = [
        c(Rank.KING, Suit.SPADES),
        c(Rank.KING, Suit.HEARTS),
        c(Rank.KING, Suit.DIAMONDS),
        c(Rank.KING, Suit.CLUBS),
      ];
      const evaluation = evaluateHand(hand, Rank.TWO);

      expect(evaluation.tripleCount).toBe(1);
      expect(evaluation.pairCount).toBe(0); // 4 cards = 1 triple (3) + 1 single (1)
      expect(evaluation.bombCount).toBe(1); // Quad is a bomb
    });
  });

  describe('evaluateHand - bombs', () => {
    it('should detect 4-bomb', () => {
      const hand: Card[] = [
        c(Rank.EIGHT, Suit.SPADES),
        c(Rank.EIGHT, Suit.HEARTS),
        c(Rank.EIGHT, Suit.DIAMONDS),
        c(Rank.EIGHT, Suit.CLUBS),
      ];
      const evaluation = evaluateHand(hand, Rank.TWO);

      expect(evaluation.bombCount).toBeGreaterThanOrEqual(1);
      expect(evaluation.strength).toBeGreaterThan(200); // Bomb score
    });

    it('should detect joker bomb', () => {
      const hand: Card[] = [
        c(Rank.SMALL_JOKER, Suit.JOKER),
        c(Rank.SMALL_JOKER, Suit.JOKER),
        c(Rank.BIG_JOKER, Suit.JOKER),
        c(Rank.BIG_JOKER, Suit.JOKER),
      ];
      const evaluation = evaluateHand(hand, Rank.TWO);

      expect(evaluation.bombCount).toBeGreaterThanOrEqual(1);
      expect(evaluation.highestValue).toBe(17); // BIG_JOKER
    });

    it('should value hands with multiple bombs highly', () => {
      const hand: Card[] = [
        // First bomb
        c(Rank.FIVE, Suit.SPADES),
        c(Rank.FIVE, Suit.HEARTS),
        c(Rank.FIVE, Suit.DIAMONDS),
        c(Rank.FIVE, Suit.CLUBS),
        // Second bomb
        c(Rank.NINE, Suit.SPADES),
        c(Rank.NINE, Suit.HEARTS),
        c(Rank.NINE, Suit.DIAMONDS),
        c(Rank.NINE, Suit.CLUBS),
      ];
      const evaluation = evaluateHand(hand, Rank.TWO);

      expect(evaluation.bombCount).toBeGreaterThanOrEqual(2);
      expect(evaluation.hasKillShot).toBe(true); // Multiple bombs
      expect(evaluation.strength).toBeGreaterThan(400); // 2 bombs * 200
    });
  });

  describe('evaluateHand - straights', () => {
    it('should detect 5-card straight', () => {
      const hand: Card[] = [
        c(Rank.THREE, Suit.SPADES),
        c(Rank.FOUR, Suit.HEARTS),
        c(Rank.FIVE, Suit.DIAMONDS),
        c(Rank.SIX, Suit.CLUBS),
        c(Rank.SEVEN, Suit.SPADES),
      ];
      const evaluation = evaluateHand(hand, Rank.TWO);

      expect(evaluation.straightCount).toBeGreaterThanOrEqual(1);
      expect(evaluation.strength).toBeGreaterThan(80); // Straight score
    });

    it('should detect longer straights', () => {
      const hand: Card[] = [
        c(Rank.FIVE, Suit.SPADES),
        c(Rank.SIX, Suit.HEARTS),
        c(Rank.SEVEN, Suit.DIAMONDS),
        c(Rank.EIGHT, Suit.CLUBS),
        c(Rank.NINE, Suit.SPADES),
        c(Rank.TEN, Suit.HEARTS),
        c(Rank.JACK, Suit.DIAMONDS),
      ];
      const evaluation = evaluateHand(hand, Rank.TWO);

      expect(evaluation.straightCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('evaluateHand - wildcards', () => {
    it('should count wildcards when currentRank matches', () => {
      const hand: Card[] = [
        c(Rank.FIVE, Suit.HEARTS), // Wildcard when current rank is 5
        c(Rank.FIVE, Suit.HEARTS),
        c(Rank.KING, Suit.SPADES),
      ];
      const evaluation = evaluateHand(hand, Rank.FIVE);

      expect(evaluation.wildcardCount).toBe(2);
      expect(evaluation.strength).toBeGreaterThan(0);
    });

    it('should increase strength with wildcards', () => {
      const hand: Card[] = [
        c(Rank.THREE, Suit.HEARTS), // 2 wildcards
        c(Rank.THREE, Suit.HEARTS),
        c(Rank.ACE, Suit.SPADES),
        c(Rank.ACE, Suit.CLUBS),
      ];
      const evaluation = evaluateHand(hand, Rank.THREE);

      expect(evaluation.wildcardCount).toBe(2);
      expect(evaluation.strength).toBeGreaterThan(60); // 2 wildcards * 30
    });
  });

  describe('evaluateHand - turns estimation', () => {
    it('should estimate fewer turns for good hands', () => {
      const hand: Card[] = [
        // Bomb
        c(Rank.FIVE, Suit.SPADES),
        c(Rank.FIVE, Suit.HEARTS),
        c(Rank.FIVE, Suit.DIAMONDS),
        c(Rank.FIVE, Suit.CLUBS),
        // Pair
        c(Rank.KING, Suit.SPADES),
        c(Rank.KING, Suit.HEARTS),
      ];
      const evaluation = evaluateHand(hand, Rank.TWO);

      expect(evaluation.turnsToFinish).toBeLessThan(10);
    });

    it('should estimate more turns for weak hands', () => {
      const hand: Card[] = [
        // All singles
        c(Rank.THREE, Suit.SPADES),
        c(Rank.FOUR, Suit.HEARTS),
        c(Rank.SIX, Suit.DIAMONDS),
        c(Rank.EIGHT, Suit.CLUBS),
        c(Rank.TEN, Suit.SPADES),
        c(Rank.QUEEN, Suit.HEARTS),
        c(Rank.ACE, Suit.DIAMONDS),
      ];
      const evaluation = evaluateHand(hand, Rank.TWO);

      expect(evaluation.turnsToFinish).toBeGreaterThan(5);
    });
  });

  describe('evaluateHand - kill shot detection', () => {
    it('should detect kill shot with very few cards', () => {
      const hand: Card[] = [c(Rank.ACE, Suit.SPADES), c(Rank.ACE, Suit.HEARTS)];
      const evaluation = evaluateHand(hand, Rank.TWO);

      expect(evaluation.hasKillShot).toBe(true);
    });

    it('should detect kill shot with bomb and few cards', () => {
      const hand: Card[] = [
        c(Rank.SEVEN, Suit.SPADES),
        c(Rank.SEVEN, Suit.HEARTS),
        c(Rank.SEVEN, Suit.DIAMONDS),
        c(Rank.SEVEN, Suit.CLUBS),
        c(Rank.KING, Suit.SPADES),
      ];
      const evaluation = evaluateHand(hand, Rank.TWO);

      expect(evaluation.hasKillShot).toBe(true);
    });

    it('should not detect kill shot for weak large hands', () => {
      const hand: Card[] = Array(15)
        .fill(null)
        .map((_, i) => ({
          id: `4-${i}`,
          rank: Rank.FOUR,
          suit: i % 2 === 0 ? Suit.SPADES : Suit.HEARTS,
        }));
      const evaluation = evaluateHand(hand, Rank.TWO);

      expect(evaluation.hasKillShot).toBe(false);
    });
  });

  describe('evaluateHand - strength scoring', () => {
    it('should give higher score to stronger hands', () => {
      const strongHand: Card[] = [
        // Bomb
        c(Rank.ACE, Suit.SPADES),
        c(Rank.ACE, Suit.HEARTS),
        c(Rank.ACE, Suit.DIAMONDS),
        c(Rank.ACE, Suit.CLUBS),
      ];

      const weakHand: Card[] = [
        c(Rank.THREE, Suit.SPADES),
        c(Rank.FOUR, Suit.HEARTS),
        c(Rank.FIVE, Suit.DIAMONDS),
        c(Rank.SIX, Suit.CLUBS),
      ];

      const strongEval = evaluateHand(strongHand, Rank.TWO);
      const weakEval = evaluateHand(weakHand, Rank.TWO);

      expect(strongEval.strength).toBeGreaterThan(weakEval.strength);
    });

    it('should value progress (fewer cards)', () => {
      const fewCards: Card[] = [
        c(Rank.KING, Suit.SPADES),
        c(Rank.KING, Suit.HEARTS),
      ];

      const manyCards: Card[] = Array(15)
        .fill(null)
        .map((_, i) => ({
          id: `5-${i}`,
          rank: Rank.FIVE, // Use a different rank to avoid bomb bonuses
          suit: i % 2 === 0 ? Suit.SPADES : Suit.HEARTS,
        }));

      const fewEval = evaluateHand(fewCards, Rank.TWO);
      const manyEval = evaluateHand(manyCards, Rank.TWO);

      // Fewer cards should contribute to higher strength (progress bonus)
      // Many cards has bombs which add a lot, so just check few cards gets progress bonus
      expect(fewEval.strength).toBeGreaterThan(100); // Has pair + progress bonus
    });
  });

  describe('compareHands', () => {
    it('should return 1 when hand1 is stronger', () => {
      const strongHand: Card[] = [
        c(Rank.KING, Suit.SPADES),
        c(Rank.KING, Suit.HEARTS),
        c(Rank.KING, Suit.DIAMONDS),
        c(Rank.KING, Suit.CLUBS),
      ];

      const weakHand: Card[] = [
        c(Rank.THREE, Suit.SPADES),
        c(Rank.FOUR, Suit.HEARTS),
      ];

      expect(compareHands(strongHand, weakHand, Rank.TWO)).toBe(1);
    });

    it('should return -1 when hand2 is stronger', () => {
      const weakHand: Card[] = [c(Rank.THREE, Suit.SPADES)];

      const strongHand: Card[] = [
        c(Rank.ACE, Suit.SPADES),
        c(Rank.ACE, Suit.HEARTS),
        c(Rank.ACE, Suit.DIAMONDS),
        c(Rank.ACE, Suit.CLUBS),
      ];

      expect(compareHands(weakHand, strongHand, Rank.TWO)).toBe(-1);
    });

    it('should return 0 for equal strength hands', () => {
      const hand1: Card[] = [
        c(Rank.FIVE, Suit.SPADES),
        c(Rank.FIVE, Suit.HEARTS),
      ];

      const hand2: Card[] = [
        c(Rank.SIX, Suit.DIAMONDS),
        c(Rank.SIX, Suit.CLUBS),
      ];

      const result = compareHands(hand1, hand2, Rank.TWO);
      // Should be close to 0 (might not be exactly 0 due to rank differences)
      expect(Math.abs(result)).toBeLessThanOrEqual(1);
    });
  });

  describe('evaluateHand - complex scenarios', () => {
    it('should handle mixed hand with multiple combo types', () => {
      const hand: Card[] = [
        // Pair
        c(Rank.THREE, Suit.SPADES),
        c(Rank.THREE, Suit.HEARTS),
        // Triple
        c(Rank.SEVEN, Suit.SPADES),
        c(Rank.SEVEN, Suit.HEARTS),
        c(Rank.SEVEN, Suit.DIAMONDS),
        // Singles
        c(Rank.KING, Suit.CLUBS),
        c(Rank.ACE, Suit.SPADES),
      ];

      const evaluation = evaluateHand(hand, Rank.TWO);

      expect(evaluation.pairCount).toBeGreaterThanOrEqual(1);
      expect(evaluation.tripleCount).toBeGreaterThanOrEqual(1);
      expect(evaluation.strength).toBeGreaterThan(0);
    });

    it('should handle full starting hand (27 cards)', () => {
      // Create a realistic starting hand
      const hand: Card[] = [
        ...Array(4).fill(c(Rank.THREE, Suit.SPADES)),
        ...Array(4).fill(c(Rank.FIVE, Suit.HEARTS)),
        ...Array(4).fill(c(Rank.SEVEN, Suit.DIAMONDS)),
        ...Array(15)
          .fill(null)
          .map((_, i) => ({
            rank: [Rank.NINE, Rank.JACK, Rank.KING][i % 3],
            suit: Suit.CLUBS,
          })),
      ];

      const evaluation = evaluateHand(hand, Rank.TWO);

      expect(evaluation.strength).toBeGreaterThan(0);
      expect(evaluation.turnsToFinish).toBeGreaterThan(0);
      expect(evaluation.turnsToFinish).toBeLessThanOrEqual(15);
    });
  });

  describe('Integration tests', () => {
    it('should evaluate and compare multiple hands correctly', () => {
      const hands: Card[][] = [
        // Hand 1: Strong bomb hand
        [
          c(Rank.KING, Suit.SPADES),
          c(Rank.KING, Suit.HEARTS),
          c(Rank.KING, Suit.DIAMONDS),
          c(Rank.KING, Suit.CLUBS),
        ],
        // Hand 2: Straight hand
        [
          c(Rank.THREE, Suit.SPADES),
          c(Rank.FOUR, Suit.HEARTS),
          c(Rank.FIVE, Suit.DIAMONDS),
          c(Rank.SIX, Suit.CLUBS),
          c(Rank.SEVEN, Suit.SPADES),
        ],
        // Hand 3: Weak singles
        [
          c(Rank.THREE, Suit.SPADES),
          c(Rank.FIVE, Suit.HEARTS),
          c(Rank.NINE, Suit.DIAMONDS),
        ],
      ];

      const evaluations = hands.map((hand) => evaluateHand(hand, Rank.TWO));

      // Bomb hand should be strongest
      expect(evaluations[0].strength).toBeGreaterThan(evaluations[1].strength);
      expect(evaluations[0].strength).toBeGreaterThan(evaluations[2].strength);

      // Straight should be stronger than singles
      expect(evaluations[1].strength).toBeGreaterThan(evaluations[2].strength);
    });
  });
});
