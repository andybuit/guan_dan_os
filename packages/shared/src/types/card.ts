/**
 * Card types and enums for Guandan game
 * Based on official 掼蛋 rules with 2 decks (108 cards total)
 */

/**
 * Card suits (花色)
 */
export enum Suit {
  SPADES = '♠', // 黑桃
  HEARTS = '♥', // 红心
  CLUBS = '♣', // 梅花
  DIAMONDS = '♦', // 方片
  JOKER = 'JOKER', // 王
}

/**
 * Card ranks (点数)
 * 2-10, J, Q, K, A, plus Jokers
 */
export enum Rank {
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  JACK = 'J',
  QUEEN = 'Q',
  KING = 'K',
  ACE = 'A',
  SMALL_JOKER = 'SmallJoker',
  BIG_JOKER = 'BigJoker',
}

/**
 * Card type classification (牌型)
 * 13 distinct types in Guandan
 */
export enum CardType {
  FOUR_KINGS = 'FOUR_KINGS', // 四王 (4 jokers)
  BOMB_8_PLUS = 'BOMB_8_PLUS', // 8张及以上炸弹
  STRAIGHT_FLUSH = 'STRAIGHT_FLUSH', // 同花顺 (5 cards)
  BOMB_7 = 'BOMB_7', // 7张炸弹
  BOMB_6 = 'BOMB_6', // 6张炸弹
  BOMB_5 = 'BOMB_5', // 5张炸弹
  BOMB_4 = 'BOMB_4', // 四张炸弹
  TRIPLE_PAIR_STRAIGHT = 'TRIPLE_PAIR_STRAIGHT', // 三连对 (6+ cards)
  TRIPLE_STRAIGHT = 'TRIPLE_STRAIGHT', // 三顺/钢板 (6+ cards)
  STRAIGHT = 'STRAIGHT', // 顺子 (5+ cards)
  THREE_WITH_TWO = 'THREE_WITH_TWO', // 三带二/葫芦
  TRIPLE = 'TRIPLE', // 三张
  PAIR = 'PAIR', // 对牌
  SINGLE = 'SINGLE', // 单牌
}

/**
 * Individual card representation
 */
export interface Card {
  /** Card rank (2-A, Jokers) */
  rank: Rank;

  /** Card suit (♠♥♣♦, JOKER for jokers) */
  suit: Suit;

  /** Unique identifier for this card (for React keys, etc.) */
  id: string;

  /** Whether this card is a wildcard (逢人配) based on current rank */
  isWildcard?: boolean;

  /** Whether this card is a red heart (for trump card logic) */
  isRedHeart?: boolean;
}

/**
 * Card play (cards played by a player)
 */
export interface CardPlay {
  /** Player who played these cards */
  playerId: string;

  /** Cards played */
  cards: Card[];

  /** Identified card type */
  cardType: CardType;

  /** Timestamp of play */
  timestamp: number;

  /** Numeric strength for comparison (higher = stronger) */
  strength: number;
}

/**
 * Deck of cards (108 cards from 2 standard decks)
 */
export interface Deck {
  /** All cards in the deck */
  cards: Card[];

  /** Seed used for shuffle (for replay functionality) */
  shuffleSeed?: string;
}

/**
 * Player's hand
 */
export interface PlayerHand {
  /** Player ID */
  playerId: string;

  /** Seat position */
  position: import('./room').SeatPosition;

  /** Cards in hand (private to player) */
  cards: Card[];

  /** Number of cards (public to all players) */
  cardCount: number;
}

/**
 * Numeric values for ranks (for comparison)
 */
export const RANK_VALUES: Record<Rank, number> = {
  [Rank.TWO]: 2,
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
  [Rank.SMALL_JOKER]: 15,
  [Rank.BIG_JOKER]: 16,
};

/**
 * Card type strength hierarchy (for comparison)
 * Higher number = stronger type
 */
export const CARD_TYPE_STRENGTH: Record<CardType, number> = {
  [CardType.SINGLE]: 1,
  [CardType.PAIR]: 2,
  [CardType.TRIPLE]: 3,
  [CardType.THREE_WITH_TWO]: 4,
  [CardType.STRAIGHT]: 5,
  [CardType.TRIPLE_STRAIGHT]: 6,
  [CardType.TRIPLE_PAIR_STRAIGHT]: 7,
  [CardType.BOMB_4]: 8,
  [CardType.BOMB_5]: 9,
  [CardType.BOMB_6]: 10,
  [CardType.BOMB_7]: 11,
  [CardType.STRAIGHT_FLUSH]: 12,
  [CardType.BOMB_8_PLUS]: 13, // Strength increases with count
  [CardType.FOUR_KINGS]: 14,
};
