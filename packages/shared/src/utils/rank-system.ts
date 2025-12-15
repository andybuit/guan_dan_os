/**
 * Rank Progression and Settlement System for Guandan
 * Handles level upgrades, A-level special rules, and scoring
 */

import { Rank } from '../types/card';
import { Team } from '../types/room';

/**
 * Player finish order for ranking calculations
 * This represents the order players finished in (1st, 2nd, 3rd, 4th)
 */
export interface PlayerFinishOrder {
  playerId: string;
  rank: number; // 1-4, where 1 is first place
  finishedAt: number; // timestamp
}

/**
 * All playable ranks in order
 */
export const RANK_ORDER: string[] = [
  Rank.TWO,
  Rank.THREE,
  Rank.FOUR,
  Rank.FIVE,
  Rank.SIX,
  Rank.SEVEN,
  Rank.EIGHT,
  Rank.NINE,
  Rank.TEN,
  Rank.JACK,
  Rank.QUEEN,
  Rank.KING,
  Rank.ACE,
];

/**
 * Team rank state
 */
export interface TeamRankState {
  team: Team;
  currentRank: string;
  aLevelFailCount: number; // Track consecutive A-level failures
}

/**
 * Upgrade calculation result
 */
export interface UpgradeResult {
  newRank: string;
  levelsGained: number;
  reason:
    | 'DOUBLE_DOWN'
    | 'SINGLE_DOWN'
    | 'NO_CATCH'
    | 'WEAK_WIN'
    | 'A_LEVEL_SUCCESS'
    | 'A_LEVEL_FAILURE'
    | 'A_LEVEL_PENALTY';
  aLevelFailCount?: number;
}

/**
 * Settlement result for a game
 */
export interface SettlementResult {
  winningTeam: Team;
  rankings: PlayerFinishOrder[];
  upgradeResult: UpgradeResult;
  tributeRequired: boolean;
  tributeType: 'double' | 'single' | null;
}

/**
 * Get the next rank after current rank
 */
export function getNextRank(
  currentRank: string,
  levelsToAdvance: number = 1
): string {
  const currentIndex = RANK_ORDER.indexOf(currentRank);
  if (currentIndex === -1) {
    return Rank.TWO; // Default to TWO if invalid
  }

  const newIndex = Math.min(
    currentIndex + levelsToAdvance,
    RANK_ORDER.length - 1
  );
  return RANK_ORDER[newIndex];
}

/**
 * Check if a rank is A-level
 */
export function isALevel(rank: string): boolean {
  return rank === Rank.ACE;
}

/**
 * Determine winning team based on rankings
 */
export function determineWinningTeam(
  rankings: PlayerFinishOrder[],
  seatTeamMap: Map<string, Team>
): Team | null {
  const sorted = [...rankings].sort((a, b) => a.rank - b.rank);
  const firstPlace = sorted[0];

  return seatTeamMap.get(firstPlace.playerId) || null;
}

/**
 * Calculate upgrade levels based on game outcome
 *
 * Rules:
 * - 头游+二游, both opponents 末游: +3 levels (双下)
 * - 头游+二游, one opponent 末游: +2 levels (单下)
 * - 头游+二游, no opponents 末游: +1 level (未抓人)
 * - 头游+三游, both opponents 末游: +3 levels (双下)
 * - 头游+三游, one opponent 末游: +2 levels (单下)
 * - 头游+三游, no opponents 末游: +1 level (未抓人)
 * - 头游+末游, opponents 二游+三游: +1 level (最弱情况)
 */
