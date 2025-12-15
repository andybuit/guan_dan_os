/**
 * Tests for Game State Management
 *
 * NOTE: Most game engine functions are stubs pending refactoring.
 * These tests cover utility functions that work with the new GameState structure.
 */

import { describe, expect, it } from 'vitest';
import { Rank, Suit } from '../types/card';
import { GamePhase, GameState, PlayerRanking } from '../types/game';
import { SeatPosition } from '../types/room';
import {
  arePartners,
  canResistTribute,
  getFinishedPlayers,
  getNextSeat,
  getPartnerSeat,
  getRemainingCards,
  hasPlayerFinished,
  shouldEndGame,
  startNewTurn,
} from '../utils/game-engine';

describe('Seat Management', () => {
  it('should get next seat clockwise', () => {
    expect(getNextSeat(SeatPosition.NORTH)).toBe(SeatPosition.EAST);
    expect(getNextSeat(SeatPosition.EAST)).toBe(SeatPosition.SOUTH);
    expect(getNextSeat(SeatPosition.SOUTH)).toBe(SeatPosition.WEST);
    expect(getNextSeat(SeatPosition.WEST)).toBe(SeatPosition.NORTH);
  });

  it('should get partner seat', () => {
    expect(getPartnerSeat(SeatPosition.NORTH)).toBe(SeatPosition.SOUTH);
    expect(getPartnerSeat(SeatPosition.SOUTH)).toBe(SeatPosition.NORTH);
    expect(getPartnerSeat(SeatPosition.EAST)).toBe(SeatPosition.WEST);
    expect(getPartnerSeat(SeatPosition.WEST)).toBe(SeatPosition.EAST);
  });

  it('should identify partners', () => {
    expect(arePartners(SeatPosition.NORTH, SeatPosition.SOUTH)).toBe(true);
    expect(arePartners(SeatPosition.EAST, SeatPosition.WEST)).toBe(true);
    expect(arePartners(SeatPosition.NORTH, SeatPosition.EAST)).toBe(false);
    expect(arePartners(SeatPosition.SOUTH, SeatPosition.WEST)).toBe(false);
  });
});

