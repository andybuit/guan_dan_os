/**
 * Game State Management for Guandan
 * Handles game flow, turn management, and state transitions
 */

import { Card, CardPlay, Rank } from '../types/card';
import {
  GamePhase,
  GameState,
  PlayerRanking,
  RoundResult,
  Turn,
} from '../types/game';
import { SeatPosition } from '../types/room';
import { isLegalPlay } from './card-comparator';
import { identifyCardType } from './card-validators';

/**
 * Game action types
 */
export enum GameAction {
  START_GAME = 'START_GAME',
  PLAY_CARDS = 'PLAY_CARDS',
  PASS = 'PASS',
  TRIBUTE = 'TRIBUTE',
  RETURN_TRIBUTE = 'RETURN_TRIBUTE',
  FINISH_PLAYER = 'FINISH_PLAYER',
  END_GAME = 'END_GAME',
}

/**
 * Action payload for playing cards
 */
export interface PlayCardsPayload {
  playerId: string;
  cards: Card[];
}

/**
 * Action payload for tribute
 */
export interface TributePayload {
  fromPlayerId: string;
  toPlayerId: string;
  card: Card;
}

/**
 * Result of a game action
 */
export interface ActionResult {
  success: boolean;
  error?: string;
  state?: GameState;
  events?: GameEvent[];
}

/**
 * Game events for real-time updates
 */
export interface GameEvent {
  type: string;
  data: any;
  timestamp: number;
}

/**
 * Get next player in turn order (clockwise)
 */
export function getNextSeat(current: SeatPosition): SeatPosition {
  const order = [
    SeatPosition.NORTH,
    SeatPosition.EAST,
    SeatPosition.SOUTH,
    SeatPosition.WEST,
  ];
  const currentIndex = order.indexOf(current);
  return order[(currentIndex + 1) % 4];
}

/**
 * Get partner's seat position
 */
export function getPartnerSeat(seat: SeatPosition): SeatPosition {
  switch (seat) {
    case SeatPosition.NORTH:
      return SeatPosition.SOUTH;
    case SeatPosition.SOUTH:
      return SeatPosition.NORTH;
    case SeatPosition.EAST:
      return SeatPosition.WEST;
    case SeatPosition.WEST:
      return SeatPosition.EAST;
  }
}

/**
 * Check if two seats are partners (same team)
 */
export function arePartners(seat1: SeatPosition, seat2: SeatPosition): boolean {
  return getPartnerSeat(seat1) === seat2;
}

/**
 * Get player's remaining card count
 */
export function getRemainingCards(state: GameState, playerId: string): number {
  return state.hands[playerId]?.cards?.length || 0;
}

/**
 * Check if player has finished (no cards left)
 */
export function hasPlayerFinished(state: GameState, playerId: string): boolean {
  return getRemainingCards(state, playerId) === 0;
}

/**
 * Get players who have finished, in order
 */
export function getFinishedPlayers(state: GameState): string[] {
  if (!state.roundResults || state.roundResults.length === 0) {
    return [];
  }

  const currentRound = state.roundResults[state.roundResults.length - 1];
  return currentRound.rankings
    .sort((a, b) => {
      const rankOrder = { FIRST: 1, SECOND: 2, THIRD: 3, LAST: 4 };
      return rankOrder[a.ranking] - rankOrder[b.ranking];
    })
    .map((r) => r.playerId);
}

/**
 * Check if game should end (3 players finished)
 */
export function shouldEndGame(state: GameState): boolean {
  return getFinishedPlayers(state).length >= 3;
}

/**
 * Detect 接风 (windfall) - partner gets next turn after winning play
 *
 * Conditions:
 * 1. Current player just played their last card(s)
 * 2. No one can beat it (all others passed)
 * 3. Partner gets next turn (out of normal order)
 */
export function detectWindfall(
  state: GameState,
  playerId: string
): string | null {
  // Player must have just finished
  if (!hasPlayerFinished(state, playerId)) {
    return null;
  }

  // Must have a last play
  if (!state.turn.lastPlay || !state.turn.lastPlayerId) {
    return null;
  }

  // The finishing player must be the last one who played
  if (state.turn.lastPlayerId !== playerId) {
    return null;
  }

  // Get partner's position
  const playerHand = state.hands[playerId];
  if (!playerHand) return null;

  const playerPosition = playerHand.position;
  const partnerPosition = getPartnerSeat(playerPosition);

  // Find partner's ID
  let partnerId: string | null = null;
  for (const [pid, hand] of Object.entries(state.hands)) {
    if (hand.position === partnerPosition) {
      partnerId = pid;
      break;
    }
  }

  // Partner must still be playing
  if (!partnerId || hasPlayerFinished(state, partnerId)) {
    return null;
  }

  return partnerId;
}

/**
 * Get next player to play based on turn order and game rules
 */
