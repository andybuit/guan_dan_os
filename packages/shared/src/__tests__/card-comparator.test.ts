/**
 * Tests for card comparison logic
 */

import { describe, expect, it } from 'vitest';
import { Card, CardType, Rank, Suit } from '../types/card';
import {
  canBeat,
  comparePlays,
  getBombTier,
  getMinimumToBeat,
  isBomb,
  isLegalPlay,
  isWindfallCandidate,
} from '../utils/card-comparator';

// Helper to create cards
function createCard(rank: Rank, suit: Suit, id?: string): Card {
  return {
    id: id || `${suit}-${rank}`,
    rank,
    suit,
    isRedHeart: suit === Suit.HEARTS,
  };
}

describe('isBomb', () => {
  it('should identify Four Kings as bomb', () => {
    expect(isBomb(CardType.FOUR_KINGS)).toBe(true);
  });

  it('should identify 8+ bomb as bomb', () => {
    expect(isBomb(CardType.BOMB_8_PLUS)).toBe(true);
  });

  it('should identify straight flush as bomb', () => {
    expect(isBomb(CardType.STRAIGHT_FLUSH)).toBe(true);
  });

  it('should identify 4-7 bombs as bomb', () => {
    expect(isBomb(CardType.BOMB_4)).toBe(true);
    expect(isBomb(CardType.BOMB_5)).toBe(true);
    expect(isBomb(CardType.BOMB_6)).toBe(true);
    expect(isBomb(CardType.BOMB_7)).toBe(true);
  });

  it('should not identify non-bombs', () => {
    expect(isBomb(CardType.SINGLE)).toBe(false);
    expect(isBomb(CardType.PAIR)).toBe(false);
    expect(isBomb(CardType.TRIPLE)).toBe(false);
    expect(isBomb(CardType.STRAIGHT)).toBe(false);
    expect(isBomb(CardType.THREE_WITH_TWO)).toBe(false);
  });
});

describe('getBombTier', () => {
  it('should rank Four Kings highest', () => {
    expect(getBombTier(CardType.FOUR_KINGS)).toBe(1000);
  });

  it('should rank 8+ bombs by size', () => {
    expect(getBombTier(CardType.BOMB_8_PLUS, { bombSize: 8 })).toBe(908);
    expect(getBombTier(CardType.BOMB_8_PLUS, { bombSize: 10 })).toBe(910);
    expect(getBombTier(CardType.BOMB_8_PLUS, { bombSize: 12 })).toBe(912);
  });

  it('should rank straight flush below 8+ bombs', () => {
    expect(getBombTier(CardType.STRAIGHT_FLUSH)).toBe(800);
    expect(getBombTier(CardType.STRAIGHT_FLUSH)).toBeLessThan(
      getBombTier(CardType.BOMB_8_PLUS, { bombSize: 8 })
    );
  });

  it('should rank 5-7 bombs in order', () => {
    expect(getBombTier(CardType.BOMB_7)).toBe(700);
    expect(getBombTier(CardType.BOMB_6)).toBe(600);
    expect(getBombTier(CardType.BOMB_5)).toBe(500);
  });

  it('should rank 4-bomb lowest', () => {
    expect(getBombTier(CardType.BOMB_4)).toBe(400);
  });
});

describe('canBeat - first play', () => {
  it('should allow any valid play as first play', () => {
    const cards = [createCard(Rank.KING, Suit.SPADES)];
    const result = canBeat(cards, null, Rank.TWO);

    expect(result.canBeat).toBe(true);
  });

  it('should reject invalid first play', () => {
    const cards = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.QUEEN, Suit.HEARTS),
    ];
    const result = canBeat(cards, null, Rank.TWO);

    expect(result.canBeat).toBe(false);
    expect(result.reason).toBe('Invalid card type');
  });
});

describe('canBeat - bomb vs non-bomb', () => {
  it('should allow bomb to beat non-bomb', () => {
    const bomb = [
      createCard(Rank.THREE, Suit.SPADES),
      createCard(Rank.THREE, Suit.HEARTS),
      createCard(Rank.THREE, Suit.CLUBS),
      createCard(Rank.THREE, Suit.DIAMONDS),
    ];
    const pair = [
      createCard(Rank.ACE, Suit.SPADES),
      createCard(Rank.ACE, Suit.HEARTS),
    ];

    const result = canBeat(bomb, pair, Rank.TWO);
    expect(result.canBeat).toBe(true);
    expect(result.reason).toBe('Bomb beats non-bomb');
  });

  it('should not allow non-bomb to beat bomb', () => {
    const triple = [
      createCard(Rank.ACE, Suit.SPADES),
      createCard(Rank.ACE, Suit.HEARTS),
      createCard(Rank.ACE, Suit.CLUBS),
    ];
    const bomb = [
      createCard(Rank.THREE, Suit.SPADES),
      createCard(Rank.THREE, Suit.HEARTS),
      createCard(Rank.THREE, Suit.CLUBS),
      createCard(Rank.THREE, Suit.DIAMONDS),
    ];

    const result = canBeat(triple, bomb, Rank.TWO);
    expect(result.canBeat).toBe(false);
    expect(result.reason).toBe('Cannot beat bomb with non-bomb');
  });
});

