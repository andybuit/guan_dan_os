/**
 * Tests for card type validators
 */

import { describe, expect, it } from 'vitest';
import { Card, CardType, Rank, Suit } from '../types/card';
import {
  identifyCardType,
  validateBomb8Plus,
  validateBombN,
  validateFourKings,
  validatePair,
  validateSingle,
  validateStraight,
  validateStraightFlush,
  validateThreeWithTwo,
  validateTriple,
} from '../utils/card-validators';

// Helper to create cards
function createCard(rank: Rank, suit: Suit, id?: string): Card {
  return {
    id: id || `${suit}-${rank}`,
    rank,
    suit,
    isRedHeart: suit === Suit.HEARTS,
  };
}

describe('validateSingle', () => {
  it('should validate a single card', () => {
    const cards = [createCard(Rank.ACE, Suit.SPADES)];
    const result = validateSingle(cards, Rank.TWO);

    expect(result.isValid).toBe(true);
    expect(result.type).toBe(CardType.SINGLE);
    expect(result.strength).toBeGreaterThan(0);
  });

  it('should reject multiple cards', () => {
    const cards = [
      createCard(Rank.ACE, Suit.SPADES),
      createCard(Rank.ACE, Suit.HEARTS),
    ];
    const result = validateSingle(cards, Rank.TWO);

    expect(result.isValid).toBe(false);
  });

  it('should handle jokers', () => {
    const cards = [createCard(Rank.BIG_JOKER, Suit.JOKER)];
    const result = validateSingle(cards, Rank.TWO);

    expect(result.isValid).toBe(true);
    expect(result.type).toBe(CardType.SINGLE);
  });
});

describe('validatePair', () => {
  it('should validate a pair of same rank', () => {
    const cards = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.KING, Suit.HEARTS),
    ];
    const result = validatePair(cards, Rank.TWO);

    expect(result.isValid).toBe(true);
    expect(result.type).toBe(CardType.PAIR);
  });

  it('should reject different ranks', () => {
    const cards = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.QUEEN, Suit.HEARTS),
    ];
    const result = validatePair(cards, Rank.TWO);

    expect(result.isValid).toBe(false);
  });

  it('should handle wildcards as pair', () => {
    const cards: Card[] = [
      { ...createCard(Rank.TWO, Suit.HEARTS), isWildcard: true }, // Wildcard when current rank is TWO
      createCard(Rank.KING, Suit.SPADES),
    ];
    const result = validatePair(cards, Rank.TWO);

    expect(result.isValid).toBe(true);
    expect(result.metadata?.wildcardCount).toBe(1);
  });
});

describe('validateTriple', () => {
  it('should validate three of same rank', () => {
    const cards = [
      createCard(Rank.QUEEN, Suit.SPADES),
      createCard(Rank.QUEEN, Suit.HEARTS),
      createCard(Rank.QUEEN, Suit.CLUBS),
    ];
    const result = validateTriple(cards, Rank.TWO);

    expect(result.isValid).toBe(true);
    expect(result.type).toBe(CardType.TRIPLE);
  });

  it('should reject mixed ranks', () => {
    const cards = [
      createCard(Rank.QUEEN, Suit.SPADES),
      createCard(Rank.QUEEN, Suit.HEARTS),
      createCard(Rank.KING, Suit.CLUBS),
    ];
    const result = validateTriple(cards, Rank.TWO);

    expect(result.isValid).toBe(false);
  });

  it('should handle wildcards in triple', () => {
    const cards: Card[] = [
      { ...createCard(Rank.THREE, Suit.HEARTS), isWildcard: true }, // Wildcard
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.KING, Suit.CLUBS),
    ];
    const result = validateTriple(cards, Rank.THREE);

    expect(result.isValid).toBe(true);
    expect(result.metadata?.wildcardCount).toBe(1);
  });
});

