/**
 * AI Manager for Lambda Integration
 * Manages AI players in rooms: assignment, auto-play, connection handling
 */

import {
  AIAttributes,
  AILevel,
  AIPlayerState,
  DecisionContext,
  GameState,
  PlayableCombo,
  Rank,
  SeatPosition,
  createAIPlayerState,
  generateAIAttributes,
  getThinkDelay,
  logAIDecision,
  makeAIPlay,
  updateAIStats,
} from '@guan-dan-os/shared';

/**
 * AI player record in room
 */
export interface AIPlayerRecord {
  playerId: string;
  roomId: string;
  position: SeatPosition;
  difficulty: AILevel;
  attributes: AIAttributes;
  state: AIPlayerState;
  isConnected: boolean; // Always true for AI
}

/**
 * In-memory storage for AI players
 * In production, this would be in DynamoDB
 */
const aiPlayers = new Map<string, AIPlayerRecord>();

/**
 * Create a new AI player and assign to room
 */
export function createAIPlayer(
  roomId: string,
  position: SeatPosition,
  difficulty?: AILevel
): AIPlayerRecord {
  // Use random difficulty if not specified
  const aiDifficulty =
    difficulty ||
    [AILevel.SIMPLE, AILevel.NORMAL, AILevel.HARD][
      Math.floor(Math.random() * 3)
    ];

  // Generate attributes
  const attributes = generateAIAttributes(aiDifficulty);

  // Create unique player ID
  const playerId = `ai_${roomId}_${position}_${Date.now()}`;

  // Create player state
  const state = createAIPlayerState(playerId, aiDifficulty);

  const aiPlayer: AIPlayerRecord = {
    playerId,
    roomId,
    position,
    difficulty: aiDifficulty,
    attributes,
    state,
    isConnected: true, // AI is always connected
  };

  // Store in memory
  aiPlayers.set(playerId, aiPlayer);

  return aiPlayer;
}

/**
 * Get AI player by ID
 */
export function getAIPlayer(playerId: string): AIPlayerRecord | undefined {
  return aiPlayers.get(playerId);
}

/**
 * Get all AI players in a room
 */
export function getAIPlayersInRoom(roomId: string): AIPlayerRecord[] {
  const players: AIPlayerRecord[] = [];
  for (const player of aiPlayers.values()) {
    if (player.roomId === roomId) {
      players.push(player);
    }
  }
  return players;
}

/**
 * Remove AI player
 */
export function removeAIPlayer(playerId: string): boolean {
  return aiPlayers.delete(playerId);
}

/**
 * Remove all AI players from a room
 */
export function removeAIPlayersFromRoom(roomId: string): void {
  const players = getAIPlayersInRoom(roomId);
  for (const player of players) {
    aiPlayers.delete(player.playerId);
  }
}

/**
 * Check if player is AI
 */
export function isAIPlayer(playerId: string): boolean {
  return aiPlayers.has(playerId);
}

/**
 * Execute AI turn
 * Returns the play decision or null for pass
 */
export async function executeAITurn(
  playerId: string,
  gameState: GameState,
  currentRank: Rank
): Promise<PlayableCombo | null> {
  const aiPlayer = getAIPlayer(playerId);
  if (!aiPlayer) {
    throw new Error(`AI player not found: ${playerId}`);
  }

  // Get AI's hand from game state
  const playerHand = gameState.hands[playerId];
  if (!playerHand) {
    throw new Error(`Player not found in game state: ${playerId}`);
  }

  // Build decision context
  const context: DecisionContext = {
    gameState,
    aiPlayerId: playerId,
    aiPosition: aiPlayer.position,
    hand: playerHand.cards,
    currentRank,
  };

  // Add think delay to make AI seem more natural
  const delay = getThinkDelay(aiPlayer.difficulty);
  await sleep(delay);

  // Make AI decision
  const play = await makeAIPlay(aiPlayer.difficulty, context);

  // Log decision for debugging
  logAIDecision(
    playerId,
    aiPlayer.difficulty,
    play
      ? {
          play,
          priority: 1, // Would come from decision
          score: 0,
          reason: 'AI play',
        }
      : null,
    play === null
  );

  return play;
}