export function getNextPlayer(state: GameState): string | null {
  const { turn, hands } = state;

  // Check for windfall after player finishes
  if (turn.lastPlayerId && hasPlayerFinished(state, turn.lastPlayerId)) {
    const windfallPlayer = detectWindfall(state, turn.lastPlayerId);
    if (windfallPlayer) {
      return windfallPlayer;
    }
  }

  // If 3 consecutive passes, last player who played wins and plays again
  if (turn.consecutivePasses >= 3 && turn.lastPlayerId) {
    return turn.lastPlayerId;
  }

  // Normal clockwise turn order, skip finished players
  let nextPosition = getNextSeat(turn.position);
  let iterations = 0;

  while (iterations < 4) {
    // Find player at this position
    for (const [playerId, hand] of Object.entries(hands)) {
      if (
        hand.position === nextPosition &&
        !hasPlayerFinished(state, playerId)
      ) {
        return playerId;
      }
    }
    nextPosition = getNextSeat(nextPosition);
    iterations++;
  }

  return null;
}

/**
 * Start a new turn with proper timeout
 */
export function startNewTurn(
  state: GameState,
  startingPlayerId: string,
  lastPlay?: CardPlay,
  lastPlayerId?: string
): Turn {
  const now = Date.now();
  const playerHand = state.hands[startingPlayerId];

  return {
    playerId: startingPlayerId,
    position: playerHand?.position || SeatPosition.SOUTH,
    startedAt: now,
    expiresAt: now + 30000, // 30 second timeout
    lastPlay,
    lastPlayerId,
    consecutivePasses: 0,
  };
}

/**
 * Validate and execute PLAY_CARDS action
 */
export function playCards(
  state: GameState,
  payload: PlayCardsPayload
): ActionResult {
  const { playerId, cards } = payload;
  const { turn, hands, currentRank } = state;

  // Must be player's turn
  if (turn.playerId !== playerId) {
    return { success: false, error: 'Not your turn', state };
  }

  // Player must have these cards
  const playerHand = hands[playerId];
  if (!playerHand) {
    return { success: false, error: 'Player not in game', state };
  }

  const cardIds = cards.map((c) => c.id);
  const hasAllCards = cardIds.every((id) =>
    playerHand.cards.some((c) => c.id === id)
  );

  if (!hasAllCards) {
    return { success: false, error: 'Invalid cards', state };
  }

  // Identify card type
  const cardTypeResult = identifyCardType(cards, currentRank);
  if (!cardTypeResult.isValid || !cardTypeResult.type) {
    return { success: false, error: 'Invalid card combination', state };
  }

  // Validate play is legal
  const isFirstPlay = !turn.lastPlay || turn.consecutivePasses >= 3;
  const legalCheck = isLegalPlay(
    cards,
    isFirstPlay ? null : turn.lastPlay?.cards || null,
    currentRank,
    isFirstPlay
  );

  if (!legalCheck.canBeat) {
    return {
      success: false,
      error: legalCheck.reason || 'Cannot beat last play',
      state,
    };
  }

  // Remove cards from hand
  const newCards = playerHand.cards.filter((c) => !cardIds.includes(c.id));
  const playerFinished = newCards.length === 0;

  // Create card play
  const cardPlay: CardPlay = {
    playerId,
    cards,
    cardType: cardTypeResult.type,
    timestamp: Date.now(),
    strength: cardTypeResult.strength || 0,
  };

  // Update game state
  const newHands = {
    ...hands,
    [playerId]: {
      ...playerHand,
      cards: newCards,
      cardCount: newCards.length,
    },
  };

  // Add to play history
  const newPlayHistory = [...state.playHistory, cardPlay];

  // Get next player
  const nextPlayerId = getNextPlayer({
    ...state,
    hands: newHands,
    turn: {
      ...turn,
      lastPlay: cardPlay,
      lastPlayerId: playerId,
      consecutivePasses: 0,
    },
  });

  if (!nextPlayerId) {
    return { success: false, error: 'Cannot determine next player', state };
  }

  // Create new turn
  const newTurn = startNewTurn(
    { ...state, hands: newHands },
    nextPlayerId,
    cardPlay,
    playerId
  );

  const newState: GameState = {
    ...state,
    hands: newHands,
    turn: newTurn,
    playHistory: newPlayHistory,
    updatedAt: Date.now(),
    version: state.version + 1,
  };

  // Check if game should end
  if (shouldEndGame(newState)) {
    newState.phase = GamePhase.ROUND_END;
  }

  const events: GameEvent[] = [
    {
      type: 'CARD_PLAYED',
      data: { playerId, cards, cardType: cardTypeResult.type, playerFinished },
      timestamp: Date.now(),
    },
  ];

  if (playerFinished) {
    events.push({
      type: 'PLAYER_FINISHED',
      data: { playerId },
      timestamp: Date.now(),
    });
  }

  return { success: true, state: newState, events };
}

