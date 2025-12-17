'use client';

import GameCard from '@/components/game/GameCard';
import HandCards from '@/components/game/HandCards';
import PlayerPosition from '@/components/game/PlayerPosition';
import Button from '@/components/ui/Button';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/lib/hooks/useToast';
import type { Card, Player } from '@guan-dan-os/shared';
import { Rank, SeatPosition, Suit } from '@guan-dan-os/shared';
import { Menu, MessageCircle, Settings, Volume2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// Mock player data
const mockPlayers: Record<SeatPosition, Player> = {
  [SeatPosition.SOUTH]: {
    profile: {
      id: 'player-1',
      nickname: '我',
      avatar: '',
      level: 12,
      coins: 67600,
      isAI: false,
    },
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      winRate: 0,
      currentRank: '2',
      highestRank: '2',
      bombsPlayed: 0,
      firstPlaceCount: 0,
    },
    session: {
      playerId: 'player-1',
      sessionToken: 'token-1',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isConnected: true,
    },
  },
  [SeatPosition.NORTH]: {
    profile: {
      id: 'player-2',
      nickname: 'rain',
      avatar: '',
      level: 10,
      coins: 11000,
      isAI: false,
    },
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      winRate: 0,
      currentRank: '2',
      highestRank: '2',
      bombsPlayed: 0,
      firstPlaceCount: 0,
    },
    session: {
      playerId: 'player-2',
      sessionToken: 'token-2',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isConnected: true,
    },
  },
  [SeatPosition.WEST]: {
    profile: {
      id: 'player-3',
      nickname: '你最珍贵',
      avatar: '',
      level: 8,
      coins: 13400,
      isAI: false,
    },
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      winRate: 0,
      currentRank: '2',
      highestRank: '2',
      bombsPlayed: 0,
      firstPlaceCount: 0,
    },
    session: {
      playerId: 'player-3',
      sessionToken: 'token-3',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isConnected: true,
    },
  },
  [SeatPosition.EAST]: {
    profile: {
      id: 'player-4',
      nickname: 'k',
      avatar: '',
      level: 15,
      coins: 17200,
      isAI: false,
    },
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      winRate: 0,
      currentRank: '2',
      highestRank: '2',
      bombsPlayed: 0,
      firstPlaceCount: 0,
    },
    session: {
      playerId: 'player-4',
      sessionToken: 'token-4',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isConnected: true,
    },
  },
};

// Generate mock cards for player's hand
const generateMockHand = (): Card[] => {
  const cards: Card[] = [];
  const ranks = [
    Rank.TWO,
    Rank.THREE,
    Rank.FOUR,
    Rank.SIX,
    Rank.NINE,
    Rank.TEN,
    Rank.JACK,
    Rank.QUEEN,
    Rank.ACE,
  ] as const;
  const suits = [Suit.SPADES, Suit.HEARTS, Suit.CLUBS, Suit.DIAMONDS] as const;

  let id = 0;
  // Generate some pairs and triples
  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      if (Math.random() > 0.6) {
        cards.push({
          id: `card-${id++}`,
          rank,
          suit,
          isRedHeart: suit === '♥',
        });
      }
    });
  });

  return cards.slice(0, 27);
};

// Generate mock last plays
const generateMockLastPlay = (position: SeatPosition): Card[] => {
  if (position === SeatPosition.NORTH) {
    // K K K 9 9 combo
    return [
      { id: 'last-1', rank: Rank.KING, suit: Suit.HEARTS, isRedHeart: true },
      { id: 'last-2', rank: Rank.KING, suit: Suit.CLUBS },
      { id: 'last-3', rank: Rank.KING, suit: Suit.DIAMONDS },
      { id: 'last-4', rank: Rank.NINE, suit: Suit.DIAMONDS },
      { id: 'last-5', rank: Rank.NINE, suit: Suit.CLUBS },
    ];
  } else if (position === SeatPosition.WEST) {
    // Q Q Q 3 3
    return [
      { id: 'last-6', rank: Rank.QUEEN, suit: Suit.SPADES },
      { id: 'last-7', rank: Rank.QUEEN, suit: Suit.CLUBS },
      { id: 'last-8', rank: Rank.QUEEN, suit: Suit.SPADES },
      { id: 'last-9', rank: Rank.THREE, suit: Suit.HEARTS, isRedHeart: true },
      { id: 'last-10', rank: Rank.THREE, suit: Suit.SPADES },
    ];
  }
  return [];
};

