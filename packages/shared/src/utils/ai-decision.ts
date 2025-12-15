/**
 * AI Decision Priority System
 * Implements 6-priority decision logic for AI players
 */

import { findPlayableCombos, PlayableCombo } from '../ai/combo-detector';
import { evaluateHand, getCardValue } from '../ai/hand-evaluator';
import { Card, Rank } from '../types/card';
import { GameState } from '../types/game';
import { SeatPosition } from '../types/room';

/**
 * Decision priority levels
 */
export enum DecisionPriority {
  KILL_SHOT = 1, // Can win this round
  MAX_VALUE = 2, // Highest expected gain
  DEFENSE = 3, // Save big cards when losing
  TEAMWORK = 4, // Help partner win
  RISK = 5, // Adjust by game state
  SPECIAL = 6, // Special cases (接风, 抗贡, etc.)
}

/**
 * AI play decision with scoring
 */
export interface PlayDecision {
  play: PlayableCombo;
  priority: DecisionPriority;
  score: number;
  reason: string;
}

/**
 * Context for AI decision making
 */
export interface DecisionContext {
  gameState: GameState;
  aiPlayerId: string;
  aiPosition: SeatPosition;
  hand: Card[];
  currentRank: Rank;
}

/**
 * Evaluate all valid plays and select best decision
 * Combines all 6 priorities with weighted scoring
 */
export function makeAIDecision(context: DecisionContext): PlayDecision | null {
  const validPlays = findPlayableCombos(
    context.hand,
    context.currentRank,
    context.gameState.turn?.lastPlay
      ? {
          cards: context.gameState.turn.lastPlay.cards,
          type: context.gameState.turn.lastPlay.cardType,
        }
      : undefined
  );

  if (validPlays.length === 0) {
    return null; // Must pass
  }

  // Score each play by all priorities
  const decisions: PlayDecision[] = [];

  for (const play of validPlays) {
    // Priority 1: Kill Shot
    const killShot = evaluateKillShot(context, play);
    if (killShot) {
      decisions.push(killShot);
    }

    // Priority 2: Max Value
    const maxValue = evaluateMaxValue(context, play);
    if (maxValue) {
      decisions.push(maxValue);
    }

    // Priority 3: Defense
    const defense = evaluateDefense(context, play);
    if (defense) {
      decisions.push(defense);
    }

    // Priority 4: Teamwork
    const teamwork = evaluateTeamwork(context, play);
    if (teamwork) {
      decisions.push(teamwork);
    }

    // Priority 5: Risk Assessment
    const risk = evaluateRisk(context, play);
    if (risk) {
      decisions.push(risk);
    }

    // Priority 6: Special Cases
    const special = evaluateSpecial(context, play);
    if (special) {
      decisions.push(special);
    }
  }

  // Select best decision by weighted score
  return selectBestDecision(decisions);
}

/**
 * Priority 1: Kill Shot - Can win this round
 */
function evaluateKillShot(
  context: DecisionContext,
  play: PlayableCombo
): PlayDecision | null {
  const remainingCards = context.hand.filter(
    (card) => !play.cards.some((pc) => pc.id === card.id)
  );

  // If this play empties hand, it's a kill shot
  if (remainingCards.length === 0) {
    return {
      play,
      priority: DecisionPriority.KILL_SHOT,
      score: 1000, // Highest priority
      reason: 'Winning play - empties hand',
    };
  }

  // If remaining cards can be played in 1 turn
  const handEval = evaluateHand(remainingCards, context.currentRank);
  if (handEval.hasKillShot && handEval.turnsToFinish <= 2) {
    return {
      play,
      priority: DecisionPriority.KILL_SHOT,
      score: 900,
      reason: 'Setup for win in next turn',
    };
  }

  return null;
}

/**
 * Priority 2: Max Value - Highest expected gain
 */
function evaluateMaxValue(
  context: DecisionContext,
  play: PlayableCombo
): PlayDecision | null {
  const remainingCards = context.hand.filter(
    (card) => !play.cards.some((pc) => pc.id === card.id)
  );

  // Calculate value gained by playing these cards
  const cardValue = play.cards.reduce(
    (sum, card) => sum + getCardValue(card),
    0
  );

  // Evaluate strength improvement
  const beforeEval = evaluateHand(context.hand, context.currentRank);
  const afterEval = evaluateHand(remainingCards, context.currentRank);

  // Better position after play = higher value
  const strengthGain = afterEval.strength - beforeEval.strength;
  const turnReduction = beforeEval.turnsToFinish - afterEval.turnsToFinish;

  const score =
    cardValue * 5 + // Card value weight
    strengthGain * 2 + // Strength improvement weight
    turnReduction * 20; // Turn reduction weight (most important)

  return {
    play,
    priority: DecisionPriority.MAX_VALUE,
    score: Math.max(0, score),
    reason: `Max value play: ${cardValue} points, ${turnReduction} turn reduction`,
  };
}

/**
 * Priority 3: Defense - Save big cards when losing
 */
