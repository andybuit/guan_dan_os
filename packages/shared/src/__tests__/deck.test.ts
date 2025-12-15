/**
 * Tests for deck operations
 */

import { describe, expect, it } from 'vitest';
import { constants } from '../index';
import { Rank, Suit } from '../types/card';
import {
  createDeck,
  createShuffledDeck,
  dealCards,
  deserializeCard,
  serializeCard,
  shuffleDeck,
} from '../utils/deck';

describe('createDeck', () => {
  it('should create a deck with exactly 108 cards', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(constants.DECK_SIZE);
  });

  it('should have 2 of each rank-suit combination', () => {
    const deck = createDeck();
    const regularSuits = [Suit.SPADES, Suit.HEARTS, Suit.CLUBS, Suit.DIAMONDS];
    const regularRanks = [
      Rank.TWO,
      Rank.THREE,
      Rank.FOUR,
      Rank.FIVE,
      Rank.SIX,
      Rank.SEVEN,
      Rank.EIGHT,
      Rank.NINE,
      Rank.TEN,
      Rank.JACK,
      Rank.QUEEN,
      Rank.KING,
      Rank.ACE,
    ];

    for (const suit of regularSuits) {
      for (const rank of regularRanks) {
        const count = deck.filter(
          (c) => c.rank === rank && c.suit === suit
        ).length;
        expect(count).toBe(2);
      }
    }
  });

  it('should have 4 jokers (2 big, 2 small)', () => {
    const deck = createDeck();
    const bigJokers = deck.filter((c) => c.rank === Rank.BIG_JOKER);
    const smallJokers = deck.filter((c) => c.rank === Rank.SMALL_JOKER);

    expect(bigJokers).toHaveLength(2);
    expect(smallJokers).toHaveLength(2);
  });

  it('should mark red hearts correctly', () => {
    const deck = createDeck();
    const redHearts = deck.filter((c) => c.isRedHeart === true);

    // 13 ranks × 2 decks = 26 red hearts
    expect(redHearts).toHaveLength(26);
    expect(redHearts.every((c) => c.suit === Suit.HEARTS)).toBe(true);
  });

  it('should have unique card IDs', () => {
    const deck = createDeck();
    const ids = deck.map((c) => c.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(deck.length);
  });
});

describe('shuffleDeck', () => {
  it('should shuffle cards in place', () => {
    const deck = createDeck();
    const originalOrder = deck.map((c) => c.id);

    shuffleDeck(deck);
    const shuffledOrder = deck.map((c) => c.id);

    // Should still have same cards
    expect(deck).toHaveLength(constants.DECK_SIZE);

    // Order should be different (extremely unlikely to be same)
    expect(shuffledOrder).not.toEqual(originalOrder);
  });

  it('should produce deterministic shuffle with same seed', () => {
    const deck1 = createDeck();
    const deck2 = createDeck();

    const seed = 'test-seed-123';
    shuffleDeck(deck1, seed);
    shuffleDeck(deck2, seed);

    const order1 = deck1.map((c) => c.id);
    const order2 = deck2.map((c) => c.id);

    expect(order1).toEqual(order2);
  });

  it('should produce different shuffle with different seed', () => {
    const deck1 = createDeck();
    const deck2 = createDeck();

    shuffleDeck(deck1, 'seed-1');
    shuffleDeck(deck2, 'seed-2');

    const order1 = deck1.map((c) => c.id);
    const order2 = deck2.map((c) => c.id);

    expect(order1).not.toEqual(order2);
  });

  it('should pass Chi-square test for randomness (p < 0.05)', () => {
    // Test that shuffle produces uniform distribution
    const numTrials = 1000;
    const numBuckets = 10; // Divide deck into 10 buckets
    const bucketSize = constants.DECK_SIZE / numBuckets;

    // Count how many times first card lands in each bucket
    const counts = new Array(numBuckets).fill(0);

    for (let i = 0; i < numTrials; i++) {
      const deck = createDeck();
      shuffleDeck(deck);

      // Find which bucket the first card originally belonged to
      const originalIndex = createDeck().findIndex((c) => c.id === deck[0].id);
      const bucket = Math.floor(originalIndex / bucketSize);
      counts[bucket]++;
    }

    // Chi-square test
    const expected = numTrials / numBuckets;
    let chiSquare = 0;
    for (const count of counts) {
      chiSquare += Math.pow(count - expected, 2) / expected;
    }

    // Critical value for chi-square with 9 degrees of freedom at p=0.05 is 16.919
    expect(chiSquare).toBeLessThan(16.919);
  });
});