export default function GamePage() {
  const params = useParams();
  const { toasts, removeToast, success, error: showError } = useToast();
  const gameId = params.id as string;

  const [myHand, setMyHand] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [currentTurn, setCurrentTurn] = useState<SeatPosition>(
    SeatPosition.EAST
  );
  const [countdown, setCountdown] = useState(24);
  const [lastPlays, setLastPlays] = useState<
    Record<SeatPosition, { cards: Card[]; passed: boolean }>
  >({
    [SeatPosition.NORTH]: { cards: [], passed: false },
    [SeatPosition.SOUTH]: { cards: [], passed: false },
    [SeatPosition.WEST]: { cards: [], passed: false },
    [SeatPosition.EAST]: { cards: [], passed: false },
  });
  const [autoPlay, setAutoPlay] = useState(false);

  // Initialize cards only on client side to avoid hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMyHand(generateMockHand());
    setLastPlays({
      [SeatPosition.NORTH]: {
        cards: generateMockLastPlay(SeatPosition.NORTH),
        passed: false,
      },
      [SeatPosition.SOUTH]: { cards: [], passed: false },
      [SeatPosition.WEST]: {
        cards: generateMockLastPlay(SeatPosition.WEST),
        passed: false,
      },
      [SeatPosition.EAST]: { cards: [], passed: false },
    });
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0 && currentTurn === SeatPosition.EAST) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, currentTurn]);

  const handlePlayCards = useCallback(() => {
    if (selectedCards.length === 0) {
      showError('请先选择要出的牌');
      return;
    }

    // Remove played cards from hand
    setMyHand((prev) =>
      prev.filter((card) => !selectedCards.some((sc) => sc.id === card.id))
    );

    // Update last play
    setLastPlays((prev) => ({
      ...prev,
      [SeatPosition.SOUTH]: { cards: selectedCards, passed: false },
    }));

    setSelectedCards([]);
    success('出牌成功');

    // Move to next turn
    setCurrentTurn(SeatPosition.WEST);
  }, [selectedCards, showError, success]);

  const handlePass = useCallback(() => {
    setLastPlays((prev) => ({
      ...prev,
      [SeatPosition.SOUTH]: { cards: [], passed: true },
    }));
    success('已选择不出');
    setCurrentTurn(SeatPosition.WEST);
  }, [success]);

  const handleSort = useCallback(() => {
    setMyHand((prev) => {
      const sorted = [...prev];
      sorted.sort((a, b) => {
        // Sort by rank first, then by suit
        const rankOrder: Record<Rank, number> = {
          '2': 2,
          '3': 3,
          '4': 4,
          '5': 5,
          '6': 6,
          '7': 7,
          '8': 8,
          '9': 9,
          '10': 10,
          J: 11,
          Q: 12,
          K: 13,
          A: 14,
          SmallJoker: 15,
          BigJoker: 16,
        };
        const rankDiff = (rankOrder[a.rank] || 0) - (rankOrder[b.rank] || 0);
        if (rankDiff !== 0) return rankDiff;

        const suitOrder: Record<Suit, number> = {
          '♠': 1,
          '♥': 2,
          '♣': 3,
          '♦': 4,
          JOKER: 5,
        };
        return (suitOrder[a.suit] || 0) - (suitOrder[b.suit] || 0);
      });
      return sorted;
    });
    success('理牌完成');
  }, [success]);

  const handleToggleAutoPlay = useCallback(() => {
    setAutoPlay((prev) => !prev);
    success(autoPlay ? '已取消托管' : '已开启托管');
  }, [autoPlay, success]);

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-600 via-teal-700 to-teal-800 relative overflow-hidden">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/20">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Menu className="text-white" size={24} />
          </button>
          <div className="text-white text-sm">
            <div className="font-semibold">房间: {gameId}</div>
            <div className="text-xs opacity-80">底注: 100 • 等级: 2</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Volume2 className="text-white" size={20} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Settings className="text-white" size={20} />
          </button>
          <button className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-semibold transition-colors">
            规则
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="relative z-10 h-[calc(100vh-60px)] flex flex-col">
        {/* Top Player */}
        <div className="flex justify-center pt-4">
          <PlayerPosition
            player={mockPlayers[SeatPosition.NORTH]}
            position="top"
            remainingCards={15}
            lastPlay={lastPlays[SeatPosition.NORTH].cards}
            isPassed={lastPlays[SeatPosition.NORTH].passed}
            isCurrentTurn={currentTurn === SeatPosition.NORTH}
          />
        </div>

        {/* Middle Section - Left, Center, Right */}
        <div className="flex-1 flex items-center justify-between px-4 py-4">
          {/* Left Player */}
          <PlayerPosition
            player={mockPlayers[SeatPosition.WEST]}
            position="left"
            remainingCards={18}
            lastPlay={lastPlays[SeatPosition.WEST].cards}
            isPassed={lastPlays[SeatPosition.WEST].passed}
            isCurrentTurn={currentTurn === SeatPosition.WEST}
          />

          {/* Center Play Area */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
            {/* Watermark */}
            <div className="text-white/10 text-6xl font-bold select-none">
              腾讯游戏
            </div>

            {/* Center Cards Display - showing table cards */}
            <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
              {/* Show some cards on the table */}
              {lastPlays[SeatPosition.SOUTH].cards.length > 0 && (
                <div className="bg-black/30 rounded-lg p-3">
                  <div className="text-white text-xs mb-2 text-center">
                    我的出牌
                  </div>
                  <div className="flex gap-1">
                    {lastPlays[SeatPosition.SOUTH].cards.map((card) => (
                      <GameCard key={card.id} card={card} size="sm" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Team Score Display */}
            <div className="flex gap-8 text-white">
              <div className="text-center">
                <div className="text-xs opacity-80">我方</div>
                <div className="text-2xl font-bold">0</div>
              </div>
              <div className="text-4xl font-bold opacity-50">VS</div>
              <div className="text-center">
                <div className="text-xs opacity-80">对方</div>
                <div className="text-2xl font-bold">0</div>
              </div>
            </div>
          </div>

          {/* Right Player */}
          <PlayerPosition
            player={mockPlayers[SeatPosition.EAST]}
            position="right"
            remainingCards={20}
            lastPlay={lastPlays[SeatPosition.EAST].cards}
            isPassed={lastPlays[SeatPosition.EAST].passed}
            isCurrentTurn={currentTurn === SeatPosition.EAST}
            countdown={countdown}
          />
        </div>

        {/* Bottom Section - Player's Hand and Controls */}
        <div className="bg-linear-to-t from-black/40 to-transparent pt-4 pb-2 px-4">
          {/* Control Buttons */}
          <div className="flex justify-center gap-3 mb-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handlePlayCards}
              disabled={
                selectedCards.length === 0 || currentTurn !== SeatPosition.SOUTH
              }
              className="px-8"
            >
              出牌
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={handlePass}
              disabled={currentTurn !== SeatPosition.SOUTH}
              className="px-8"
            >
              不出
            </Button>
            <Button
              variant={autoPlay ? 'danger' : 'ghost'}
              size="lg"
              onClick={handleToggleAutoPlay}
              className="px-6"
            >
              {autoPlay ? '取消托管' : '托管'}
            </Button>
            <button className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
              <MessageCircle className="text-white" size={24} />
            </button>
          </div>

          {/* Player's Hand */}
          <HandCards
            cards={myHand}
            selectedCards={selectedCards}
            onSelectionChange={setSelectedCards}
            onSort={handleSort}
            disabled={currentTurn !== SeatPosition.SOUTH}
          />

          {/* Bottom Player Info */}
          <div className="flex justify-between items-center mt-2 px-4">
            <div className="text-white text-xs">
              <div>玩家ID: 312167133</div>
              <div className="flex items-center gap-1">
                <span>💰</span>
                <span>
                  {(
                    mockPlayers[SeatPosition.SOUTH].profile.coins / 10000
                  ).toFixed(2)}
                  万
                </span>
              </div>
            </div>
            <div className="text-white text-xs">
              <div>当前等级: 2</div>
              <div>本局底注: 100</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
