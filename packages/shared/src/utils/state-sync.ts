/**
 * State synchronization utilities
 * Handles state snapshots, diffs, and player-specific filtering
 */

import type { Card } from '../types/card';
import type {
  FullStateSyncPayload,
  StateUpdatePayload,
  WSEvent,
} from '../types/events';
import { createWSEvent, WSEventType } from '../types/events';
import type { GameState } from '../types/game';
import type { Room, SeatPosition } from '../types/room';

/**
 * State version tracking
 */
export interface StateVersion {
  /** Current version number */
  version: number;

  /** Last update timestamp */
  updatedAt: number;

  /** Checksum for validation (optional) */
  checksum?: string;
}

/**
 * Create initial state version
 */
export function createStateVersion(): StateVersion {
  return {
    version: 1,
    updatedAt: Date.now(),
  };
}

/**
 * Increment state version
 */
export function incrementStateVersion(current: StateVersion): StateVersion {
  return {
    version: current.version + 1,
    updatedAt: Date.now(),
  };
}

/**
 * Check if state version is stale
 */
export function isStateVersionStale(
  clientVersion: number,
  serverVersion: number
): boolean {
  return clientVersion < serverVersion;
}

/**
 * Player-specific game state (hides opponent hands)
 */
export interface PlayerGameState extends Omit<GameState, 'hands'> {
  /** Player's own hand */
  playerHand: Card[];

  /** Other players' card counts */
  otherPlayerCounts: Record<SeatPosition, number>;
}

/**
 * Create player-specific state snapshot
 */
export function createPlayerStateSnapshot(
  gameState: GameState,
  playerId: string
): PlayerGameState {
  // Find player's hand by playerId
  const playerHand = gameState.hands[playerId];

  if (!playerHand) {
    throw new Error(`Player ${playerId} not found in game state`);
  }

  // Calculate other players' card counts
  const otherPlayerCounts: Record<SeatPosition, number> = {} as any;
  for (const [pid, hand] of Object.entries(gameState.hands)) {
    if (pid !== playerId && hand) {
      // We need to map playerId to position - for now use a simple counter
      // In real implementation, we'd look this up from room seats
      const cardCount = Array.isArray(hand.cards) ? hand.cards.length : 0;
      // Note: This is a simplified version - proper implementation needs seat mapping
    }
  }

  // Remove hands from game state
  const { hands, ...stateWithoutHands } = gameState;

  // Convert PlayerHand to Card[]
  const cards = Array.isArray(playerHand.cards) ? playerHand.cards : [];

  return {
    ...stateWithoutHands,
    playerHand: cards,
    otherPlayerCounts,
  };
}

/**
 * Create full state sync event for player
 */
export function createFullStateSyncEvent(
  gameState: GameState,
  playerId: string,
  roomId: string
): WSEvent<FullStateSyncPayload> {
  const playerState = createPlayerStateSnapshot(gameState, playerId);

  return createWSEvent(
    WSEventType.FULL_STATE_SYNC,
    {
      gameState: { ...gameState, hands: {} }, // Send game state without hands
      playerHand: playerState.playerHand,
      otherPlayerCounts: playerState.otherPlayerCounts,
    },
    roomId
  );
}

/**
 * Calculate state diff between two game states
 */
export function calculateStateDiff(
  oldState: GameState,
  newState: GameState
): Partial<GameState> {
  const diff: Partial<GameState> = {};

  // Check phase
  if (oldState.phase !== newState.phase) {
    diff.phase = newState.phase;
  }

  // Check round number
  if (oldState.roundNumber !== newState.roundNumber) {
    diff.roundNumber = newState.roundNumber;
  }

  // Check current rank
  if (oldState.currentRank !== newState.currentRank) {
    diff.currentRank = newState.currentRank;
  }

  // Check turn (deep comparison)
  if (JSON.stringify(oldState.turn) !== JSON.stringify(newState.turn)) {
    diff.turn = newState.turn;
  }

  // Check play history (only if changed)
  if (oldState.playHistory.length !== newState.playHistory.length) {
    diff.playHistory = newState.playHistory;
  }

  // Check version
  if (oldState.version !== newState.version) {
    diff.version = newState.version;
  }

  return diff;
}

/**
 * Create state update event
 */
export function createStateUpdateEvent(
  changes: Partial<GameState>,
  version: number,
  roomId: string
): WSEvent<StateUpdatePayload> {
  return createWSEvent(
    WSEventType.STATE_UPDATE,
    {
      changes,
      version,
    },
    roomId
  );
}

/**
 * Apply state diff to game state
 */
export function applyStateDiff(
  state: GameState,
  diff: Partial<GameState>
): GameState {
  return {
    ...state,
    ...diff,
  };
}

/**
 * Validate state integrity
 */
export interface StateValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate game state integrity
 */
