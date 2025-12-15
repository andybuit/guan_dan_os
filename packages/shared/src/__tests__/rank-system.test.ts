/**
 * Tests for Rank Progression and Settlement System
 */

import { describe, expect, it } from 'vitest';
import { Rank } from '../types/card';
import { Team } from '../types/room';
import {
  calculateSettlement,
  calculateUpgrade,
  determineWinningTeam,
  distanceToA,
  formatRank,
  getNextRank,
  getRankIndex,
  isALevel,
  PlayerFinishOrder,
  RANK_ORDER,
  TeamRankState,
} from '../utils/rank-system';

describe('Rank Order and Navigation', () => {
  it('should have correct rank order', () => {
    expect(RANK_ORDER).toHaveLength(13);
    expect(RANK_ORDER[0]).toBe(Rank.TWO);
    expect(RANK_ORDER[12]).toBe(Rank.ACE);
  });

  it('should get next rank', () => {
    expect(getNextRank(Rank.TWO)).toBe(Rank.THREE);
    expect(getNextRank(Rank.NINE)).toBe(Rank.TEN);
    expect(getNextRank(Rank.KING)).toBe(Rank.ACE);
  });

  it('should advance multiple levels', () => {
    expect(getNextRank(Rank.TWO, 2)).toBe(Rank.FOUR);
    expect(getNextRank(Rank.FIVE, 3)).toBe(Rank.EIGHT);
  });

  it('should not advance beyond A', () => {
    expect(getNextRank(Rank.ACE, 1)).toBe(Rank.ACE);
    expect(getNextRank(Rank.KING, 5)).toBe(Rank.ACE);
  });

  it('should identify A-level', () => {
    expect(isALevel(Rank.ACE)).toBe(true);
    expect(isALevel(Rank.KING)).toBe(false);
    expect(isALevel(Rank.TWO)).toBe(false);
  });

  it('should get rank index', () => {
    expect(getRankIndex(Rank.TWO)).toBe(0);
    expect(getRankIndex(Rank.ACE)).toBe(12);
    expect(getRankIndex(Rank.FIVE)).toBe(3);
  });

  it('should calculate distance to A', () => {
    expect(distanceToA(Rank.TWO)).toBe(12);
    expect(distanceToA(Rank.KING)).toBe(1);
    expect(distanceToA(Rank.ACE)).toBe(0);
  });

  it('should format rank display', () => {
    expect(formatRank(Rank.TWO)).toBe('2');
    expect(formatRank(Rank.TEN)).toBe('10');
    expect(formatRank(Rank.JACK)).toBe('J');
    expect(formatRank(Rank.ACE)).toBe('A');
  });
});

describe('Winning Team Determination', () => {
  it('should determine winning team from first place', () => {
    const rankings: PlayerFinishOrder[] = [
      { playerId: 'p1', rank: 1, finishedAt: 1000 },
      { playerId: 'p2', rank: 2, finishedAt: 2000 },
      { playerId: 'p3', rank: 3, finishedAt: 3000 },
      { playerId: 'p4', rank: 4, finishedAt: 4000 },
    ];

    const seatTeamMap = new Map([
      ['p1', Team.NS],
      ['p2', Team.EW],
      ['p3', Team.NS],
      ['p4', Team.EW],
    ]);

    const winner = determineWinningTeam(rankings, seatTeamMap);
    expect(winner).toBe(Team.NS);
  });

  it('should handle unsorted rankings', () => {
    const rankings: PlayerFinishOrder[] = [
      { playerId: 'p3', rank: 3, finishedAt: 3000 },
      { playerId: 'p1', rank: 1, finishedAt: 1000 },
      { playerId: 'p4', rank: 4, finishedAt: 4000 },
      { playerId: 'p2', rank: 2, finishedAt: 2000 },
    ];

    const seatTeamMap = new Map([
      ['p1', Team.NS],
      ['p2', Team.EW],
      ['p3', Team.NS],
      ['p4', Team.EW],
    ]);

    const winner = determineWinningTeam(rankings, seatTeamMap);
    expect(winner).toBe(Team.NS);
  });
});