/**
 * Sleep utility for think delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Handle AI timeout (when turn expires)
 * AI automatically passes
 */
export async function handleAITimeout(playerId: string): Promise<'pass'> {
  const aiPlayer = getAIPlayer(playerId);
  if (!aiPlayer) {
    throw new Error(`AI player not found: ${playerId}`);
  }

  // AI always passes on timeout
  logAIDecision(playerId, aiPlayer.difficulty, null, true);

  return 'pass';
}

/**
 * Update AI stats after game ends
 */
export function updateAIPlayerStats(
  playerId: string,
  won: boolean
): AIPlayerRecord | undefined {
  const aiPlayer = getAIPlayer(playerId);
  if (!aiPlayer) return undefined;

  // Update stats
  const newState = updateAIStats(aiPlayer.state, won);

  // Update record
  aiPlayer.state = newState;
  aiPlayers.set(playerId, aiPlayer);

  return aiPlayer;
}

/**
 * Check if room needs AI players
 * Returns number of AI players needed
 */
export function countAIPlayersNeeded(
  totalSeats: number,
  humanPlayerCount: number
): number {
  return Math.max(0, totalSeats - humanPlayerCount);
}

/**
 * Auto-fill room with AI players
 * Fills empty seats with AI of specified difficulties
 */
export function autoFillRoomWithAI(
  roomId: string,
  emptyPositions: SeatPosition[],
  difficulties?: AILevel[]
): AIPlayerRecord[] {
  const createdAI: AIPlayerRecord[] = [];

  for (let i = 0; i < emptyPositions.length; i++) {
    const position = emptyPositions[i];
    const difficulty = difficulties?.[i]; // Use provided or random

    const aiPlayer = createAIPlayer(roomId, position, difficulty);
    createdAI.push(aiPlayer);
  }

  return createdAI;
}

/**
 * Get AI connection status (always connected)
 */
export function getAIConnectionStatus(playerId: string): boolean {
  const aiPlayer = getAIPlayer(playerId);
  return aiPlayer?.isConnected ?? false;
}

/**
 * Handle AI disconnection
 * AI never disconnects, but this is here for consistency
 */
export function handleAIDisconnection(playerId: string): void {
  // AI never disconnects
  // This is a no-op but kept for API consistency
  const aiPlayer = getAIPlayer(playerId);
  if (aiPlayer) {
    aiPlayer.isConnected = true; // Always stays connected
  }
}

/**
 * Handle AI reconnection
 * AI never disconnects, so this is also a no-op
 */
export function handleAIReconnection(playerId: string): void {
  // AI never disconnects, so no reconnection needed
  const aiPlayer = getAIPlayer(playerId);
  if (aiPlayer) {
    aiPlayer.isConnected = true; // Always connected
  }
}

/**
 * Check if AI stats should be excluded from leaderboard
 * AI stats are never counted in leaderboards
 */
export function isLeaderboardEligible(playerId: string): boolean {
  // AI players are not leaderboard eligible
  return !isAIPlayer(playerId);
}

/**
 * Get AI player info for display
 */
export function getAIPlayerDisplayInfo(playerId: string): {
  nickname: string;
  level: number;
  coins: number;
  avatar: string;
  difficulty: AILevel;
  isAI: boolean;
} | null {
  const aiPlayer = getAIPlayer(playerId);
  if (!aiPlayer) return null;

  return {
    nickname: aiPlayer.attributes.nickname,
    level: aiPlayer.attributes.level,
    coins: aiPlayer.attributes.coins,
    avatar: aiPlayer.attributes.avatar,
    difficulty: aiPlayer.difficulty,
    isAI: true,
  };
}

/**
 * Export AI player data (for persistence to DynamoDB)
 */
export function exportAIPlayerData(playerId: string): AIPlayerRecord | null {
  return aiPlayers.get(playerId) || null;
}

/**
 * Import AI player data (from DynamoDB)
 */
export function importAIPlayerData(data: AIPlayerRecord): void {
  aiPlayers.set(data.playerId, data);
}

/**
 * Clear all AI players (for testing)
 */
export function clearAllAIPlayers(): void {
  aiPlayers.clear();
}