describe('dealCards', () => {
  it('should deal 27 cards to each of 4 players', () => {
    const deck = createShuffledDeck();
    const playerIds = ['player1', 'player2', 'player3', 'player4'];

    const hands = dealCards(deck.cards, playerIds);

    expect(Object.keys(hands)).toHaveLength(constants.NUM_PLAYERS);

    for (const playerId of playerIds) {
      expect(hands[playerId].cards).toHaveLength(constants.CARDS_PER_PLAYER);
      expect(hands[playerId].cardCount).toBe(constants.CARDS_PER_PLAYER);
      expect(hands[playerId].playerId).toBe(playerId);
    }
  });

  it('should distribute all 108 cards', () => {
    const deck = createShuffledDeck();
    const playerIds = ['player1', 'player2', 'player3', 'player4'];

    const hands = dealCards(deck.cards, playerIds);

    const allCards = Object.values(hands).flatMap((h) => h.cards);
    expect(allCards).toHaveLength(constants.DECK_SIZE);
  });

  it('should not duplicate cards across hands', () => {
    const deck = createShuffledDeck();
    const playerIds = ['player1', 'player2', 'player3', 'player4'];

    const hands = dealCards(deck.cards, playerIds);

    const allCardIds = Object.values(hands).flatMap((h) =>
      h.cards.map((c) => c.id)
    );
    const uniqueIds = new Set(allCardIds);

    expect(uniqueIds.size).toBe(constants.DECK_SIZE);
  });

  it('should throw error if deck size is not 108', () => {
    const invalidDeck = createDeck().slice(0, 100);
    const playerIds = ['player1', 'player2', 'player3', 'player4'];

    expect(() => dealCards(invalidDeck, playerIds)).toThrow(
      'Invalid deck size'
    );
  });

  it('should throw error if player count is not 4', () => {
    const deck = createShuffledDeck();
    const invalidPlayerIds = ['player1', 'player2', 'player3'];

    expect(() => dealCards(deck.cards, invalidPlayerIds)).toThrow(
      'Invalid number of players'
    );
  });
});

describe('serializeCard and deserializeCard', () => {
  it('should serialize and deserialize card correctly', () => {
    const card = {
      id: 'test-card-1',
      rank: Rank.ACE,
      suit: Suit.SPADES,
      isRedHeart: false,
    };

    const serialized = serializeCard(card);
    const deserialized = deserializeCard(serialized);

    expect(deserialized.id).toBe(card.id);
    expect(deserialized.rank).toBe(card.rank);
    expect(deserialized.suit).toBe(card.suit);
  });

  it('should handle red hearts correctly', () => {
    const card = {
      id: 'test-heart-1',
      rank: Rank.KING,
      suit: Suit.HEARTS,
      isRedHeart: true,
    };

    const serialized = serializeCard(card);
    const deserialized = deserializeCard(serialized);

    expect(deserialized.isRedHeart).toBe(true);
  });

  it('should handle jokers correctly', () => {
    const card = {
      id: 'big-joker-1',
      rank: Rank.BIG_JOKER,
      suit: Suit.JOKER,
    };

    const serialized = serializeCard(card);
    const deserialized = deserializeCard(serialized);

    expect(deserialized.rank).toBe(Rank.BIG_JOKER);
    expect(deserialized.suit).toBe(Suit.JOKER);
  });
});

describe('createShuffledDeck', () => {
  it('should create a complete shuffled deck', () => {
    const deck = createShuffledDeck();

    expect(deck.cards).toHaveLength(constants.DECK_SIZE);
    expect(deck.shuffleSeed).toBeUndefined();
  });

  it('should create deck with seed if provided', () => {
    const seed = 'replay-seed-123';
    const deck = createShuffledDeck(seed);

    expect(deck.shuffleSeed).toBe(seed);
  });

  it('should produce same deck with same seed', () => {
    const seed = 'deterministic-seed';
    const deck1 = createShuffledDeck(seed);
    const deck2 = createShuffledDeck(seed);

    const order1 = deck1.cards.map((c) => c.id);
    const order2 = deck2.cards.map((c) => c.id);

    expect(order1).toEqual(order2);
  });
});
