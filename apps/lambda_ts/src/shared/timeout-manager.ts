/**
 * Turn Timeout Manager
 *
 * Handles automatic passing when players don't act within the timeout period
 */

import { GameState, Turn } from '@guan-dan-os/shared';
import { getConfig } from './config';

export interface TimeoutCheck {
  hasTimedOut: boolean;
  remainingMs: number;
  playerId?: string;
}

/**
 * Check if current turn has timed out
 */
export function checkTurnTimeout(state: GameState): TimeoutCheck {
  const { turn } = state;
  const now = Date.now();

  if (!turn || !turn.expiresAt) {
    return { hasTimedOut: false, remainingMs: 0 };
  }

  const remainingMs = turn.expiresAt - now;
  const hasTimedOut = remainingMs <= 0;

  return {
    hasTimedOut,
    remainingMs: Math.max(0, remainingMs),
    playerId: turn.playerId,
  };
}

/**
 * Create a new turn with timeout
 */
export function createTurnWithTimeout(
  playerId: string,
  position: any,
  lastPlay?: any,
  lastPlayerId?: string
): Turn {
  const now = Date.now();
  const { turnTimeout } = getConfig();

  return {
    playerId,
    position,
    startedAt: now,
    expiresAt: now + turnTimeout,
    lastPlay,
    lastPlayerId,
    consecutivePasses: 0,
  };
}

/**
 * Schedule timeout check for a turn
 * Returns the delay in milliseconds until timeout
 */
export function getTimeoutDelay(turn: Turn): number {
  const now = Date.now();
  const delay = turn.expiresAt - now;
  return Math.max(0, delay);
}

/**
 * Check if a turn is about to expire (< 10s remaining)
 */
export function isTurnExpiringSoon(turn: Turn): boolean {
  const now = Date.now();
  const remaining = turn.expiresAt - now;
  return remaining > 0 && remaining < 10000; // Less than 10 seconds
}

/**
 * Get warning threshold for turn timeout (when to show warning to player)
 */
export function getWarningThreshold(): number {
  const { turnTimeout } = getConfig();
  // Warn when 1/3 of time remains, or at 10s, whichever is sooner
  return Math.min(turnTimeout / 3, 10000);
}

/**
 * Check if turn is in warning period
 */
export function isInWarningPeriod(turn: Turn): boolean {
  const now = Date.now();
  const remaining = turn.expiresAt - now;
  const threshold = getWarningThreshold();
  return remaining > 0 && remaining <= threshold;
}

/**
 * Timeout metadata for debugging and monitoring
 */
export interface TimeoutMetadata {
  turnStartedAt: number;
  turnExpiresAt: number;
  actualTimeoutAt: number;
  delayMs: number;
  playerId: string;
}

/**
 * Create timeout metadata for logging
 */
export function createTimeoutMetadata(turn: Turn): TimeoutMetadata {
  return {
    turnStartedAt: turn.startedAt,
    turnExpiresAt: turn.expiresAt,
    actualTimeoutAt: Date.now(),
    delayMs: Date.now() - turn.expiresAt,
    playerId: turn.playerId,
  };
}