describe('Player Status', () => {
  const createMockGameState = (): GameState => ({
    id: 'game1',
    roomId: 'room1',
    phase: GamePhase.PLAYING,
    roundNumber: 1,
    currentRank: Rank.TWO,
    hands: {
      p1: {
        playerId: 'p1',
        position: SeatPosition.SOUTH,
        cards: [
          { id: '1', rank: Rank.THREE, suit: Suit.HEARTS },
          { id: '2', rank: Rank.FOUR, suit: Suit.DIAMONDS },
        ],
        cardCount: 2,
      },
      p2: {
        playerId: 'p2',
        position: SeatPosition.NORTH,
        cards: [],
        cardCount: 0,
      },
      p3: {
        playerId: 'p3',
        position: SeatPosition.EAST,
        cards: [{ id: '3', rank: Rank.FIVE, suit: Suit.CLUBS }],
        cardCount: 1,
      },
      p4: {
        playerId: 'p4',
        position: SeatPosition.WEST,
        cards: [],
        cardCount: 0,
      },
    },
    turn: {
      playerId: 'p1',
      position: SeatPosition.NORTH,
      startedAt: Date.now(),
      expiresAt: Date.now() + 30000,
      consecutivePasses: 0,
    },
    playHistory: [],
    roundResults: [],
    startedAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
  });

  it('should count remaining cards', () => {
    const state = createMockGameState();
    expect(getRemainingCards(state, 'p1')).toBe(2);
    expect(getRemainingCards(state, 'p2')).toBe(0);
    expect(getRemainingCards(state, 'p3')).toBe(1);
    expect(getRemainingCards(state, 'p4')).toBe(0);
  });

  it('should detect finished players', () => {
    const state = createMockGameState();
    expect(hasPlayerFinished(state, 'p1')).toBe(false);
    expect(hasPlayerFinished(state, 'p2')).toBe(true);
    expect(hasPlayerFinished(state, 'p3')).toBe(false);
    expect(hasPlayerFinished(state, 'p4')).toBe(true);
  });

  it('should get finished players in order', () => {
    const state = createMockGameState();
    state.roundResults = [
      {
        roundNumber: 1,
        rankings: [
          {
            playerId: 'p2',
            position: SeatPosition.EAST,
            ranking: PlayerRanking.FIRST,
          },
          {
            playerId: 'p4',
            position: SeatPosition.WEST,
            ranking: PlayerRanking.SECOND,
          },
        ],
        tributes: [],
        tributeReturns: [],
        rankProgression: [],
        coinChanges: [],
      },
    ];

    const finished = getFinishedPlayers(state);
    expect(finished).toEqual(['p2', 'p4']);
  });

  it('should determine if game should end', () => {
    const state = createMockGameState();

    // 0 finished - game continues
    expect(shouldEndGame(state)).toBe(false);

    // 2 finished - game continues
    state.roundResults = [
      {
        roundNumber: 1,
        rankings: [
          {
            playerId: 'p2',
            position: SeatPosition.EAST,
            ranking: PlayerRanking.FIRST,
          },
          {
            playerId: 'p4',
            position: SeatPosition.WEST,
            ranking: PlayerRanking.SECOND,
          },
        ],
        tributes: [],
        tributeReturns: [],
        rankProgression: [],
        coinChanges: [],
      },
    ];
    expect(shouldEndGame(state)).toBe(false);

    // 3 finished - game ends
    state.roundResults[0].rankings.push({
      playerId: 'p3',
      position: SeatPosition.SOUTH,
      ranking: PlayerRanking.THIRD,
    });
    expect(shouldEndGame(state)).toBe(true);
  });
});

describe('Turn Management', () => {
  const createMockGameState = (): GameState => ({
    id: 'game1',
    roomId: 'room1',
    phase: GamePhase.PLAYING,
    roundNumber: 1,
    currentRank: Rank.TWO,
    hands: {},
    turn: {
      playerId: 'p1',
      position: SeatPosition.NORTH,
      startedAt: Date.now(),
      expiresAt: Date.now() + 30000,
      consecutivePasses: 0,
    },
    playHistory: [],
    roundResults: [],
    startedAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
  });

  it('should create new turn with correct structure', () => {
    const state = createMockGameState();
    const newTurn = startNewTurn(state, 'p2');

    expect(newTurn.playerId).toBe('p2');
    expect(newTurn.consecutivePasses).toBe(0);
    expect(newTurn.startedAt).toBeGreaterThan(0);
    expect(newTurn.expiresAt).toBeGreaterThan(newTurn.startedAt);
  });
});

describe('Tribute Logic', () => {
  it('should detect resistance capability with 2 big jokers', () => {
    const hand = [
      { id: '1', rank: Rank.BIG_JOKER, suit: Suit.JOKER },
      { id: '2', rank: Rank.BIG_JOKER, suit: Suit.JOKER },
      { id: '3', rank: Rank.ACE, suit: Suit.HEARTS },
    ];
    expect(canResistTribute(hand)).toBe(true);
  });

  it('should not detect resistance with 1 big joker', () => {
    const hand = [
      { id: '1', rank: Rank.BIG_JOKER, suit: Suit.JOKER },
      { id: '2', rank: Rank.SMALL_JOKER, suit: Suit.JOKER },
      { id: '3', rank: Rank.ACE, suit: Suit.HEARTS },
    ];
    expect(canResistTribute(hand)).toBe(false);
  });

  it('should not detect resistance with no jokers', () => {
    const hand = [
      { id: '1', rank: Rank.ACE, suit: Suit.HEARTS },
      { id: '2', rank: Rank.KING, suit: Suit.SPADES },
    ];
    expect(canResistTribute(hand)).toBe(false);
  });
});