describe('validateThreeWithTwo', () => {
  it('should validate 3-2 combination', () => {
    const cards = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.KING, Suit.HEARTS),
      createCard(Rank.KING, Suit.CLUBS),
      createCard(Rank.QUEEN, Suit.SPADES),
      createCard(Rank.QUEEN, Suit.HEARTS),
    ];
    const result = validateThreeWithTwo(cards, Rank.TWO);

    expect(result.isValid).toBe(true);
    expect(result.type).toBe(CardType.THREE_WITH_TWO);
  });

  it('should reject invalid combinations', () => {
    // Invalid: 3 different ranks (not 2)
    const cards = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.KING, Suit.HEARTS),
      createCard(Rank.QUEEN, Suit.CLUBS),
      createCard(Rank.QUEEN, Suit.SPADES),
      createCard(Rank.JACK, Suit.HEARTS), // Third rank makes it invalid
    ];
    const result = validateThreeWithTwo(cards, Rank.TWO);

    expect(result.isValid).toBe(false);
  });

  it('should reject 5 of same rank', () => {
    const cards = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.KING, Suit.HEARTS),
      createCard(Rank.KING, Suit.CLUBS),
      createCard(Rank.KING, Suit.DIAMONDS),
      createCard(Rank.TWO, Suit.HEARTS), // Wildcard
    ];
    const result = validateThreeWithTwo(cards, Rank.TWO);

    // This should be a bomb, not three with two
    expect(result.isValid).toBe(false);
  });
});

describe('validateStraight', () => {
  it('should validate 5-card straight', () => {
    const cards = [
      createCard(Rank.THREE, Suit.SPADES),
      createCard(Rank.FOUR, Suit.HEARTS),
      createCard(Rank.FIVE, Suit.CLUBS),
      createCard(Rank.SIX, Suit.DIAMONDS),
      createCard(Rank.SEVEN, Suit.SPADES),
    ];
    const result = validateStraight(cards, Rank.TWO);

    expect(result.isValid).toBe(true);
    expect(result.type).toBe(CardType.STRAIGHT);
  });

  it('should validate longer straight', () => {
    const cards = [
      createCard(Rank.FIVE, Suit.SPADES),
      createCard(Rank.SIX, Suit.HEARTS),
      createCard(Rank.SEVEN, Suit.CLUBS),
      createCard(Rank.EIGHT, Suit.DIAMONDS),
      createCard(Rank.NINE, Suit.SPADES),
      createCard(Rank.TEN, Suit.HEARTS),
    ];
    const result = validateStraight(cards, Rank.TWO);

    expect(result.isValid).toBe(true);
    expect(result.type).toBe(CardType.STRAIGHT);
  });

  it('should validate A-2-3-4-5 straight (A as 1)', () => {
    const cards = [
      createCard(Rank.ACE, Suit.SPADES),
      createCard(Rank.TWO, Suit.SPADES), // TWO is not wildcard here
      createCard(Rank.THREE, Suit.CLUBS),
      createCard(Rank.FOUR, Suit.DIAMONDS),
      createCard(Rank.FIVE, Suit.SPADES),
    ];
    const result = validateStraight(cards, Rank.KING); // Current rank is KING

    expect(result.isValid).toBe(true);
  });

  it('should reject non-consecutive cards', () => {
    const cards = [
      createCard(Rank.THREE, Suit.SPADES),
      createCard(Rank.FOUR, Suit.HEARTS),
      createCard(Rank.SIX, Suit.CLUBS), // Missing 5
      createCard(Rank.SEVEN, Suit.DIAMONDS),
      createCard(Rank.EIGHT, Suit.SPADES),
    ];
    const result = validateStraight(cards, Rank.TWO);

    // Without wildcard, this is invalid
    expect(result.isValid).toBe(false);
  });

  it('should reject less than 5 cards', () => {
    const cards = [
      createCard(Rank.THREE, Suit.SPADES),
      createCard(Rank.FOUR, Suit.HEARTS),
      createCard(Rank.FIVE, Suit.CLUBS),
      createCard(Rank.SIX, Suit.DIAMONDS),
    ];
    const result = validateStraight(cards, Rank.TWO);

    expect(result.isValid).toBe(false);
  });
});

