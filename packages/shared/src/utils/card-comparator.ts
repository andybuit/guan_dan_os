/**
 * Card comparison logic for Guandan
 * Handles same-type comparisons and bomb hierarchy
 */

import { Card, CardType } from '../types/card';
import { CardTypeResult, identifyCardType } from './card-validators';

/**
 * Compare result
 * - positive: play1 beats play2
 * - zero: equal strength (shouldn't happen in valid game)
 * - negative: play2 beats play1
 */
export type CompareResult = number;

/**
 * Result of canBeat check
 */
export interface BeatResult {
  canBeat: boolean;
  reason?: string;
}

/**
 * Check if play1 can beat play2 according to Guandan rules
 *
 * Rules:
 * 1. Bombs beat all non-bombs
 * 2. Higher tier bombs beat lower tier bombs
 * 3. Same tier bombs compare by size then rank
 * 4. Non-bombs must be same type to compare
 * 5. Same type non-bombs compare by strength
 *
 * @param play1 - Cards attempting to beat
 * @param play2 - Cards to beat (null means first play)
 * @param currentRank - Current rank (for wildcard detection)
 */
export function canBeat(
  play1: Card[],
  play2: Card[] | null,
  currentRank: string
): BeatResult {
  // First play - anything goes
  if (!play2 || play2.length === 0) {
    const result1 = identifyCardType(play1, currentRank);
    if (!result1.isValid) {
      return { canBeat: false, reason: 'Invalid card type' };
    }
    return { canBeat: true };
  }

  // Identify both plays
  const result1 = identifyCardType(play1, currentRank);
  const result2 = identifyCardType(play2, currentRank);

  if (!result1.isValid) {
    return { canBeat: false, reason: 'Invalid card type' };
  }

  if (!result2.isValid) {
    return { canBeat: false, reason: 'Previous play invalid' };
  }

  // Check bomb hierarchy
  const isBomb1 = isBomb(result1.type!);
  const isBomb2 = isBomb(result2.type!);

  if (isBomb1 && !isBomb2) {
    // Any bomb beats non-bomb
    return { canBeat: true, reason: 'Bomb beats non-bomb' };
  }

  if (isBomb1 && isBomb2) {
    // Bomb vs bomb - compare by tier, size, then rank
    const comparison = compareBombs(result1, result2);
    if (comparison > 0) {
      return { canBeat: true, reason: 'Higher bomb' };
    }
    return { canBeat: false, reason: 'Lower or equal bomb' };
  }

  if (!isBomb1 && isBomb2) {
    // Non-bomb cannot beat bomb
    return { canBeat: false, reason: 'Cannot beat bomb with non-bomb' };
  }

  // Both non-bombs - must be same type
  if (result1.type !== result2.type) {
    return { canBeat: false, reason: 'Different card types' };
  }

  // Same type - compare by strength
  if (result1.strength > result2.strength) {
    return { canBeat: true, reason: 'Higher strength' };
  }

  return { canBeat: false, reason: 'Lower or equal strength' };
}

/**
 * Compare two plays directly
 * Returns positive if play1 beats play2
 */
export function comparePlays(
  play1: Card[],
  play2: Card[],
  currentRank: string
): CompareResult {
  const result1 = identifyCardType(play1, currentRank);
  const result2 = identifyCardType(play2, currentRank);

  if (!result1.isValid || !result2.isValid) {
    return 0;
  }

  const isBomb1 = isBomb(result1.type!);
  const isBomb2 = isBomb(result2.type!);

  // Bomb vs non-bomb
  if (isBomb1 && !isBomb2) return 1;
  if (!isBomb1 && isBomb2) return -1;

  // Bomb vs bomb
  if (isBomb1 && isBomb2) {
    return compareBombs(result1, result2);
  }

  // Non-bomb vs non-bomb - must be same type
  if (result1.type !== result2.type) {
    return 0; // Cannot compare different types
  }

  return result1.strength - result2.strength;
}

/**
 * Check if a card type is a bomb
 */
export function isBomb(type: CardType): boolean {
  return (
    type === CardType.FOUR_KINGS ||
    type === CardType.BOMB_8_PLUS ||
    type === CardType.STRAIGHT_FLUSH ||
    type === CardType.BOMB_7 ||
    type === CardType.BOMB_6 ||
    type === CardType.BOMB_5 ||
    type === CardType.BOMB_4
  );
}

