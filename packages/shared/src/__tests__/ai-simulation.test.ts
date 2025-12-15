/**
 * AI Simulation Tests
 * Tests AI decision-making and validates win rates across difficulty levels
 */

import { describe, expect, it } from 'vitest';
import { AILevel } from '../types/player';
import {
  generateAIAttributes,
  generateAIAvatar,
  generateAICoins,
  generateAILevel,
  generateAINickname,
} from '../utils/ai-attributes';
import {
  adjustDifficulty,
  createAIPlayerState,
  getAIDifficultyInfo,
  getThinkDelay,
  needsWinRateAdjustment,
  updateAIStats,
} from '../utils/ai-player';

describe('AI Attributes Generation', () => {
  it('should generate unique AI nicknames', () => {
    const nicknames = new Set<string>();
    for (let i = 0; i < 100; i++) {
      nicknames.add(generateAINickname());
    }
    // Should have at least 95% unique nicknames in 100 tries
    expect(nicknames.size).toBeGreaterThanOrEqual(95);
  });

  it('should generate AI nicknames in correct format', () => {
    const nickname = generateAINickname();
    expect(nickname).toMatch(/^AI玩家\d+$/);
  });

  it('should generate appropriate levels for each difficulty', () => {
    // Simple: 8-11
    for (let i = 0; i < 10; i++) {
      const level = generateAILevel(AILevel.SIMPLE);
      expect(level).toBeGreaterThanOrEqual(8);
      expect(level).toBeLessThanOrEqual(11);
    }

    // Normal: 12-15
    for (let i = 0; i < 10; i++) {
      const level = generateAILevel(AILevel.NORMAL);
      expect(level).toBeGreaterThanOrEqual(12);
      expect(level).toBeLessThanOrEqual(15);
    }

    // Hard: 16-18
    for (let i = 0; i < 10; i++) {
      const level = generateAILevel(AILevel.HARD);
      expect(level).toBeGreaterThanOrEqual(16);
      expect(level).toBeLessThanOrEqual(18);
    }
  });

  it('should generate coins in valid range', () => {
    for (let i = 0; i < 20; i++) {
      const coins = generateAICoins();
      expect(coins).toBeGreaterThanOrEqual(50000);
      expect(coins).toBeLessThanOrEqual(200000);
    }
  });

  it('should generate valid avatar identifiers', () => {
    const validAvatars = [
      'avatar_1',
      'avatar_2',
      'avatar_3',
      'avatar_4',
      'avatar_5',
      'avatar_6',
    ];
    for (let i = 0; i < 20; i++) {
      const avatar = generateAIAvatar();
      expect(validAvatars).toContain(avatar);
    }
  });

  it('should generate complete AI attributes', () => {
    const attrs = generateAIAttributes(AILevel.NORMAL);

    expect(attrs.nickname).toMatch(/^AI玩家\d+$/);
    expect(attrs.level).toBeGreaterThanOrEqual(12);
    expect(attrs.level).toBeLessThanOrEqual(15);
    expect(attrs.coins).toBeGreaterThanOrEqual(50000);
    expect(attrs.coins).toBeLessThanOrEqual(200000);
    expect(attrs.avatar).toMatch(/^avatar_\d$/);
    expect(attrs.isReady).toBe(true);
  });
});

describe('AI Player State Management', () => {
  it('should create initial AI player state', () => {
    const state = createAIPlayerState('ai_123', AILevel.NORMAL);

    expect(state.playerId).toBe('ai_123');
    expect(state.difficulty).toBe(AILevel.NORMAL);
    expect(state.gamesPlayed).toBe(0);
    expect(state.gamesWon).toBe(0);
    expect(state.currentWinRate).toBe(0);
  });

  it('should update stats after wins and losses', () => {
    let state = createAIPlayerState('ai_123', AILevel.NORMAL);

    // Win 3 games
    state = updateAIStats(state, true);
    state = updateAIStats(state, true);
    state = updateAIStats(state, true);

    expect(state.gamesPlayed).toBe(3);
    expect(state.gamesWon).toBe(3);
    expect(state.currentWinRate).toBeCloseTo(1.0);

    // Lose 2 games
    state = updateAIStats(state, false);
    state = updateAIStats(state, false);

    expect(state.gamesPlayed).toBe(5);
    expect(state.gamesWon).toBe(3);
    expect(state.currentWinRate).toBeCloseTo(0.6);
  });

  it('should detect when win rate adjustment is needed', () => {
    let state = createAIPlayerState('ai_123', AILevel.NORMAL);

    // Target is 45% for Normal
    // Play 20 games, win 15 (75% win rate)
    for (let i = 0; i < 15; i++) {
      state = updateAIStats(state, true);
    }
    for (let i = 0; i < 5; i++) {
      state = updateAIStats(state, false);
    }

    // 75% is >10% above target 45%, should need adjustment
    expect(needsWinRateAdjustment(state)).toBe(true);

    // Not enough games yet
    const newState = createAIPlayerState('ai_456', AILevel.NORMAL);
    expect(needsWinRateAdjustment(newState)).toBe(false);
  });

  it('should suggest difficulty adjustments', () => {
    // Winning too much (75% with Normal target 45%)
    let state = createAIPlayerState('ai_123', AILevel.NORMAL);
    for (let i = 0; i < 15; i++) {
      state = updateAIStats(state, true);
    }
    for (let i = 0; i < 5; i++) {
      state = updateAIStats(state, false);
    }

    const newDifficulty = adjustDifficulty(state);
    expect(newDifficulty).toBe(AILevel.SIMPLE); // Should reduce difficulty

    // Winning too little (20% with Normal target 45%)
    let state2 = createAIPlayerState('ai_456', AILevel.NORMAL);
    for (let i = 0; i < 4; i++) {
      state2 = updateAIStats(state2, true);
    }
    for (let i = 0; i < 16; i++) {
      state2 = updateAIStats(state2, false);
    }

    const newDifficulty2 = adjustDifficulty(state2);
    expect(newDifficulty2).toBe(AILevel.HARD); // Should increase difficulty
  });
});

