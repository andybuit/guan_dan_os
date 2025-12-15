/**
 * Card operations: deck creation, shuffle, and dealing
 */

import { createHash, randomBytes } from 'crypto';
import { constants } from '../index';
import { Card, Deck, PlayerHand, Rank, Suit } from '../types/card';
import { SeatPosition } from '../types/room';

/**
 * Create a standard 108-card deck for Guandan
 * 2 complete decks (52 cards each) + 4 jokers (2 big, 2 small)
 */
export function createDeck(): Card[] {
  const cards: Card[] = [];
  let cardId = 0;

  // Create 2 complete decks
  for (let deckNum = 0; deckNum < 2; deckNum++) {
    // Add 52 regular cards per deck
    for (const suit of [Suit.SPADES, Suit.HEARTS, Suit.CLUBS, Suit.DIAMONDS]) {
      for (const rank of [
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
      ]) {
        cards.push({
          id: `${suit}-${rank}-${deckNum}-${cardId++}`,
          rank,
          suit,
          isRedHeart: suit === Suit.HEARTS,
        });
      }
    }
  }

  // Add 4 jokers (2 big, 2 small)
  for (let i = 0; i < 2; i++) {
    cards.push({
      id: `JOKER-BIG-${i}-${cardId++}`,
      rank: Rank.BIG_JOKER,
      suit: Suit.JOKER,
    });
    cards.push({
      id: `JOKER-SMALL-${i}-${cardId++}`,
      rank: Rank.SMALL_JOKER,
      suit: Suit.JOKER,
    });
  }

  // Verify we have exactly 108 cards
  if (cards.length !== constants.DECK_SIZE) {
    throw new Error(
      `Invalid deck size: expected ${constants.DECK_SIZE}, got ${cards.length}`
    );
  }

  return cards;
}

/**
 * Fisher-Yates shuffle using cryptographically secure randomness
 * @param cards Cards to shuffle (modified in place)
 * @param seed Optional seed for deterministic shuffle (for replay)
 */
export function shuffleDeck(cards: Card[], seed?: string): Card[] {
  const n = cards.length;

  for (let i = n - 1; i > 0; i--) {
    // Generate random index using crypto.randomBytes or seeded random
    const j = seed ? seededRandom(seed, i, n) : cryptoRandomInt(i + 1);

    // Swap cards[i] and cards[j]
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
}

/**
 * Generate a cryptographically secure random integer in range [0, max)
 */
function cryptoRandomInt(max: number): number {
  const range = max;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const randomBuffer = randomBytes(bytesNeeded);
  const randomValue = randomBuffer.readUIntBE(0, bytesNeeded);
  return randomValue % range;
}

/**
 * Generate a seeded random number for deterministic shuffle
 * Uses hash-based approach for reproducibility
 */
function seededRandom(seed: string, index: number, max: number): number {
  const hash = createHash('sha256').update(`${seed}-${index}`).digest();
  const randomValue = hash.readUInt32BE(0);
  return randomValue % max;
}

/**
 * Deal cards to 4 players (27 cards each)
 * @param deck Shuffled deck of 108 cards
 * @param playerIds Array of 4 player IDs
 * @param positions Optional array of seat positions (defaults to S, N, E, W)
 * @returns Map of player ID to PlayerHand
 */
export function dealCards(
  deck: Card[],
  playerIds: string[],
  positions?: import('../types/room').SeatPosition[]
): Record<string, PlayerHand> {
  if (deck.length !== constants.DECK_SIZE) {
    throw new Error(
      `Invalid deck size: expected ${constants.DECK_SIZE}, got ${deck.length}`
    );
  }

  if (playerIds.length !== constants.NUM_PLAYERS) {
    throw new Error(
      `Invalid number of players: expected ${constants.NUM_PLAYERS}, got ${playerIds.length}`
    );
  }

  const hands: Record<string, PlayerHand> = {};

  // Default positions: South (host), North, East, West
  const defaultPositions = [
    SeatPosition.SOUTH,
    SeatPosition.NORTH,
    SeatPosition.EAST,
    SeatPosition.WEST,
  ];
  const seatPositions = positions || defaultPositions;

  // Deal 27 cards to each player
  for (let i = 0; i < playerIds.length; i++) {
    const playerId = playerIds[i];
    const startIdx = i * constants.CARDS_PER_PLAYER;
    const endIdx = startIdx + constants.CARDS_PER_PLAYER;
    const cards = deck.slice(startIdx, endIdx);

    hands[playerId] = {
      playerId,
      position: seatPositions[i],
      cards,
      cardCount: cards.length,
    };
  }

  return hands;
}

/**
 * Create a shuffled deck with optional seed
 */
export function createShuffledDeck(seed?: string): Deck {
  const cards = createDeck();
  shuffleDeck(cards, seed);

  return {
    cards,
    shuffleSeed: seed,
  };
}

/**
 * Serialize a card to string (for storage/transmission)
 */
export function serializeCard(card: Card): string {
  return JSON.stringify({
    rank: card.rank,
    suit: card.suit,
    id: card.id,
  });
}

/**
 * Deserialize a card from string
 */
export function deserializeCard(serialized: string): Card {
  const parsed = JSON.parse(serialized);
  return {
    rank: parsed.rank,
    suit: parsed.suit,
    id: parsed.id,
    isRedHeart: parsed.suit === Suit.HEARTS,
  };
}

/**
 * Serialize multiple cards
 */
export function serializeCards(cards: Card[]): string {
  return JSON.stringify(
    cards.map((c) => ({
      rank: c.rank,
      suit: c.suit,
      id: c.id,
    }))
  );
}

/**
 * Deserialize multiple cards
 */
export function deserializeCards(serialized: string): Card[] {
  const parsed = JSON.parse(serialized);
  return parsed.map((c: any) => ({
    rank: c.rank,
    suit: c.suit,
    id: c.id,
    isRedHeart: c.suit === Suit.HEARTS,
  }));
}