describe('canBeat - bomb vs bomb', () => {
  it('should allow higher tier bomb to beat lower tier', () => {
    const straightFlush = [
      createCard(Rank.TWO, Suit.SPADES),
      createCard(Rank.THREE, Suit.SPADES),
      createCard(Rank.FOUR, Suit.SPADES),
      createCard(Rank.FIVE, Suit.SPADES),
      createCard(Rank.SIX, Suit.SPADES),
    ];
    const bomb4 = [
      createCard(Rank.ACE, Suit.SPADES),
      createCard(Rank.ACE, Suit.HEARTS),
      createCard(Rank.ACE, Suit.CLUBS),
      createCard(Rank.ACE, Suit.DIAMONDS),
    ];

    const result = canBeat(straightFlush, bomb4, Rank.TWO);
    expect(result.canBeat).toBe(true);
    expect(result.reason).toBe('Higher bomb');
  });

  it('should allow same tier higher rank bomb', () => {
    const bomb4Kings = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.KING, Suit.HEARTS),
      createCard(Rank.KING, Suit.CLUBS),
      createCard(Rank.KING, Suit.DIAMONDS),
    ];
    const bomb4Queens = [
      createCard(Rank.QUEEN, Suit.SPADES),
      createCard(Rank.QUEEN, Suit.HEARTS),
      createCard(Rank.QUEEN, Suit.CLUBS),
      createCard(Rank.QUEEN, Suit.DIAMONDS),
    ];

    const result = canBeat(bomb4Kings, bomb4Queens, Rank.TWO);
    expect(result.canBeat).toBe(true);
    expect(result.reason).toBe('Higher bomb');
  });

  it('should not allow lower tier bomb to beat higher tier', () => {
    const bomb4 = [
      createCard(Rank.ACE, Suit.SPADES),
      createCard(Rank.ACE, Suit.HEARTS),
      createCard(Rank.ACE, Suit.CLUBS),
      createCard(Rank.ACE, Suit.DIAMONDS),
    ];
    const bomb5 = [
      createCard(Rank.TWO, Suit.SPADES),
      createCard(Rank.TWO, Suit.HEARTS),
      createCard(Rank.TWO, Suit.CLUBS),
      createCard(Rank.TWO, Suit.DIAMONDS),
      { ...createCard(Rank.THREE, Suit.HEARTS), isWildcard: true },
    ];

    const result = canBeat(bomb4, bomb5, Rank.THREE);
    expect(result.canBeat).toBe(false);
    expect(result.reason).toBe('Lower or equal bomb');
  });
});

describe('canBeat - same type non-bombs', () => {
  it('should allow higher single to beat lower single', () => {
    const kingCard = [createCard(Rank.KING, Suit.SPADES)];
    const queenCard = [createCard(Rank.QUEEN, Suit.HEARTS)];

    const result = canBeat(kingCard, queenCard, Rank.TWO);
    expect(result.canBeat).toBe(true);
    expect(result.reason).toBe('Higher strength');
  });

  it('should allow higher pair to beat lower pair', () => {
    const kingPair = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.KING, Suit.HEARTS),
    ];
    const queenPair = [
      createCard(Rank.QUEEN, Suit.SPADES),
      createCard(Rank.QUEEN, Suit.HEARTS),
    ];

    const result = canBeat(kingPair, queenPair, Rank.TWO);
    expect(result.canBeat).toBe(true);
  });

  it('should allow higher straight to beat lower straight', () => {
    const highStraight = [
      createCard(Rank.SEVEN, Suit.SPADES),
      createCard(Rank.EIGHT, Suit.HEARTS),
      createCard(Rank.NINE, Suit.CLUBS),
      createCard(Rank.TEN, Suit.DIAMONDS),
      createCard(Rank.JACK, Suit.SPADES),
    ];
    const lowStraight = [
      createCard(Rank.THREE, Suit.SPADES),
      createCard(Rank.FOUR, Suit.HEARTS),
      createCard(Rank.FIVE, Suit.CLUBS),
      createCard(Rank.SIX, Suit.DIAMONDS),
      createCard(Rank.SEVEN, Suit.HEARTS),
    ];

    const result = canBeat(highStraight, lowStraight, Rank.TWO);
    expect(result.canBeat).toBe(true);
  });

  it('should not allow lower strength to beat higher', () => {
    const queenCard = [createCard(Rank.QUEEN, Suit.SPADES)];
    const kingCard = [createCard(Rank.KING, Suit.HEARTS)];

    const result = canBeat(queenCard, kingCard, Rank.TWO);
    expect(result.canBeat).toBe(false);
    expect(result.reason).toBe('Lower or equal strength');
  });
});