/**
 * Get bomb tier for hierarchy comparison
 * Higher tier = stronger bomb type
 *
 * Hierarchy (high to low):
 * 1. Four Kings (四王)
 * 2. 8+ Bomb (by size: 10-bomb > 9-bomb > 8-bomb)
 * 3. Straight Flush (同花顺)
 * 4. 5-7 Bombs (by size: 7-bomb > 6-bomb > 5-bomb)
 * 5. 4-Bomb (四张炸弹)
 */
export function getBombTier(type: CardType, metadata?: any): number {
  switch (type) {
    case CardType.FOUR_KINGS:
      return 1000; // Highest tier

    case CardType.BOMB_8_PLUS:
      // Tier increases with bomb size
      const bombSize = metadata?.bombSize || 8;
      return 900 + bombSize; // 908, 909, 910, etc.

    case CardType.STRAIGHT_FLUSH:
      return 800; // Below 8+ bombs, above 5-7 bombs

    case CardType.BOMB_7:
      return 700;

    case CardType.BOMB_6:
      return 600;

    case CardType.BOMB_5:
      return 500;

    case CardType.BOMB_4:
      return 400;

    default:
      return 0; // Not a bomb
  }
}

/**
 * Compare two bombs
 * Returns positive if bomb1 beats bomb2
 */
export function compareBombs(
  bomb1: CardTypeResult,
  bomb2: CardTypeResult
): CompareResult {
  if (!bomb1.type || !bomb2.type) return 0;

  const tier1 = getBombTier(bomb1.type, bomb1.metadata);
  const tier2 = getBombTier(bomb2.type, bomb2.metadata);

  // Different tiers - higher tier wins
  if (tier1 !== tier2) {
    return tier1 - tier2;
  }

  // Same tier - compare by strength (which includes rank)
  return bomb1.strength - bomb2.strength;
}

/**
 * Validate if a play is legal in the current context
 *
 * @param play - Cards to play
 * @param previousPlay - Previous play to beat (null if first play)
 * @param currentRank - Current rank for wildcard detection
 * @param isFirstPlay - Whether this is the first play of the round
 */
export function isLegalPlay(
  play: Card[],
  previousPlay: Card[] | null,
  currentRank: string,
  isFirstPlay: boolean = false
): BeatResult {
  // Empty play is not legal
  if (!play || play.length === 0) {
    return { canBeat: false, reason: 'Cannot play empty cards' };
  }

  // First play - just validate card type
  if (isFirstPlay || !previousPlay || previousPlay.length === 0) {
    const result = identifyCardType(play, currentRank);
    if (!result.isValid) {
      return { canBeat: false, reason: 'Invalid card combination' };
    }
    return { canBeat: true };
  }

  // Must beat previous play
  return canBeat(play, previousPlay, currentRank);
}

/**
 * Get the minimum cards needed to beat a play
 * Returns null if impossible to beat
 */
export function getMinimumToBeat(
  previousPlay: Card[],
  currentRank: string
): { type: CardType; minStrength: number } | null {
  const result = identifyCardType(previousPlay, currentRank);

  if (!result.isValid || !result.type) {
    return null;
  }

  const isBombType = isBomb(result.type);

  if (isBombType) {
    // To beat a bomb, need a higher bomb
    return {
      type: result.type,
      minStrength: result.strength + 1,
    };
  }

  // To beat non-bomb, need same type with higher strength
  return {
    type: result.type,
    minStrength: result.strength + 1,
  };
}

/**
 * Check if cards contain 接风 (windfall) opportunity
 * 接风: When a player finishes and others can't beat it, their partner gets next turn
 *
 * This function checks if a play would trigger windfall
 * (i.e., if it's the player's last card(s) and hard to beat)
 */
export function isWindfallCandidate(
  play: Card[],
  remainingCards: number,
  currentRank: string
): boolean {
  // Must be playing all remaining cards
  if (play.length !== remainingCards) {
    return false;
  }

  const result = identifyCardType(play, currentRank);

  // Invalid plays don't trigger windfall
  if (!result.isValid) {
    return false;
  }

  // Any valid last play can trigger windfall
  // The actual windfall happens if no one can beat it
  return true;
}