describe('Upgrade Calculation - Normal Levels', () => {
  it('should upgrade 3 levels for 双下 (double down)', () => {
    const rankings: PlayerFinishOrder[] = [
      { playerId: 'p1', rank: 1, finishedAt: 1000 },
      { playerId: 'p2', rank: 2, finishedAt: 2000 },
      { playerId: 'p3', rank: 3, finishedAt: 3000 },
      { playerId: 'p4', rank: 4, finishedAt: 4000 },
    ];

    const seatTeamMap = new Map([
      ['p1', Team.NS],
      ['p2', Team.NS], // Partner is 2nd
      ['p3', Team.EW], // Opponents are 3rd and 4th
      ['p4', Team.EW],
    ]);

    const result = calculateUpgrade(rankings, seatTeamMap, Rank.TWO);

    expect(result.levelsGained).toBe(3);
    expect(result.newRank).toBe(Rank.FIVE);
    expect(result.reason).toBe('DOUBLE_DOWN');
  });

  it('should upgrade 2 levels for 单下 (single down)', () => {
    const rankings: PlayerFinishOrder[] = [
      { playerId: 'p1', rank: 1, finishedAt: 1000 },
      { playerId: 'p2', rank: 2, finishedAt: 2000 },
      { playerId: 'p3', rank: 3, finishedAt: 3000 },
      { playerId: 'p4', rank: 4, finishedAt: 4000 },
    ];

    const seatTeamMap = new Map([
      ['p1', Team.NS],
      ['p2', Team.NS], // Partner is 2nd
      ['p3', Team.NS], // One teammate is 3rd
      ['p4', Team.EW], // One opponent is 4th
    ]);

    const result = calculateUpgrade(rankings, seatTeamMap, Rank.THREE);

    expect(result.levelsGained).toBe(2);
    expect(result.newRank).toBe(Rank.FIVE);
    expect(result.reason).toBe('SINGLE_DOWN');
  });

  it('should upgrade 1 level for 未抓人 (no catch)', () => {
    const rankings: PlayerFinishOrder[] = [
      { playerId: 'p1', rank: 1, finishedAt: 1000 },
      { playerId: 'p2', rank: 2, finishedAt: 2000 },
      { playerId: 'p3', rank: 3, finishedAt: 3000 },
      { playerId: 'p4', rank: 4, finishedAt: 4000 },
    ];

    const seatTeamMap = new Map([
      ['p1', Team.NS],
      ['p2', Team.NS], // Partner is 2nd
      ['p3', Team.EW], // Opponent is 3rd
      ['p4', Team.NS], // Teammate is 4th
    ]);

    const result = calculateUpgrade(rankings, seatTeamMap, Rank.SIX);

    expect(result.levelsGained).toBe(1);
    expect(result.newRank).toBe(Rank.SEVEN);
    expect(result.reason).toBe('NO_CATCH');
  });

  it('should upgrade 1 level for 头游+末游 (weak win)', () => {
    const rankings: PlayerFinishOrder[] = [
      { playerId: 'p1', rank: 1, finishedAt: 1000 },
      { playerId: 'p2', rank: 2, finishedAt: 2000 },
      { playerId: 'p3', rank: 3, finishedAt: 3000 },
      { playerId: 'p4', rank: 4, finishedAt: 4000 },
    ];

    const seatTeamMap = new Map([
      ['p1', Team.NS],
      ['p2', Team.EW], // Opponent is 2nd
      ['p3', Team.EW], // Opponent is 3rd
      ['p4', Team.NS], // Partner is 4th (末游)
    ]);

    const result = calculateUpgrade(rankings, seatTeamMap, Rank.NINE);

    expect(result.levelsGained).toBe(1);
    expect(result.newRank).toBe(Rank.TEN);
    expect(result.reason).toBe('WEAK_WIN');
  });
});

describe('Upgrade Calculation - A Level', () => {
  it('should stay at A when partner is not 末游 (success)', () => {
    const rankings: PlayerFinishOrder[] = [
      { playerId: 'p1', rank: 1, finishedAt: 1000 },
      { playerId: 'p2', rank: 2, finishedAt: 2000 },
      { playerId: 'p3', rank: 3, finishedAt: 3000 },
      { playerId: 'p4', rank: 4, finishedAt: 4000 },
    ];

    const seatTeamMap = new Map([
      ['p1', Team.NS],
      ['p2', Team.NS], // Partner is 2nd (not 末游)
      ['p3', Team.EW],
      ['p4', Team.EW],
    ]);

    const result = calculateUpgrade(rankings, seatTeamMap, Rank.ACE, 0);

    expect(result.newRank).toBe(Rank.ACE);
    expect(result.levelsGained).toBe(0);
    expect(result.reason).toBe('A_LEVEL_SUCCESS');
    expect(result.aLevelFailCount).toBe(0);
  });

  it('should increment fail count when partner is 末游', () => {
    const rankings: PlayerFinishOrder[] = [
      { playerId: 'p1', rank: 1, finishedAt: 1000 },
      { playerId: 'p2', rank: 2, finishedAt: 2000 },
      { playerId: 'p3', rank: 3, finishedAt: 3000 },
      { playerId: 'p4', rank: 4, finishedAt: 4000 },
    ];

    const seatTeamMap = new Map([
      ['p1', Team.NS],
      ['p2', Team.EW],
      ['p3', Team.EW],
      ['p4', Team.NS], // Partner is 4th (末游)
    ]);

    const result = calculateUpgrade(rankings, seatTeamMap, Rank.ACE, 1);

    expect(result.newRank).toBe(Rank.ACE);
    expect(result.levelsGained).toBe(0);
    expect(result.reason).toBe('A_LEVEL_FAILURE');
    expect(result.aLevelFailCount).toBe(2);
  });

  it('should apply penalty after 3 consecutive A-level failures', () => {
    const rankings: PlayerFinishOrder[] = [
      { playerId: 'p1', rank: 1, finishedAt: 1000 },
      { playerId: 'p2', rank: 2, finishedAt: 2000 },
      { playerId: 'p3', rank: 3, finishedAt: 3000 },
      { playerId: 'p4', rank: 4, finishedAt: 4000 },
    ];

    const seatTeamMap = new Map([
      ['p1', Team.NS],
      ['p2', Team.EW],
      ['p3', Team.EW],
      ['p4', Team.NS], // Partner is 末游
    ]);

    const result = calculateUpgrade(rankings, seatTeamMap, Rank.ACE, 2); // 3rd failure

    expect(result.newRank).toBe(Rank.TWO);
    expect(result.levelsGained).toBe(0);
    expect(result.reason).toBe('A_LEVEL_PENALTY');
    expect(result.aLevelFailCount).toBe(0); // Reset after penalty
  });

  it('should reset fail count on A-level success', () => {
    const rankings: PlayerFinishOrder[] = [
      { playerId: 'p1', rank: 1, finishedAt: 1000 },
      { playerId: 'p2', rank: 2, finishedAt: 2000 },
      { playerId: 'p3', rank: 3, finishedAt: 3000 },
      { playerId: 'p4', rank: 4, finishedAt: 4000 },
    ];

    const seatTeamMap = new Map([
      ['p1', Team.NS],
      ['p2', Team.NS], // Partner is 2nd (success)
      ['p3', Team.EW],
      ['p4', Team.EW],
    ]);

    const result = calculateUpgrade(rankings, seatTeamMap, Rank.ACE, 2);

    expect(result.newRank).toBe(Rank.ACE);
    expect(result.reason).toBe('A_LEVEL_SUCCESS');
    expect(result.aLevelFailCount).toBe(0); // Reset from 2 to 0
  });
});

