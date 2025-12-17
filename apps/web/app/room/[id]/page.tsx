'use client';

import Button from '@/components/ui/Button';
import Countdown from '@/components/ui/Countdown';
import PlayerAvatar from '@/components/ui/PlayerAvatar';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/lib/hooks/useToast';
import type { Player, Room } from '@guan-dan-os/shared';
import { RoomState, SeatPosition, Team } from '@guan-dan-os/shared';
import { Copy, Crown, LogOut } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Mock data
const mockPlayer: Player = {
  profile: {
    id: 'player-1',
    nickname: '玩家001',
    avatar: '',
    level: 12,
    coins: 125000,
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
};

const mockSeatPosition = SeatPosition.SOUTH;

const mockPlayers: Record<string, Player> = {
  'player-1': mockPlayer,
  'ai-1': {
    profile: {
      id: 'ai-1',
      nickname: 'AI玩家001',
      avatar: '',
      level: 10,
      coins: 80000,
      isAI: true,
      aiDifficulty: 'Normal',
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
      playerId: 'ai-1',
      sessionToken: 'token-ai-1',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isConnected: true,
    },
  },
};

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const { toasts, removeToast, success, error: showError } = useToast();
  const roomId = params.id as string;

  const [room, setRoom] = useState<Room>({
    id: roomId,
    roomCode: 'ABC123',
    hostId: 'player-1',
    state: RoomState.WAITING,
    seats: {
      [SeatPosition.SOUTH]: {
        position: SeatPosition.SOUTH,
        player: mockPlayer,
        isReady: false,
        isHost: true,
        team: Team.NS,
      },
      [SeatPosition.NORTH]: {
        position: SeatPosition.NORTH,
        player: mockPlayers['ai-1'],
        isReady: true,
        isHost: false,
        team: Team.NS,
      },
      [SeatPosition.EAST]: {
        position: SeatPosition.EAST,
        player: null,
        isReady: false,
        isHost: false,
        team: Team.EW,
      },
      [SeatPosition.WEST]: {
        position: SeatPosition.WEST,
        player: null,
        isReady: false,
        isHost: false,
        team: Team.EW,
      },
    },
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    config: {
      bet: 100,
      startingRank: '2',
      allowAIAutoFill: true,
      autoFillTimeoutMs: 10000,
      turnTimeoutMs: 30000,
      isPrivate: false,
    },
  });

  const [aiCountdown] = useState<Record<SeatPosition, number>>({
    [SeatPosition.NORTH]: 0,
    [SeatPosition.SOUTH]: 0,
    [SeatPosition.EAST]: 10,
    [SeatPosition.WEST]: 10,
  });

  const [startCountdown, setStartCountdown] = useState(0);

  const isHost = room.hostId === mockPlayer.profile.id;
  const allSeatsReady = Object.values(room.seats).every(
    (seat) => seat.player === null || seat.isReady
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    success('房间代码已复制！');
  };

  const handleToggleReady = () => {
    const currentSeat = room.seats[mockSeatPosition];
    if (currentSeat) {
      setRoom((prev) => ({
        ...prev,
        seats: {
          ...prev.seats,
          [mockSeatPosition]: {
            ...currentSeat,
            isReady: !currentSeat.isReady,
          },
        },
      }));
    }
  };

  const handleStartGame = () => {
    if (!allSeatsReady) {
      showError('还有玩家未准备！');
      return;
    }
    setStartCountdown(10);
  };

  const handleLeaveRoom = () => {
    router.push('/lobby');
  };

  useEffect(() => {
    if (startCountdown > 0) {
      const timer = setInterval(() => {
        setStartCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [startCountdown]);

  useEffect(() => {
    if (startCountdown === 0 && startCountdown !== null) {
      router.push(`/game/${roomId}`);
    }
  }, [startCountdown, roomId, router]);

  const getSeatPlayer = (position: SeatPosition): Player | null => {
    const seat = room.seats[position];
    return seat?.player || null;
  };

  const renderSeat = (position: SeatPosition, label: string) => {
    const player = getSeatPlayer(position);
    const isCurrentPlayer = player?.profile.id === mockPlayer.profile.id;
    const countdown = aiCountdown[position];
    const seat = room.seats[position];

    return (
      <div className="relative">
        {/* Seat Card */}
        <div
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 min-h-[200px] flex flex-col items-center justify-center border-2 transition-colors ${
            player
              ? 'border-blue-300 dark:border-blue-700'
              : 'border-gray-200 dark:border-gray-700 border-dashed'
          }`}
        >
          {/* Position Label */}
          <div className="absolute top-2 left-2 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-semibold text-gray-600 dark:text-gray-400">
            {label}
          </div>

          {/* Host Crown */}
          {player && room.hostId === player.profile.id && (
            <div className="absolute top-2 right-2">
              <Crown size={20} className="text-yellow-500" />
            </div>
          )}

          {player ? (
            <>
              <PlayerAvatar player={player} size="lg" showInfo={true} />
              {seat.isReady && !isCurrentPlayer && (
                <div className="mt-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-semibold">
                  已准备
                </div>
              )}
              {isCurrentPlayer && (
                <Button
                  variant={seat.isReady ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={handleToggleReady}
                  className="mt-3"
                >
                  {seat.isReady ? '取消准备' : '准备'}
                </Button>
              )}
            </>
          ) : (
            <>
              <PlayerAvatar player={null} size="lg" showInfo={false} />
              {countdown > 0 && (
                <div className="mt-3">
                  <Countdown
                    seconds={countdown}
                    size="sm"
                    onComplete={() => {
                      // Simulate AI join
                      console.log('AI auto-fill for', position);
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                    AI自动填充
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                房间: {room.roomCode}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                底注: {room.config.bet} • 起始等级: {room.config.startingRank}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="flex items-center gap-2"
              >
                <Copy size={16} />
                复制代码
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleLeaveRoom}
                className="flex items-center gap-2"
              >
                <LogOut size={16} />
                离开房间
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* 4-Seat Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Top Row */}
          <div className="md:col-span-2 max-w-md mx-auto w-full">
            {renderSeat(SeatPosition.NORTH, '北 (队友)')}
          </div>

          {/* Middle Row */}
          <div>{renderSeat(SeatPosition.WEST, '西 (对手)')}</div>
          <div>{renderSeat(SeatPosition.EAST, '东 (对手)')}</div>

          {/* Bottom Row */}
          <div className="md:col-span-2 max-w-md mx-auto w-full">
            {renderSeat(SeatPosition.SOUTH, '南 (你)')}
          </div>
        </div>

        {/* Start Game Section */}
        {isHost && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto">
            {startCountdown > 0 ? (
              <div className="flex flex-col items-center gap-4">
                <Countdown seconds={startCountdown} size="lg" />
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  游戏即将开始...
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {allSeatsReady
                    ? '所有玩家已准备，可以开始游戏！'
                    : '等待玩家准备...'}
                </p>
                <Button
                  size="lg"
                  onClick={handleStartGame}
                  disabled={!allSeatsReady}
                  className="w-full"
                >
                  开始游戏
                </Button>
              </div>
            )}
          </div>
        )}

        {!isHost && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto text-center">
            <p className="text-gray-600 dark:text-gray-400">
              等待房主开始游戏...
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