describe('validateBombN', () => {
  it('should validate 4-bomb', () => {
    const cards = [
      createCard(Rank.QUEEN, Suit.SPADES),
      createCard(Rank.QUEEN, Suit.HEARTS),
      createCard(Rank.QUEEN, Suit.CLUBS),
      createCard(Rank.QUEEN, Suit.DIAMONDS),
    ];
    const result = validateBombN(cards, 4, Rank.TWO);

    expect(result.isValid).toBe(true);
    expect(result.type).toBe(CardType.BOMB_4);
    expect(result.metadata?.bombSize).toBe(4);
  });

  it('should validate 5-bomb', () => {
    const cards: Card[] = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.KING, Suit.HEARTS),
      createCard(Rank.KING, Suit.CLUBS),
      createCard(Rank.KING, Suit.DIAMONDS),
      { ...createCard(Rank.TWO, Suit.HEARTS), isWildcard: true }, // Wildcard
    ];
    const result = validateBombN(cards, 5, Rank.TWO);

    expect(result.isValid).toBe(true);
    expect(result.type).toBe(CardType.BOMB_5);
    expect(result.metadata?.wildcardCount).toBe(1);
  });
  it('should reject mixed ranks', () => {
    const cards = [
      createCard(Rank.QUEEN, Suit.SPADES),
      createCard(Rank.QUEEN, Suit.HEARTS),
      createCard(Rank.QUEEN, Suit.CLUBS),
      createCard(Rank.KING, Suit.DIAMONDS), // Different rank
    ];
    const result = validateBombN(cards, 4, Rank.TWO);

    expect(result.isValid).toBe(false);
  });
});

describe('validateBomb8Plus', () => {
  it('should validate 8-bomb', () => {
    const cards = Array(8)
      .fill(null)
      .map((_, i) =>
        createCard(
          Rank.FIVE,
          [Suit.SPADES, Suit.HEARTS, Suit.CLUBS, Suit.DIAMONDS][i % 4],
          `5-${i}`
        )
      );
    const result = validateBomb8Plus(cards, Rank.TWO);

    expect(result.isValid).toBe(true);
    expect(result.type).toBe(CardType.BOMB_8_PLUS);
    expect(result.metadata?.bombSize).toBe(8);
  });

  it('should validate 10-bomb with wildcards', () => {
    const cards: Card[] = [
      ...Array(8)
        .fill(null)
        .map((_, i) =>
          createCard(
            Rank.SEVEN,
            [Suit.SPADES, Suit.HEARTS, Suit.CLUBS, Suit.DIAMONDS][i % 4],
            `7-${i}`
          )
        ),
      { ...createCard(Rank.THREE, Suit.HEARTS, '3h-1'), isWildcard: true }, // Wildcard
      { ...createCard(Rank.THREE, Suit.HEARTS, '3h-2'), isWildcard: true }, // Wildcard
    ];
    const result = validateBomb8Plus(cards, Rank.THREE);

    expect(result.isValid).toBe(true);
    expect(result.metadata?.bombSize).toBe(10);
    expect(result.metadata?.wildcardCount).toBe(2);
  });

  it('should reject less than 8 cards', () => {
    const cards = Array(7)
      .fill(null)
      .map((_, i) => createCard(Rank.FIVE, Suit.SPADES, `5-${i}`));
    const result = validateBomb8Plus(cards, Rank.TWO);

    expect(result.isValid).toBe(false);
  });
});

describe('validateStraightFlush', () => {
  it('should validate straight flush', () => {
    const cards = [
      createCard(Rank.SEVEN, Suit.HEARTS),
      createCard(Rank.EIGHT, Suit.HEARTS),
      createCard(Rank.NINE, Suit.HEARTS),
      createCard(Rank.TEN, Suit.HEARTS),
      createCard(Rank.JACK, Suit.HEARTS),
    ];
    const result = validateStraightFlush(cards, Rank.TWO);

    expect(result.isValid).toBe(true);
    expect(result.type).toBe(CardType.STRAIGHT_FLUSH);
  });

  it('should reject mixed suits', () => {
    const cards = [
      createCard(Rank.SEVEN, Suit.HEARTS),
      createCard(Rank.EIGHT, Suit.HEARTS),
      createCard(Rank.NINE, Suit.SPADES), // Different suit
      createCard(Rank.TEN, Suit.HEARTS),
      createCard(Rank.JACK, Suit.HEARTS),
    ];
    const result = validateStraightFlush(cards, Rank.TWO);

    expect(result.isValid).toBe(false);
  });

  it('should reject non-5-card count', () => {
    const cards = [
      createCard(Rank.SEVEN, Suit.HEARTS),
      createCard(Rank.EIGHT, Suit.HEARTS),
      createCard(Rank.NINE, Suit.HEARTS),
      createCard(Rank.TEN, Suit.HEARTS),
      createCard(Rank.JACK, Suit.HEARTS),
      createCard(Rank.QUEEN, Suit.HEARTS),
    ];
    const result = validateStraightFlush(cards, Rank.TWO);

    expect(result.isValid).toBe(false);
  });
});

