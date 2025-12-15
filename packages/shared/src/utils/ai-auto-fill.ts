/**
 * AI auto-fill system
 * Manages automatic AI player assignment when seats remain empty
 */

import type { Player } from '../types/player';
import type { Room } from '../types/room';
import { generateAIPlayer } from './ai-attributes';
import {
  clearAutoFillTimer,
  hasAutoFillTimerExpired,
  setAutoFillTimer,
  shouldStartAutoFillTimer,
} from './join-flow';
import { assignPlayerToSeat, getEmptySeats, isRoomFull } from './room-manager';
import { findPreferredAISeat } from './seat-manager';

/**
 * Check if room needs AI auto-fill
 */
export function needsAutoFill(room: Room): boolean {
  // Auto-fill is disabled
  if (!room.config.allowAIAutoFill) {
    return false;
  }

  // Not in waiting state
  if (room.state !== 'WAITING') {
    return false;
  }

  // Room is full
  if (isRoomFull(room)) {
    return false;
  }

  // Timer hasn't been set
  if (!room.autoFillTimerExpiry) {
    return false;
  }

  // Check if timer has expired
  return hasAutoFillTimerExpired(room);
}

/**
 * Add AI player to fill empty seat
 */
export function addAIPlayerToRoom(
  room: Room,
  difficulty: 'simple' | 'normal' | 'hard' = 'normal'
): { room: Room; aiPlayer: Player | null; success: boolean; error?: string } {
  // Find preferred seat for AI
  const position = findPreferredAISeat(room);

  if (!position) {
    return {
      room,
      aiPlayer: null,
      success: false,
      error: 'No available seats for AI',
    };
  }

  // Generate AI player
  const aiPlayer = generateAIPlayer(difficulty);

  // Assign AI to seat
  try {
    const updatedRoom = assignPlayerToSeat(room, position, aiPlayer);

    // Clear auto-fill timer since we just added an AI
    const roomWithoutTimer = clearAutoFillTimer(updatedRoom);

    // If still not full, restart the timer
    const finalRoom = shouldStartAutoFillTimer(roomWithoutTimer)
      ? setAutoFillTimer(roomWithoutTimer)
      : roomWithoutTimer;

    return {
      room: finalRoom,
      aiPlayer,
      success: true,
    };
  } catch (error) {
    return {
      room,
      aiPlayer: null,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add AI player',
    };
  }
}

/**
 * Fill all empty seats with AI players
 */
export function fillAllSeatsWithAI(
  room: Room,
  difficulty: 'simple' | 'normal' | 'hard' = 'normal'
): { room: Room; addedAI: Player[]; success: boolean; error?: string } {
  let currentRoom = room;
  const addedAI: Player[] = [];

  const emptySeats = getEmptySeats(currentRoom);

  for (const seat of emptySeats) {
    const result = addAIPlayerToRoom(currentRoom, difficulty);

    if (!result.success) {
      return {
        room: currentRoom,
        addedAI,
        success: false,
        error: result.error,
      };
    }

    currentRoom = result.room;
    if (result.aiPlayer) {
      addedAI.push(result.aiPlayer);
    }
  }

  return {
    room: currentRoom,
    addedAI,
    success: true,
  };
}

/**
 * Process auto-fill check for a room
 * Returns updated room with AI added if timer expired
 */
export function processAutoFillCheck(
  room: Room,
  difficulty: 'simple' | 'normal' | 'hard' = 'normal'
): {
  room: Room;
  aiAdded: boolean;
  aiPlayer?: Player;
  position?: string;
} {
  if (!needsAutoFill(room)) {
    return {
      room,
      aiAdded: false,
    };
  }

  const result = addAIPlayerToRoom(room, difficulty);

  if (!result.success) {
    return {
      room,
      aiAdded: false,
    };
  }

  // Find position of added AI
  let addedPosition = '';
  if (result.aiPlayer) {
    for (const [pos, seat] of Object.entries(result.room.seats)) {
      if (seat.player?.profile.id === result.aiPlayer.profile.id) {
        addedPosition = pos;
        break;
      }
    }
  }

  return {
    room: result.room,
    aiAdded: true,
    aiPlayer: result.aiPlayer ?? undefined,
    position: addedPosition,
  };
}

/**
 * Handle player join with auto-fill timer management
 * Resets timer when player joins
 */
export function handlePlayerJoinWithTimer(room: Room): Room {
  // Clear any existing timer
  let updatedRoom = clearAutoFillTimer(room);

  // If room still has empty seats and auto-fill is enabled, start new timer
  if (shouldStartAutoFillTimer(updatedRoom)) {
    updatedRoom = setAutoFillTimer(updatedRoom);
  }

  return updatedRoom;
}

/**
 * Get auto-fill status for display
 */
export function getAutoFillStatus(room: Room): {
  enabled: boolean;
  timerActive: boolean;
  timeRemaining?: number;
  willExpireAt?: number;
} {
  const enabled = room.config.allowAIAutoFill;
  const timerActive =
    !!room.autoFillTimerExpiry && room.autoFillTimerExpiry > Date.now();

  if (!timerActive || !room.autoFillTimerExpiry) {
    return {
      enabled,
      timerActive: false,
    };
  }

  const timeRemaining = Math.max(0, room.autoFillTimerExpiry - Date.now());

  return {
    enabled,
    timerActive: true,
    timeRemaining,
    willExpireAt: room.autoFillTimerExpiry,
  };
}

/**
 * Get AI difficulty based on room level (for balanced games)
 */
export function getRecommendedAIDifficulty(
  room: Room
): 'simple' | 'normal' | 'hard' {
  // Get average level of human players in room
  const humanPlayers = Object.values(room.seats)
    .filter((seat) => seat.player && !seat.player.profile.isAI)
    .map((seat) => seat.player!);

  if (humanPlayers.length === 0) {
    return 'normal'; // Default
  }

  const avgLevel =
    humanPlayers.reduce((sum, p) => sum + p.profile.level, 0) /
    humanPlayers.length;

  // Simple: levels 1-8
  // Normal: levels 9-15
  // Hard: levels 16+
  if (avgLevel < 9) return 'simple';
  if (avgLevel < 16) return 'normal';
  return 'hard';
}

/**
 * Create auto-fill configuration
 */
export function createAutoFillConfig(
  enabled: boolean = true,
  timeoutMs: number = 10000
): {
  allowAIAutoFill: boolean;
  autoFillTimeoutMs: number;
} {
  return {
    allowAIAutoFill: enabled,
    autoFillTimeoutMs: Math.max(1000, timeoutMs), // Min 1 second
  };
}

/**
 * Validate auto-fill settings
 */
export function validateAutoFillSettings(settings: {
  allowAIAutoFill?: boolean;
  autoFillTimeoutMs?: number;
}): { valid: boolean; error?: string } {
  if (settings.autoFillTimeoutMs !== undefined) {
    if (settings.autoFillTimeoutMs < 1000) {
      return {
        valid: false,
        error: 'Auto-fill timeout must be at least 1000ms (1 second)',
      };
    }
    if (settings.autoFillTimeoutMs > 300000) {
      return {
        valid: false,
        error: 'Auto-fill timeout cannot exceed 300000ms (5 minutes)',
      };
    }
  }

  return { valid: true };
}
