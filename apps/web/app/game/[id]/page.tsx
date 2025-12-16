'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Countdown from '@/components/ui/Countdown';
import PlayerAvatar from '@/components/ui/PlayerAvatar';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/lib/hooks/useToast';
import type {
  Card as CardType,
  Player,
  SeatPosition,
} from '@guan-dan-os/shared';
import { Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Mock data
const mockPlayer: Player = {
  id: 'player-1',
  nickname: '玩家001',
  avatar: '',
  level: 12,
  coins: 125000,
  isAI: false,
  isReady: true,
  isConnected: true,
  roomId: 'room-1',
  seatPosition: 'SOUTH',
};

const mockPlayers: Record<string, Player> = {
  'player-1': mockPlayer,
  'player-2': {
    id: 'player-2',
    nickname: '玩家002',
    avatar: '',
    level: 11,
    coins: 95000,
    isAI: false,
    isReady: true,
    isConnected: true,
    roomId: 'room-1',
    seatPosition: 'NORTH',
  },
  'ai-1': {
    id: 'ai-1',
    nickname: 'AI玩家001',
    avatar: '',
    level: 10,
    coins: 80000,
    isAI: true,
    isReady: true,
    isConnected: true,
    roomId: 'room-1',
    seatPosition: 'EAST',
  },
  'ai-2': {
    id: 'ai-2',
    nickname: 'AI玩家002',
    avatar: '',
    level: 9,
    coins: 70000,
    isAI: true,
    isReady: true,
    isConnected: true,
    roomId: 'room-1',
    seatPosition: 'WEST',
  },
};

// Generate mock hand
const generateMockHand = (): CardType[] => {
  const suits: Array<'hearts' | 'diamonds' | 'clubs' | 'spades'> = [
    'hearts',
    'diamonds',
    'clubs',
    'spades',
  ];
  const hand: CardType[] = [];

  for (let i = 0; i < 27; i++) {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const rank = Math.floor(Math.random() * 13) + 1;
    hand.push({
      rank,
      suit,
      isWindfall: rank === 2, // Mock: 2s are windfall
    });
  }

  // Sort by rank
  hand.sort((a, b) => a.rank - b.rank);
  return hand;
};

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const { toasts, removeToast, error: showError } = useToast();
  const roomId = params.id as string;

  const [hand, setHand] = useState<CardType[]>([]);
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());

  // Initialize hand on client-side only to avoid hydration mismatch
  useEffect(() => {
    setHand(generateMockHand());
  }, []);
  const [currentTurn, setCurrentTurn] = useState<SeatPosition>('SOUTH');
  const [turnTimeLeft, setTurnTimeLeft] = useState(30);
  const [lastPlay, setLastPlay] = useState<{
    cards: CardType[];
    player: string;
  } | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [gameState, setGameState] = useState<{
    round: number;
    currentRank: number;
    cardsLeft: Record<SeatPosition, number>;
  }>({
    round: 1,
    currentRank: 2,
    cardsLeft: {
      SOUTH: 27,
      NORTH: 27,
      EAST: 27,
      WEST: 27,
    },
  });

  const isMyTurn = currentTurn === mockPlayer.seatPosition;

  const handleCardClick = (index: number) => {
    if (!isMyTurn) return;

    setSelectedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handlePlay = () => {
    if (selectedCards.size === 0) {
      showError('请选择要出的牌');
      return;
    }

    const playedCards = Array.from(selectedCards).map((i) => hand[i]);

    // Remove played cards from hand
    const newHand = hand.filter((_, i) => !selectedCards.has(i));
    setHand(newHand);
    setSelectedCards(new Set());

    setLastPlay({ cards: playedCards, player: mockPlayer.nickname });

    // Update cards left
    setGameState((prev) => ({
      ...prev,
      cardsLeft: {
        ...prev.cardsLeft,
        SOUTH: newHand.length,
      },
    }));

    // Move to next turn
    nextTurn();
  };

  const handlePass = () => {
    setLastPlay({ cards: [], player: mockPlayer.nickname });
    setSelectedCards(new Set());
    nextTurn();
  };

  const nextTurn = () => {
    const order: SeatPosition[] = ['SOUTH', 'WEST', 'NORTH', 'EAST'];
    const currentIndex = order.indexOf(currentTurn);
    const nextPosition = order[(currentIndex + 1) % 4];
    setCurrentTurn(nextPosition);
    setTurnTimeLeft(30);

    // Simulate AI thinking
    if (mockPlayers[getPlayerAtSeat(nextPosition)]?.isAI) {
      setAiThinking(true);
      setTimeout(() => {
        setAiThinking(false);
        // Simulate AI play or pass
        const shouldPlay = Math.random() > 0.3;
        if (shouldPlay) {
          // Auto-play for AI
          nextTurn();
        } else {
          nextTurn();
        }
      }, 2000);
    }
  };

  const getPlayerAtSeat = (position: SeatPosition): string => {
    return (
      Object.values(mockPlayers).find((p) => p.seatPosition === position)?.id ||
      ''
    );
  };

  const renderPlayerArea = (position: SeatPosition, className: string) => {
    const player = Object.values(mockPlayers).find(
      (p) => p.seatPosition === position
    );
    if (!player) return null;

    const isCurrentTurn = currentTurn === position;
    const cardsLeft = gameState.cardsLeft[position];

    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <div className="relative">
          <PlayerAvatar player={player} size="md" showInfo={false} />
          {isCurrentTurn && (
            <div className="absolute -top-2 -right-2">
              <Countdown seconds={turnTimeLeft} size="sm" />
            </div>
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {player.nickname}
          </p>
          <p className="text-xs text-gray-500">剩余: {cardsLeft}张</p>
        </div>
        {player.isAI && isCurrentTurn && aiThinking && (
          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 text-sm">
            <Loader2 size={14} className="animate-spin" />
            <span>思考中...</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Game Board */}
      <div className="h-screen flex flex-col p-4">
        {/* Top Area - North Player */}
        <div className="flex justify-center py-4">
          {renderPlayerArea('NORTH', '')}
        </div>

        {/* Middle Area - West, Center, East */}
        <div className="flex-1 flex items-center justify-between px-8">
          {/* West Player */}
          <div className="w-32">{renderPlayerArea('WEST', '')}</div>

          {/* Center Play Area */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-lg p-6 min-h-[200px]">
              {/* Game Info */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    回合:{' '}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {gameState.round}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    当前等级:{' '}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {gameState.currentRank}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    轮到:{' '}
                  </span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {mockPlayers[getPlayerAtSeat(currentTurn)]?.nickname}
                  </span>
                </div>
              </div>

              {/* Last Play */}
              {lastPlay && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {lastPlay.player}{' '}
                    {lastPlay.cards.length === 0 ? '过牌' : '出牌'}:
                  </p>
                  {lastPlay.cards.length > 0 && (
                    <div className="flex justify-center gap-2 flex-wrap">
                      {lastPlay.cards.map((card, i) => (
                        <Card key={i} card={card} size="sm" />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!lastPlay && (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  等待第一手牌...
                </div>
              )}
            </div>
          </div>

          {/* East Player */}
          <div className="w-32">{renderPlayerArea('EAST', '')}</div>
        </div>

        {/* Bottom Area - South Player (You) */}
        <div className="py-4">
          {/* Hand Cards */}
          <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg p-4 mb-4">
            <div className="flex justify-center gap-1 flex-wrap">
              {hand.map((card, index) => (
                <Card
                  key={index}
                  card={card}
                  size="md"
                  selected={selectedCards.has(index)}
                  onClick={() => handleCardClick(index)}
                />
              ))}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            {renderPlayerArea('SOUTH', '')}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={handlePass}
                disabled={!isMyTurn || aiThinking}
                className="min-w-[120px]"
              >
                不出
              </Button>
              <Button
                size="lg"
                onClick={handlePlay}
                disabled={!isMyTurn || selectedCards.size === 0 || aiThinking}
                className="min-w-[120px]"
              >
                出牌 {selectedCards.size > 0 && `(${selectedCards.size})`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