describe('validateFourKings', () => {
  it('should validate four jokers', () => {
    const cards = [
      createCard(Rank.BIG_JOKER, Suit.JOKER),
      createCard(Rank.BIG_JOKER, Suit.JOKER),
      createCard(Rank.SMALL_JOKER, Suit.JOKER),
      createCard(Rank.SMALL_JOKER, Suit.JOKER),
    ];
    const result = validateFourKings(cards);

    expect(result.isValid).toBe(true);
    expect(result.type).toBe(CardType.FOUR_KINGS);
    expect(result.strength).toBe(1000000);
  });

  it('should validate all big jokers', () => {
    const cards = Array(4)
      .fill(null)
      .map((_, i) => createCard(Rank.BIG_JOKER, Suit.JOKER, `bj-${i}`));
    const result = validateFourKings(cards);

    expect(result.isValid).toBe(true);
  });

  it('should reject non-jokers', () => {
    const cards = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.KING, Suit.HEARTS),
      createCard(Rank.KING, Suit.CLUBS),
      createCard(Rank.KING, Suit.DIAMONDS),
    ];
    const result = validateFourKings(cards);

    expect(result.isValid).toBe(false);
  });
});

describe('identifyCardType', () => {
  it('should identify single card', () => {
    const cards = [createCard(Rank.ACE, Suit.SPADES)];
    const result = identifyCardType(cards, Rank.TWO);

    expect(result.type).toBe(CardType.SINGLE);
    expect(result.isValid).toBe(true);
  });

  it('should identify pair', () => {
    const cards = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.KING, Suit.HEARTS),
    ];
    const result = identifyCardType(cards, Rank.TWO);

    expect(result.type).toBe(CardType.PAIR);
    expect(result.isValid).toBe(true);
  });

  it('should identify triple', () => {
    const cards = [
      createCard(Rank.QUEEN, Suit.SPADES),
      createCard(Rank.QUEEN, Suit.HEARTS),
      createCard(Rank.QUEEN, Suit.CLUBS),
    ];
    const result = identifyCardType(cards, Rank.TWO);

    expect(result.type).toBe(CardType.TRIPLE);
    expect(result.isValid).toBe(true);
  });

  it('should identify 4-bomb over triple with two', () => {
    const cards = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.KING, Suit.HEARTS),
      createCard(Rank.KING, Suit.CLUBS),
      createCard(Rank.KING, Suit.DIAMONDS),
    ];
    const result = identifyCardType(cards, Rank.TWO);

    expect(result.type).toBe(CardType.BOMB_4);
    expect(result.isValid).toBe(true);
  });

  it('should identify straight', () => {
    const cards = [
      createCard(Rank.THREE, Suit.SPADES),
      createCard(Rank.FOUR, Suit.HEARTS),
      createCard(Rank.FIVE, Suit.CLUBS),
      createCard(Rank.SIX, Suit.DIAMONDS),
      createCard(Rank.SEVEN, Suit.SPADES),
    ];
    const result = identifyCardType(cards, Rank.TWO);

    expect(result.type).toBe(CardType.STRAIGHT);
    expect(result.isValid).toBe(true);
  });

  it('should identify four kings', () => {
    const cards = [
      createCard(Rank.BIG_JOKER, Suit.JOKER),
      createCard(Rank.BIG_JOKER, Suit.JOKER),
      createCard(Rank.SMALL_JOKER, Suit.JOKER),
      createCard(Rank.SMALL_JOKER, Suit.JOKER),
    ];
    const result = identifyCardType(cards, Rank.TWO);

    expect(result.type).toBe(CardType.FOUR_KINGS);
    expect(result.isValid).toBe(true);
  });

  it('should return error for invalid combination', () => {
    const cards = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.QUEEN, Suit.HEARTS),
      createCard(Rank.JACK, Suit.CLUBS),
    ];
    const result = identifyCardType(cards, Rank.TWO);

    expect(result.isValid).toBe(false);
    expect(result.type).toBeNull();
    expect(result.error).toBeDefined();
  });

  it('should return error for empty cards', () => {
    const result = identifyCardType([], Rank.TWO);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('No cards');
  });
});
