/**
 * Validation utilities for game logic
 */

import { Card, Rank, RANK_VALUES, Suit } from '../types/card';

/**
 * Validate if a card object is well-formed
 */
export function isValidCard(card: any): card is Card {
  if (!card || typeof card !== 'object') return false;

  const { rank, suit, id } = card;

  // Check rank is valid
  if (!Object.values(Rank).includes(rank)) return false;

  // Check suit is valid
  if (!Object.values(Suit).includes(suit)) return false;

  // Jokers must have JOKER suit
  if (
    (rank === Rank.SMALL_JOKER || rank === Rank.BIG_JOKER) &&
    suit !== Suit.JOKER
  ) {
    return false;
  }

  // Non-jokers must not have JOKER suit
  if (
    rank !== Rank.SMALL_JOKER &&
    rank !== Rank.BIG_JOKER &&
    suit === Suit.JOKER
  ) {
    return false;
  }

  // Check ID exists
  if (typeof id !== 'string' || id.length === 0) return false;

  return true;
}

/**
 * Validate if cards array is well-formed
 */
export function areValidCards(cards: any[]): cards is Card[] {
  if (!Array.isArray(cards)) return false;
  if (cards.length === 0) return false;
  return cards.every(isValidCard);
}

/**
 * Check if a rank is valid for current game rank (trump cards)
 */
export function isTrumpCard(card: Card, currentRank: string): boolean {
  return card.rank === currentRank;
}

/**
 * Check if a card is a wildcard (逢人配)
 * Red heart cards of the current rank act as wildcards
 */
export function isWildcard(card: Card, currentRank: string): boolean {
  return card.suit === Suit.HEARTS && card.rank === currentRank;
}

/**
 * Check if a card is a joker
 */
export function isJoker(card: Card): boolean {
  return card.rank === Rank.SMALL_JOKER || card.rank === Rank.BIG_JOKER;
}

/**
 * Get numeric value of a rank
 */
export function getRankValue(rank: Rank): number {
  return RANK_VALUES[rank];
}

/**
 * Compare two cards by rank value
 * @returns positive if card1 > card2, negative if card1 < card2, 0 if equal
 */
export function compareCardRanks(card1: Card, card2: Card): number {
  return getRankValue(card1.rank) - getRankValue(card2.rank);
}

/**
 * Sort cards by rank (ascending)
 */
export function sortCardsByRank(cards: Card[]): Card[] {
  return [...cards].sort(compareCardRanks);
}

/**
 * Check if cards are consecutive ranks (for straights)
 */
export function areConsecutiveRanks(cards: Card[]): boolean {
  if (cards.length < 2) return false;

  const sorted = sortCardsByRank(cards);

  for (let i = 1; i < sorted.length; i++) {
    const prevValue = getRankValue(sorted[i - 1].rank);
    const currValue = getRankValue(sorted[i].rank);

    // Check if consecutive (allowing A-as-1 for A-2-3-4-5)
    if (currValue - prevValue !== 1) {
      // Special case: A can be 1 in A-2-3-4-5
      if (sorted[i - 1].rank === Rank.ACE && sorted[i].rank === Rank.TWO) {
        continue; // Allow A followed by 2
      }
      return false;
    }
  }

  return true;
}

/**
 * Check if all cards have the same rank
 */
export function haveSameRank(cards: Card[]): boolean {
  if (cards.length === 0) return false;
  const firstRank = cards[0].rank;
  return cards.every((card) => card.rank === firstRank);
}

/**
 * Check if all cards have the same suit
 */
export function haveSameSuit(cards: Card[]): boolean {
  if (cards.length === 0) return false;
  const firstSuit = cards[0].suit;
  return cards.every((card) => card.suit === firstSuit);
}

/**
 * Count cards by rank
 */
export function countByRank(cards: Card[]): Map<Rank, number> {
  const counts = new Map<Rank, number>();
  for (const card of cards) {
    counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
  }
  return counts;
}

/**
 * Count cards by suit
 */
export function countBySuit(cards: Card[]): Map<Suit, number> {
  const counts = new Map<Suit, number>();
  for (const card of cards) {
    counts.set(card.suit, (counts.get(card.suit) || 0) + 1);
  }
  return counts;
}

/**
 * Validate room code format (6 digits)
 */
export function isValidRoomCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Generate a 6-digit room code
 */
export function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate player ID format (UUID-like)
 */
export function isValidPlayerId(id: string): boolean {
  return typeof id === 'string' && id.length > 0;
}

/**
 * Validate session token format
 */
export function isValidSessionToken(token: string): boolean {
  return typeof token === 'string' && token.length >= 32;
}