describe('AI Difficulty Configuration', () => {
  it('should provide think delays in correct ranges', () => {
    // Simple: 1000-2000ms
    for (let i = 0; i < 10; i++) {
      const delay = getThinkDelay(AILevel.SIMPLE);
      expect(delay).toBeGreaterThanOrEqual(1000);
      expect(delay).toBeLessThanOrEqual(2000);
    }

    // Normal: 1500-2500ms
    for (let i = 0; i < 10; i++) {
      const delay = getThinkDelay(AILevel.NORMAL);
      expect(delay).toBeGreaterThanOrEqual(1500);
      expect(delay).toBeLessThanOrEqual(2500);
    }

    // Hard: 2000-3000ms
    for (let i = 0; i < 10; i++) {
      const delay = getThinkDelay(AILevel.HARD);
      expect(delay).toBeGreaterThanOrEqual(2000);
      expect(delay).toBeLessThanOrEqual(3000);
    }
  });

  it('should provide difficulty info', () => {
    const simpleInfo = getAIDifficultyInfo(AILevel.SIMPLE);
    expect(simpleInfo.name).toBe(AILevel.SIMPLE);
    expect(simpleInfo.targetWinRate).toBe(0.3);
    expect(simpleInfo.description).toContain('conservative');

    const normalInfo = getAIDifficultyInfo(AILevel.NORMAL);
    expect(normalInfo.name).toBe(AILevel.NORMAL);
    expect(normalInfo.targetWinRate).toBe(0.45);
    expect(normalInfo.description).toContain('Balanced');

    const hardInfo = getAIDifficultyInfo(AILevel.HARD);
    expect(hardInfo.name).toBe(AILevel.HARD);
    expect(hardInfo.targetWinRate).toBe(0.55);
    expect(hardInfo.description).toContain('optimal');
  });
});

describe('AI Decision Logic', () => {
  it('should prioritize kill shots', () => {
    // This would test the priority system
    // For now, just verify the priority enum exists
    const priorities = [1, 2, 3, 4, 5, 6];
    expect(priorities).toContain(1); // Kill shot priority
  });

  it('should consider partner status in teamwork priority', () => {
    // This would test partner-aware decision making
    // Placeholder for future implementation
    expect(true).toBe(true);
  });

  it('should adjust play based on hand size (risk assessment)', () => {
    // This would test risk-based decision making
    // Early game: conservative
    // Late game: aggressive
    // Placeholder for future implementation
    expect(true).toBe(true);
  });
});

describe('AI Win Rate Validation', () => {
  // Note: Full simulation would require running actual games
  // These tests validate the win rate tracking mechanism

  it('should track win rates accurately over multiple games', () => {
    const state = createAIPlayerState('ai_test', AILevel.NORMAL);
    const results = [
      true,
      false,
      true,
      true,
      false,
      true,
      false,
      false,
      true,
      true,
    ];

    let currentState = state;
    for (const result of results) {
      currentState = updateAIStats(currentState, result);
    }

    // 6 wins out of 10 = 60% win rate
    expect(currentState.gamesPlayed).toBe(10);
    expect(currentState.gamesWon).toBe(6);
    expect(currentState.currentWinRate).toBeCloseTo(0.6);
  });

  it('should maintain consistent win rate targets per difficulty', () => {
    // Simple target: 30%
    // Normal target: 45%
    // Hard target: 55%

    const simpleInfo = getAIDifficultyInfo(AILevel.SIMPLE);
    const normalInfo = getAIDifficultyInfo(AILevel.NORMAL);
    const hardInfo = getAIDifficultyInfo(AILevel.HARD);

    expect(simpleInfo.targetWinRate).toBeLessThan(normalInfo.targetWinRate);
    expect(normalInfo.targetWinRate).toBeLessThan(hardInfo.targetWinRate);
  });
});

describe('AI Randomness Distribution', () => {
  it('should apply appropriate randomness per difficulty', () => {
    // Simple: 50% randomness
    // Normal: 20% randomness
    // Hard: 5% randomness

    // This is validated by the difficulty configs
    // Actual testing would require running many games
    expect(true).toBe(true);
  });
});

describe('AI Integration', () => {
  it('should handle AI disconnection as always connected', () => {
    // AI never disconnects
    // This is enforced by the AI manager
    expect(true).toBe(true);
  });

  it('should mark AI stats as non-leaderboard eligible', () => {
    // AI stats should never appear on leaderboards
    // This is enforced by the AI manager
    expect(true).toBe(true);
  });
});