describe('canBeat - different types', () => {
  it('should not allow different non-bomb types', () => {
    const triple = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.KING, Suit.HEARTS),
      createCard(Rank.KING, Suit.CLUBS),
    ];
    const pair = [
      createCard(Rank.ACE, Suit.SPADES),
      createCard(Rank.ACE, Suit.HEARTS),
    ];

    const result = canBeat(triple, pair, Rank.TWO);
    expect(result.canBeat).toBe(false);
    expect(result.reason).toBe('Different card types');
  });

  it('should not allow straight to beat pair', () => {
    const straight = [
      createCard(Rank.THREE, Suit.SPADES),
      createCard(Rank.FOUR, Suit.HEARTS),
      createCard(Rank.FIVE, Suit.CLUBS),
      createCard(Rank.SIX, Suit.DIAMONDS),
      createCard(Rank.SEVEN, Suit.SPADES),
    ];
    const pair = [
      createCard(Rank.TWO, Suit.SPADES),
      createCard(Rank.TWO, Suit.HEARTS),
    ];

    const result = canBeat(straight, pair, Rank.TWO);
    expect(result.canBeat).toBe(false);
    expect(result.reason).toBe('Different card types');
  });
});

describe('comparePlays', () => {
  it('should return positive when play1 beats play2', () => {
    const kingCard = [createCard(Rank.KING, Suit.SPADES)];
    const queenCard = [createCard(Rank.QUEEN, Suit.HEARTS)];

    const result = comparePlays(kingCard, queenCard, Rank.TWO);
    expect(result).toBeGreaterThan(0);
  });

  it('should return negative when play2 beats play1', () => {
    const queenCard = [createCard(Rank.QUEEN, Suit.SPADES)];
    const kingCard = [createCard(Rank.KING, Suit.HEARTS)];

    const result = comparePlays(queenCard, kingCard, Rank.TWO);
    expect(result).toBeLessThan(0);
  });

  it('should return zero for different types', () => {
    const single = [createCard(Rank.ACE, Suit.SPADES)];
    const pair = [
      createCard(Rank.TWO, Suit.SPADES),
      createCard(Rank.TWO, Suit.HEARTS),
    ];

    const result = comparePlays(single, pair, Rank.TWO);
    expect(result).toBe(0);
  });
});

describe('isLegalPlay', () => {
  it('should allow valid first play', () => {
    const cards = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.KING, Suit.HEARTS),
    ];

    const result = isLegalPlay(cards, null, Rank.TWO, true);
    expect(result.canBeat).toBe(true);
  });

  it('should reject empty play', () => {
    const result = isLegalPlay([], null, Rank.TWO, true);
    expect(result.canBeat).toBe(false);
    expect(result.reason).toBe('Cannot play empty cards');
  });

  it('should reject invalid combination', () => {
    const cards = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.QUEEN, Suit.HEARTS),
    ];

    const result = isLegalPlay(cards, null, Rank.TWO, true);
    expect(result.canBeat).toBe(false);
    expect(result.reason).toBe('Invalid card combination');
  });

  it('should validate beating previous play', () => {
    const previous = [createCard(Rank.QUEEN, Suit.SPADES)];
    const play = [createCard(Rank.KING, Suit.HEARTS)];

    const result = isLegalPlay(play, previous, Rank.TWO, false);
    expect(result.canBeat).toBe(true);
  });
});

describe('getMinimumToBeat', () => {
  it('should return minimum for single', () => {
    const queenCard = [createCard(Rank.QUEEN, Suit.SPADES)];
    const result = getMinimumToBeat(queenCard, Rank.TWO);

    expect(result).not.toBeNull();
    expect(result?.type).toBe(CardType.SINGLE);
    expect(result?.minStrength).toBeGreaterThan(0);
  });

  it('should return minimum for pair', () => {
    const pair = [
      createCard(Rank.QUEEN, Suit.SPADES),
      createCard(Rank.QUEEN, Suit.HEARTS),
    ];
    const result = getMinimumToBeat(pair, Rank.TWO);

    expect(result).not.toBeNull();
    expect(result?.type).toBe(CardType.PAIR);
  });

  it('should return minimum for bomb', () => {
    const bomb = [
      createCard(Rank.THREE, Suit.SPADES),
      createCard(Rank.THREE, Suit.HEARTS),
      createCard(Rank.THREE, Suit.CLUBS),
      createCard(Rank.THREE, Suit.DIAMONDS),
    ];
    const result = getMinimumToBeat(bomb, Rank.TWO);

    expect(result).not.toBeNull();
    expect(result?.type).toBe(CardType.BOMB_4);
  });
});

describe('isWindfallCandidate', () => {
  it('should detect playing all remaining cards', () => {
    const cards = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.KING, Suit.HEARTS),
    ];

    const result = isWindfallCandidate(cards, 2, Rank.TWO);
    expect(result).toBe(true);
  });

  it('should not detect partial play', () => {
    const cards = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.KING, Suit.HEARTS),
    ];

    const result = isWindfallCandidate(cards, 5, Rank.TWO);
    expect(result).toBe(false);
  });

  it('should reject invalid last play', () => {
    const cards = [
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.QUEEN, Suit.HEARTS),
    ];

    const result = isWindfallCandidate(cards, 2, Rank.TWO);
    expect(result).toBe(false);
  });
});