export function validateGameState(state: GameState): StateValidationResult {
  const errors: string[] = [];

  // Check hands exist
  const playerIds = Object.keys(state.hands);
  if (playerIds.length === 0) {
    errors.push('No player hands found');
  }

  // Check each hand
  for (const [playerId, hand] of Object.entries(state.hands)) {
    if (!hand) {
      errors.push(`Missing hand for player ${playerId}`);
    }
    if (hand && !hand.cards) {
      errors.push(`Hand for player ${playerId} has no cards array`);
    }
  }

  // Check turn info
  if (!state.turn) {
    errors.push('Missing turn information');
  } else {
    if (!state.turn.playerId) {
      errors.push('Turn missing playerId');
    }
    if (!state.turn.position) {
      errors.push('Turn missing position');
    }
  }

  // Check phase
  if (!state.phase) {
    errors.push('Missing game phase');
  }

  // Check round number
  if (typeof state.roundNumber !== 'number' || state.roundNumber < 1) {
    errors.push('Invalid round number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * State snapshot for persistence
 */
export interface StateSnapshot {
  gameState: GameState;
  room: Room;
  version: StateVersion;
  timestamp: number;
}

/**
 * Create state snapshot
 */
export function createStateSnapshot(
  gameState: GameState,
  room: Room,
  version: StateVersion
): StateSnapshot {
  return {
    gameState,
    room,
    version,
    timestamp: Date.now(),
  };
}

/**
 * Serialize state snapshot for storage
 */
export function serializeStateSnapshot(snapshot: StateSnapshot): string {
  return JSON.stringify(snapshot);
}

/**
 * Deserialize state snapshot from storage
 */
export function deserializeStateSnapshot(data: string): StateSnapshot {
  return JSON.parse(data);
}

/**
 * Calculate state size (for monitoring)
 */
export function calculateStateSize(state: GameState): number {
  return Buffer.byteLength(JSON.stringify(state), 'utf8');
}

/**
 * Optimize state for transmission (remove unnecessary data)
 */
export function optimizeStateForTransmission(
  state: GameState
): Partial<GameState> {
  // Remove large arrays if not needed
  const optimized: Partial<GameState> = { ...state };

  // Keep only recent play history (last 10 plays)
  if (optimized.playHistory && optimized.playHistory.length > 10) {
    optimized.playHistory = optimized.playHistory.slice(-10);
  }

  return optimized;
}

/**
 * State reconciliation result
 */
export interface ReconciliationResult {
  reconciled: GameState;
  conflicts: string[];
  resolved: boolean;
}

/**
 * Reconcile client and server state (for conflict resolution)
 */
export function reconcileState(
  clientState: GameState,
  serverState: GameState
): ReconciliationResult {
  const conflicts: string[] = [];

  // Server state always wins for critical fields
  const reconciled: GameState = {
    ...serverState,
  };

  // Check for conflicts
  if (JSON.stringify(clientState.turn) !== JSON.stringify(serverState.turn)) {
    conflicts.push('Turn information mismatch');
  }

  if (clientState.roundNumber !== serverState.roundNumber) {
    conflicts.push('Round number mismatch');
  }

  if (clientState.phase !== serverState.phase) {
    conflicts.push('Game phase mismatch');
  }

  // Play history: server wins
  if (
    JSON.stringify(clientState.playHistory) !==
    JSON.stringify(serverState.playHistory)
  ) {
    conflicts.push('Play history mismatch');
  }

  return {
    reconciled,
    conflicts,
    resolved: true, // Always resolved by taking server state
  };
}

/**
 * State synchronization metrics
 */
export interface SyncMetrics {
  totalSyncs: number;
  fullSyncs: number;
  diffSyncs: number;
  avgSyncSizeBytes: number;
  avgSyncLatencyMs: number;
  lastSyncAt: number;
}

/**
 * Create sync metrics tracker
 */
export function createSyncMetrics(): SyncMetrics {
  return {
    totalSyncs: 0,
    fullSyncs: 0,
    diffSyncs: 0,
    avgSyncSizeBytes: 0,
    avgSyncLatencyMs: 0,
    lastSyncAt: Date.now(),
  };
}

/**
 * Update sync metrics
 */
export function updateSyncMetrics(
  metrics: SyncMetrics,
  isFullSync: boolean,
  sizeBytes: number,
  latencyMs: number
): SyncMetrics {
  const alpha = 0.3; // Exponential moving average factor

  return {
    totalSyncs: metrics.totalSyncs + 1,
    fullSyncs: metrics.fullSyncs + (isFullSync ? 1 : 0),
    diffSyncs: metrics.diffSyncs + (isFullSync ? 0 : 1),
    avgSyncSizeBytes:
      alpha * sizeBytes + (1 - alpha) * metrics.avgSyncSizeBytes,
    avgSyncLatencyMs:
      alpha * latencyMs + (1 - alpha) * metrics.avgSyncLatencyMs,
    lastSyncAt: Date.now(),
  };
}