/**
 * Validate and execute PASS action
 */
export function passPlay(state: GameState, playerId: string): ActionResult {
  const { turn } = state;

  // Must be player's turn
  if (turn.playerId !== playerId) {
    return { success: false, error: 'Not your turn', state };
  }

  // Cannot pass if you're first to play (or round is reset)
  if (!turn.lastPlay || turn.consecutivePasses >= 3) {
    return { success: false, error: 'Cannot pass as first player', state };
  }

  // Update turn with pass
  const newConsecutivePasses = turn.consecutivePasses + 1;

  // Get next player
  const nextPlayerId = getNextPlayer({
    ...state,
    turn: {
      ...turn,
      consecutivePasses: newConsecutivePasses,
    },
  });

  if (!nextPlayerId) {
    return { success: false, error: 'Cannot determine next player', state };
  }

  // If 3 passes, round resets - last player wins and plays again
  let newTurn: Turn;
  if (newConsecutivePasses >= 3) {
    newTurn = startNewTurn(state, nextPlayerId);
  } else {
    newTurn = startNewTurn(
      state,
      nextPlayerId,
      turn.lastPlay,
      turn.lastPlayerId
    );
    newTurn.consecutivePasses = newConsecutivePasses;
  }

  const newState: GameState = {
    ...state,
    turn: newTurn,
    updatedAt: Date.now(),
    version: state.version + 1,
  };

  const events: GameEvent[] = [
    {
      type: 'PLAYER_PASSED',
      data: { playerId },
      timestamp: Date.now(),
    },
  ];

  return { success: true, state: newState, events };
}

/**
 * Calculate final rankings from current round
 */
export function calculateFinalRankings(state: GameState): PlayerRanking[] {
  const finishedPlayers = getFinishedPlayers(state);
  const rankingMap: PlayerRanking[] = [];

  // Assign rankings based on finish order
  const rankingOrder = [
    PlayerRanking.FIRST,
    PlayerRanking.SECOND,
    PlayerRanking.THIRD,
    PlayerRanking.LAST,
  ];

  let rankIndex = 0;

  // Add finished players in order
  for (const playerId of finishedPlayers) {
    rankingMap.push(rankingOrder[rankIndex]);
    rankIndex++;
  }

  // Add unfinished player(s) as LAST
  for (const [playerId, hand] of Object.entries(state.hands)) {
    if (!finishedPlayers.includes(playerId)) {
      rankingMap.push(PlayerRanking.LAST);
    }
  }

  return rankingMap;
}

/**
 * Determine tribute requirements based on round results
 *
 * 双下 (double down): Both winners (1st + 2nd) from same team → both losers pay
 * 单下 (single down): Winners are 1st + 3rd → last place pays to first
 */
export function determineTributeRequirements(roundResult: RoundResult): {
  tributeRequired: boolean;
  tributeType: 'double' | 'single' | null;
  tributePairs: Array<{ from: string; to: string }>;
} {
  const { rankings } = roundResult;

  if (rankings.length < 4) {
    return {
      tributeRequired: false,
      tributeType: null,
      tributePairs: [],
    };
  }

  // Get players by ranking
  const first = rankings.find((r) => r.ranking === PlayerRanking.FIRST);
  const second = rankings.find((r) => r.ranking === PlayerRanking.SECOND);
  const third = rankings.find((r) => r.ranking === PlayerRanking.THIRD);
  const last = rankings.find((r) => r.ranking === PlayerRanking.LAST);

  if (!first || !second || !third || !last) {
    return {
      tributeRequired: false,
      tributeType: null,
      tributePairs: [],
    };
  }

  // Check if 1st and 2nd are partners (双下)
  const firstAndSecondPartners = arePartners(first.position, second.position);

  if (firstAndSecondPartners) {
    // 双下: Both losers pay tribute
    return {
      tributeRequired: true,
      tributeType: 'double',
      tributePairs: [
        { from: last.playerId, to: first.playerId },
        { from: third.playerId, to: second.playerId },
      ],
    };
  }

  // Check if 1st and 3rd are partners (单下)
  const firstAndThirdPartners = arePartners(first.position, third.position);

  if (firstAndThirdPartners) {
    // 单下: Last place pays to first
    return {
      tributeRequired: true,
      tributeType: 'single',
      tributePairs: [{ from: last.playerId, to: first.playerId }],
    };
  }

  // No tribute required
  return {
    tributeRequired: false,
    tributeType: null,
    tributePairs: [],
  };
}

/**
 * Check if player can resist tribute (抗贡) with two big jokers
 */
export function canResistTribute(hand: Card[]): boolean {
  const bigJokers = hand.filter((c) => c.rank === Rank.BIG_JOKER);
  return bigJokers.length >= 2;
}