function evaluateDefense(
  context: DecisionContext,
  play: PlayableCombo
): PlayDecision | null {
  // Check if we're in losing position
  const currentHandSize = context.hand.length;

  // Calculate opponent hand sizes from GameState.hands
  const opponentSizes: number[] = [];
  for (const [playerId, hand] of Object.entries(context.gameState.hands)) {
    if (playerId !== context.aiPlayerId) {
      opponentSizes.push(hand.cards.length);
    }
  }

  if (opponentSizes.length === 0) return null;
  const minOpponentSize = Math.min(...opponentSizes);

  // If we're behind, evaluate defensive play
  if (currentHandSize > minOpponentSize + 5) {
    // Count high-value cards in play
    const highCards = play.cards.filter((c: Card) => getCardValue(c) >= 13); // K, A, Jokers

    // Penalty for playing high cards when behind
    const defensePenalty = highCards.length * 50;

    return {
      play,
      priority: DecisionPriority.DEFENSE,
      score: Math.max(0, 200 - defensePenalty),
      reason: `Defensive play: saving ${highCards.length} high cards`,
    };
  }

  return null;
}

/**
 * Priority 4: Teamwork - Help partner win
 */
function evaluateTeamwork(
  context: DecisionContext,
  play: PlayableCombo
): PlayDecision | null {
  // Find partner (opposite position)
  const partnerPosition = getPartnerPosition(context.aiPosition);

  // Find partner's hand from GameState.hands
  let partnerHandSize = 0;
  for (const [playerId, hand] of Object.entries(context.gameState.hands)) {
    if (hand.position === partnerPosition) {
      partnerHandSize = hand.cards.length;
      break;
    }
  }

  // If partner has few cards, play aggressively to help
  if (partnerHandSize > 0 && partnerHandSize <= 5) {
    const handEval = evaluateHand(context.hand, context.currentRank);

    // Play bombs to clear path for partner
    if (handEval.bombCount > 0 && play.type.toString().includes('BOMB')) {
      return {
        play,
        priority: DecisionPriority.TEAMWORK,
        score: 700,
        reason: 'Playing bomb to help partner finish',
      };
    }

    // Play high cards to block opponents
    const avgCardValue =
      play.cards.reduce((sum: number, c: Card) => sum + getCardValue(c), 0) /
      play.cards.length;
    if (avgCardValue >= 12) {
      return {
        play,
        priority: DecisionPriority.TEAMWORK,
        score: 600,
        reason: 'Playing high cards to protect partner',
      };
    }
  }

  return null;
}

/**
 * Priority 5: Risk Assessment - Adjust by game state
 */
function evaluateRisk(
  context: DecisionContext,
  play: PlayableCombo
): PlayDecision | null {
  const handEval = evaluateHand(context.hand, context.currentRank);

  // Early game (many cards): conservative play
  if (context.hand.length >= 20) {
    // Avoid wasting bombs early
    if (play.type.toString().includes('BOMB') && handEval.bombCount <= 1) {
      return {
        play,
        priority: DecisionPriority.RISK,
        score: 100, // Low score = discourage
        reason: 'High risk: wasting only bomb early game',
      };
    }
  }

  // Mid game (10-19 cards): balanced
  if (context.hand.length >= 10 && context.hand.length < 20) {
    return {
      play,
      priority: DecisionPriority.RISK,
      score: 300,
      reason: 'Medium risk: balanced mid-game play',
    };
  }

  // Late game (<10 cards): aggressive
  if (context.hand.length < 10) {
    return {
      play,
      priority: DecisionPriority.RISK,
      score: 500,
      reason: 'Low risk: aggressive end-game play',
    };
  }

  return null;
}

/**
 * Priority 6: Special Cases - 接风, 抗贡, etc.
 */
function evaluateSpecial(
  context: DecisionContext,
  play: PlayableCombo
): PlayDecision | null {
  // Special case: 接风 (windfall) - partner just finished
  const partnerPosition = getPartnerPosition(context.aiPosition);

  // Check if partner finished
  let partnerFinished = false;
  for (const [playerId, hand] of Object.entries(context.gameState.hands)) {
    if (hand.position === partnerPosition && hand.cards.length === 0) {
      partnerFinished = true;
      break;
    }
  }

  if (partnerFinished) {
    // Partner finished, we get windfall priority
    return {
      play,
      priority: DecisionPriority.SPECIAL,
      score: 800,
      reason: 'Special: 接风 (windfall) - partner finished',
    };
  }

  // More special cases can be added here
  // e.g., 抗贡 (counter-tribute), first play of round, etc.

  return null;
}

/**
 * Select best decision from all evaluated options
 * Combines priorities with weighted scoring
 */
function selectBestDecision(decisions: PlayDecision[]): PlayDecision | null {
  if (decisions.length === 0) return null;

  // Sort by score (highest first)
  decisions.sort((a, b) => b.score - a.score);

  // Return highest scored decision
  return decisions[0];
}

/**
 * Get partner position (opposite side)
 */
function getPartnerPosition(position: SeatPosition): SeatPosition {
  switch (position) {
    case SeatPosition.SOUTH:
      return SeatPosition.NORTH;
    case SeatPosition.NORTH:
      return SeatPosition.SOUTH;
    case SeatPosition.EAST:
      return SeatPosition.WEST;
    case SeatPosition.WEST:
      return SeatPosition.EAST;
  }
}

/**
 * Helper: Check if should pass instead of playing
 */
export function shouldPass(context: DecisionContext): boolean {
  const decision = makeAIDecision(context);

  // No valid plays available
  if (!decision) return true;

  // Very low score = better to pass
  if (decision.score < 100) return true;

  return false;
}