describe('Settlement Calculation', () => {
  it('should calculate complete settlement with tribute', () => {
    const rankings: PlayerFinishOrder[] = [
      { playerId: 'p1', rank: 1, finishedAt: 1000 },
      { playerId: 'p2', rank: 2, finishedAt: 2000 },
      { playerId: 'p3', rank: 3, finishedAt: 3000 },
      { playerId: 'p4', rank: 4, finishedAt: 4000 },
    ];

    const seatTeamMap = new Map([
      ['p1', Team.NS],
      ['p2', Team.NS],
      ['p3', Team.EW],
      ['p4', Team.EW],
    ]);

    const teamRankState: TeamRankState = {
      team: Team.NS,
      currentRank: Rank.FIVE,
      aLevelFailCount: 0,
    };

    const result = calculateSettlement(rankings, seatTeamMap, teamRankState);

    expect(result.winningTeam).toBe(Team.NS);
    expect(result.upgradeResult.levelsGained).toBe(3);
    expect(result.upgradeResult.newRank).toBe(Rank.EIGHT);
    expect(result.tributeRequired).toBe(true);
    expect(result.tributeType).toBe('double');
  });

  it('should calculate settlement without tribute', () => {
    const rankings: PlayerFinishOrder[] = [
      { playerId: 'p1', rank: 1, finishedAt: 1000 },
      { playerId: 'p2', rank: 2, finishedAt: 2000 },
      { playerId: 'p3', rank: 3, finishedAt: 3000 },
      { playerId: 'p4', rank: 4, finishedAt: 4000 },
    ];

    const seatTeamMap = new Map([
      ['p1', Team.NS],
      ['p2', Team.NS],
      ['p3', Team.EW],
      ['p4', Team.NS], // Teammate is 4th, so no tribute (未抓人)
    ]);

    const teamRankState: TeamRankState = {
      team: Team.NS,
      currentRank: Rank.SEVEN,
      aLevelFailCount: 0,
    };

    const result = calculateSettlement(rankings, seatTeamMap, teamRankState);

    expect(result.winningTeam).toBe(Team.NS);
    expect(result.tributeRequired).toBe(false);
    expect(result.tributeType).toBeNull();
  });

  it('should handle A-level settlement', () => {
    const rankings: PlayerFinishOrder[] = [
      { playerId: 'p1', rank: 1, finishedAt: 1000 },
      { playerId: 'p2', rank: 2, finishedAt: 2000 },
      { playerId: 'p3', rank: 3, finishedAt: 3000 },
      { playerId: 'p4', rank: 4, finishedAt: 4000 },
    ];

    const seatTeamMap = new Map([
      ['p1', Team.NS],
      ['p2', Team.NS],
      ['p3', Team.EW],
      ['p4', Team.EW],
    ]);

    const teamRankState: TeamRankState = {
      team: Team.NS,
      currentRank: Rank.ACE,
      aLevelFailCount: 1,
    };

    const result = calculateSettlement(rankings, seatTeamMap, teamRankState);

    expect(result.winningTeam).toBe(Team.NS);
    expect(result.upgradeResult.newRank).toBe(Rank.ACE);
    expect(result.upgradeResult.reason).toBe('A_LEVEL_SUCCESS');
  });
});