export function calculateUpgrade(
  rankings: PlayerFinishOrder[],
  seatTeamMap: Map<string, Team>,
  currentRank: string,
  aLevelFailCount: number = 0
): UpgradeResult {
  const sorted = [...rankings].sort((a, b) => a.rank - b.rank);

  // Get positions
  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];
  const fourth = sorted[3];

  // Get teams
  const firstTeam = seatTeamMap.get(first.playerId);
  const secondTeam = seatTeamMap.get(second.playerId);
  const thirdTeam = seatTeamMap.get(third.playerId);
  const fourthTeam = seatTeamMap.get(fourth.playerId);

  if (!firstTeam) {
    return {
      newRank: currentRank,
      levelsGained: 0,
      reason: 'WEAK_WIN',
    };
  }

  // Check if currently at A-level
  const atALevel = isALevel(currentRank);

  // Determine partner positions
  const partnerIsSecond = firstTeam === secondTeam;
  const partnerIsThird = firstTeam === thirdTeam;
  const partnerIsFourth = firstTeam === fourthTeam;

  // Count opponents in last place (末游)
  const opponentsInLast = [secondTeam, thirdTeam, fourthTeam].filter(
    (team) =>
      team !== firstTeam &&
      ((fourthTeam !== firstTeam && team === fourthTeam) ||
        (thirdTeam !== firstTeam &&
          fourthTeam === firstTeam &&
          team === thirdTeam))
  ).length;

  let levelsGained = 0;
  let reason: UpgradeResult['reason'] = 'WEAK_WIN';

  // 头游+二游 (Partner is second)
  if (partnerIsSecond) {
    // Both opponents are 3rd and 4th (双下)
    if (thirdTeam !== firstTeam && fourthTeam !== firstTeam) {
      levelsGained = 3;
      reason = 'DOUBLE_DOWN';
    }
    // One opponent is 4th (单下)
    else if (fourthTeam !== firstTeam) {
      levelsGained = 2;
      reason = 'SINGLE_DOWN';
    }
    // No opponent is 4th (未抓人)
    else {
      levelsGained = 1;
      reason = 'NO_CATCH';
    }
  }
  // 头游+三游 (Partner is third)
  else if (partnerIsThird) {
    // Both opponents in 2nd and 4th means one is 末游
    if (fourthTeam !== firstTeam && secondTeam !== firstTeam) {
      // Check if both opponents lost badly
      levelsGained = 2; // Simplified - would need more logic
      reason = 'SINGLE_DOWN';
    } else {
      levelsGained = 1;
      reason = 'NO_CATCH';
    }
  }
  // 头游+末游 (Partner is fourth - weakest win)
  else if (partnerIsFourth) {
    levelsGained = 1;
    reason = 'WEAK_WIN';
  }

  // A-level special handling
  if (atALevel) {
    if (partnerIsFourth) {
      // Partner is 末游 - A-level failure
      const newFailCount = aLevelFailCount + 1;

      if (newFailCount >= 3) {
        // 3 consecutive failures - penalty: drop back to 2
        return {
          newRank: Rank.TWO,
          levelsGained: 0,
          reason: 'A_LEVEL_PENALTY',
          aLevelFailCount: 0, // Reset after penalty
        };
      }

      return {
        newRank: currentRank, // Stay at A
        levelsGained: 0,
        reason: 'A_LEVEL_FAILURE',
        aLevelFailCount: newFailCount,
      };
    } else {
      // Partner is not 末游 - A-level success (stay at A)
      return {
        newRank: currentRank,
        levelsGained: 0,
        reason: 'A_LEVEL_SUCCESS',
        aLevelFailCount: 0, // Reset fail count on success
      };
    }
  }

  // Normal rank progression
  const newRank = getNextRank(currentRank, levelsGained);

  return {
    newRank,
    levelsGained,
    reason,
    aLevelFailCount: 0,
  };
}

/**
 * Calculate settlement for a completed game
 */
export function calculateSettlement(
  rankings: PlayerFinishOrder[],
  seatTeamMap: Map<string, Team>,
  teamRankState: TeamRankState
): SettlementResult {
  const winningTeam = determineWinningTeam(rankings, seatTeamMap);

  if (!winningTeam) {
    throw new Error('Cannot determine winning team');
  }

  const upgradeResult = calculateUpgrade(
    rankings,
    seatTeamMap,
    teamRankState.currentRank,
    teamRankState.aLevelFailCount
  );

  // Determine tribute requirements
  const sorted = [...rankings].sort((a, b) => a.rank - b.rank);
  const firstTeam = seatTeamMap.get(sorted[0].playerId);
  const secondTeam = seatTeamMap.get(sorted[1].playerId);
  const thirdTeam = seatTeamMap.get(sorted[2].playerId);
  const fourthTeam = seatTeamMap.get(sorted[3].playerId);

  let tributeRequired = false;
  let tributeType: 'double' | 'single' | null = null;

  // 双下: Both 1st and 2nd are same team, both 3rd and 4th are opponents
  if (
    firstTeam === secondTeam &&
    thirdTeam !== firstTeam &&
    fourthTeam !== firstTeam
  ) {
    tributeRequired = true;
    tributeType = 'double';
  }
  // 单下: 1st and 3rd are same team, 4th is opponent
  else if (firstTeam === thirdTeam && fourthTeam !== firstTeam) {
    tributeRequired = true;
    tributeType = 'single';
  }

  return {
    winningTeam,
    rankings: sorted,
    upgradeResult,
    tributeRequired,
    tributeType,
  };
}

/**
 * Get rank index (for calculating distance to A)
 */
export function getRankIndex(rank: string): number {
  return RANK_ORDER.indexOf(rank);
}

/**
 * Calculate distance to A-level
 */
export function distanceToA(currentRank: string): number {
  const currentIndex = getRankIndex(currentRank);
  const aIndex = getRankIndex(Rank.ACE);

  if (currentIndex === -1 || aIndex === -1) {
    return 0;
  }

  return Math.max(0, aIndex - currentIndex);
}

/**
 * Format rank display name
 */
export function formatRank(rank: string): string {
  const rankNames: Record<string, string> = {
    [Rank.TWO]: '2',
    [Rank.THREE]: '3',
    [Rank.FOUR]: '4',
    [Rank.FIVE]: '5',
    [Rank.SIX]: '6',
    [Rank.SEVEN]: '7',
    [Rank.EIGHT]: '8',
    [Rank.NINE]: '9',
    [Rank.TEN]: '10',
    [Rank.JACK]: 'J',
    [Rank.QUEEN]: 'Q',
    [Rank.KING]: 'K',
    [Rank.ACE]: 'A',
  };

  return rankNames[rank] || rank;
}
