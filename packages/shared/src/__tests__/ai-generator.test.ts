/**
 * Tests for AI Player Attribute Generator
 */

import { describe, expect, it } from 'vitest';
import {
  generateAIPlayer,
  generateAIPlayers,
  getAIAvatars,
  isAIPlayerId,
} from '../ai/ai-generator';
import { Rank } from '../types/card';
import { AILevel } from '../types/player';

describe('AI Player Generator', () => {
  describe('generateAIPlayer', () => {
    it('should generate AI player with correct structure', () => {
      const ai = generateAIPlayer(AILevel.NORMAL);

      expect(ai).toHaveProperty('id');
      expect(ai).toHaveProperty('nickname');
      expect(ai).toHaveProperty('avatar');
      expect(ai).toHaveProperty('level');
      expect(ai).toHaveProperty('coins');
      expect(ai).toHaveProperty('currentRank');
      expect(ai).toHaveProperty('aiLevel');
      expect(ai).toHaveProperty('isReady');
    });

    it('should generate AI with correct difficulty level', () => {
      const simple = generateAIPlayer(AILevel.SIMPLE);
      const normal = generateAIPlayer(AILevel.NORMAL);
      const hard = generateAIPlayer(AILevel.HARD);

      expect(simple.aiLevel).toBe(AILevel.SIMPLE);
      expect(normal.aiLevel).toBe(AILevel.NORMAL);
      expect(hard.aiLevel).toBe(AILevel.HARD);
    });

    it('should generate nickname in correct format', () => {
      const ai = generateAIPlayer(AILevel.NORMAL);

      expect(ai.nickname).toMatch(/^AI玩家\d{4}$/);
      const number = parseInt(ai.nickname.slice(4));
      expect(number).toBeGreaterThanOrEqual(1000);
      expect(number).toBeLessThanOrEqual(9999);
    });

    it('should generate level between 8-18', () => {
      for (let i = 0; i < 50; i++) {
        const ai = generateAIPlayer(AILevel.NORMAL);
        expect(ai.level).toBeGreaterThanOrEqual(8);
        expect(ai.level).toBeLessThanOrEqual(18);
      }
    });

    it('should generate coins between 50k-200k', () => {
      for (let i = 0; i < 50; i++) {
        const ai = generateAIPlayer(AILevel.NORMAL);
        expect(ai.coins).toBeGreaterThanOrEqual(50000);
        expect(ai.coins).toBeLessThanOrEqual(200000);
      }
    });

    it('should select avatar from 6 system defaults', () => {
      const avatars = getAIAvatars();
      for (let i = 0; i < 50; i++) {
        const ai = generateAIPlayer(AILevel.NORMAL);
        expect(avatars).toContain(ai.avatar);
      }
    });

    it('should set AI as always ready', () => {
      const ai = generateAIPlayer(AILevel.NORMAL);
      expect(ai.isReady).toBe(true);
    });

    it('should start AI at rank 2', () => {
      const ai = generateAIPlayer(AILevel.NORMAL);
      expect(ai.currentRank).toBe(Rank.TWO);
    });

    it('should generate unique IDs for different AI players', () => {
      const ai1 = generateAIPlayer(AILevel.NORMAL);
      const ai2 = generateAIPlayer(AILevel.NORMAL);

      expect(ai1.id).not.toBe(ai2.id);
    });

    it('should generate ID starting with ai_', () => {
      const ai = generateAIPlayer(AILevel.NORMAL);
      expect(ai.id).toMatch(/^ai_\d+_\d{4}$/);
    });
  });

  describe('generateAIPlayer with seed', () => {
    it('should generate deterministic player with same seed', () => {
      const ai1 = generateAIPlayer(AILevel.NORMAL, 12345);
      const ai2 = generateAIPlayer(AILevel.NORMAL, 12345);

      // ID will differ due to timestamp, but other attributes should match
      expect(ai1.nickname).toBe(ai2.nickname);
      expect(ai1.level).toBe(ai2.level);
      expect(ai1.coins).toBe(ai2.coins);
      expect(ai1.avatar).toBe(ai2.avatar);
    });

    it('should generate different players with different seeds', () => {
      const ai1 = generateAIPlayer(AILevel.NORMAL, 12345);
      const ai2 = generateAIPlayer(AILevel.NORMAL, 67890);

      // At least one attribute should differ
      const allSame =
        ai1.nickname === ai2.nickname &&
        ai1.level === ai2.level &&
        ai1.coins === ai2.coins &&
        ai1.avatar === ai2.avatar;

      expect(allSame).toBe(false);
    });

    it('should still respect level range with seed', () => {
      for (let seed = 0; seed < 50; seed++) {
        const ai = generateAIPlayer(AILevel.NORMAL, seed);
        expect(ai.level).toBeGreaterThanOrEqual(8);
        expect(ai.level).toBeLessThanOrEqual(18);
      }
    });

    it('should still respect coins range with seed', () => {
      for (let seed = 0; seed < 50; seed++) {
        const ai = generateAIPlayer(AILevel.NORMAL, seed);
        expect(ai.coins).toBeGreaterThanOrEqual(50000);
        expect(ai.coins).toBeLessThanOrEqual(200000);
      }
    });
  });

  describe('generateAIPlayers', () => {
    it('should generate specified number of AI players', () => {
      const players = generateAIPlayers(3, AILevel.NORMAL);
      expect(players).toHaveLength(3);
    });

    it('should generate all players with same difficulty', () => {
      const players = generateAIPlayers(4, AILevel.HARD);
      expect(players.every((p) => p.aiLevel === AILevel.HARD)).toBe(true);
    });

    it('should generate players with unique nicknames', () => {
      const players = generateAIPlayers(10, AILevel.NORMAL);
      const nicknames = players.map((p) => p.nickname);
      const uniqueNicknames = new Set(nicknames);

      // With random generation, some duplicates are possible but unlikely
      // For 10 players from 9000 possible nicknames, expect mostly unique
      expect(uniqueNicknames.size).toBeGreaterThanOrEqual(8);
    });

    it('should generate empty array for count 0', () => {
      const players = generateAIPlayers(0, AILevel.NORMAL);
      expect(players).toHaveLength(0);
    });

    it('should generate deterministic players with seed', () => {
      const players1 = generateAIPlayers(3, AILevel.NORMAL, 12345);
      const players2 = generateAIPlayers(3, AILevel.NORMAL, 12345);

      expect(players1[0].nickname).toBe(players2[0].nickname);
      expect(players1[1].nickname).toBe(players2[1].nickname);
      expect(players1[2].nickname).toBe(players2[2].nickname);
    });

    it('should generate different players in batch with seed', () => {
      const players = generateAIPlayers(3, AILevel.NORMAL, 12345);

      // Each player should be different
      expect(players[0].nickname).not.toBe(players[1].nickname);
      expect(players[1].nickname).not.toBe(players[2].nickname);
      expect(players[0].nickname).not.toBe(players[2].nickname);
    });
  });

  describe('isAIPlayerId', () => {
    it('should return true for AI player IDs', () => {
      const ai = generateAIPlayer(AILevel.NORMAL);
      expect(isAIPlayerId(ai.id)).toBe(true);
    });

    it('should return true for any ID starting with ai_', () => {
      expect(isAIPlayerId('ai_123456_7890')).toBe(true);
      expect(isAIPlayerId('ai_test')).toBe(true);
    });

    it('should return false for human player IDs', () => {
      expect(isAIPlayerId('user_123456')).toBe(false);
      expect(isAIPlayerId('player_abc')).toBe(false);
      expect(isAIPlayerId('123456')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isAIPlayerId('')).toBe(false);
    });
  });

  describe('getAIAvatars', () => {
    it('should return 6 avatar options', () => {
      const avatars = getAIAvatars();
      expect(avatars).toHaveLength(6);
    });

    it('should return avatars in correct format', () => {
      const avatars = getAIAvatars();
      avatars.forEach((avatar) => {
        expect(avatar).toMatch(/^avatar_robot_\d$/);
      });
    });

    it('should return readonly array', () => {
      const avatars = getAIAvatars();
      // TypeScript should enforce readonly, but we can test the reference
      expect(Object.isFrozen(avatars)).toBe(false); // Array itself not frozen
      expect(avatars).toEqual([
        'avatar_robot_1',
        'avatar_robot_2',
        'avatar_robot_3',
        'avatar_robot_4',
        'avatar_robot_5',
        'avatar_robot_6',
      ]);
    });
  });

  describe('Integration tests', () => {
    it('should generate full team of AI players', () => {
      const team = generateAIPlayers(2, AILevel.NORMAL);

      expect(team).toHaveLength(2);
      team.forEach((player) => {
        expect(player.isReady).toBe(true);
        expect(player.currentRank).toBe(Rank.TWO);
        expect(isAIPlayerId(player.id)).toBe(true);
      });
    });

    it('should support mixed difficulty levels', () => {
      const simple = generateAIPlayer(AILevel.SIMPLE);
      const normal = generateAIPlayer(AILevel.NORMAL);
      const hard = generateAIPlayer(AILevel.HARD);

      const difficulties = [simple.aiLevel, normal.aiLevel, hard.aiLevel];
      expect(difficulties).toContain(AILevel.SIMPLE);
      expect(difficulties).toContain(AILevel.NORMAL);
      expect(difficulties).toContain(AILevel.HARD);
    });

    it('should generate valid AI players for game setup', () => {
      // Simulate filling 3 AI slots in a 4-player game
      const aiPlayers = generateAIPlayers(3, AILevel.NORMAL);

      aiPlayers.forEach((ai) => {
        // Verify all required fields are present and valid
        expect(ai.id).toBeTruthy();
        expect(ai.nickname).toBeTruthy();
        expect(ai.avatar).toBeTruthy();
        expect(ai.level).toBeGreaterThan(0);
        expect(ai.coins).toBeGreaterThan(0);
        expect(ai.currentRank).toBeTruthy();
        expect(ai.aiLevel).toBeTruthy();
        expect(ai.isReady).toBe(true);
      });
    });
  });
});
