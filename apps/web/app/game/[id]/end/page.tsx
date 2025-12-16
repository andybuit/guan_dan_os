'use client';

import Button from '@/components/ui/Button';
import PlayerAvatar from '@/components/ui/PlayerAvatar';
import type { Player } from '@guan-dan-os/shared';
import { ArrowDown, ArrowUp, Gift, Trophy } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

type RankType = '头游' | '二游' | '三游' | '末游';

interface GameResult {
  player: Player;
  rank: RankType;
  coinChange: number;
  newLevel: number;
  levelChange: number;
}

interface TributeAction {
  from: Player;
  to: Player;
  card: string;
  type: 'tribute' | 'counter-tribute' | 'return';
}

// Mock data
const mockPlayers: Record<string, Player> = {
  'player-1': {
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
  },
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

const mockResults: GameResult[] = [
  {
    player: mockPlayers['player-1'],
    rank: '头游',
    coinChange: +200,
    newLevel: 14,
    levelChange: 2,
  },
  {
    player: mockPlayers['player-2'],
    rank: '二游',
    coinChange: +100,
    newLevel: 12,
    levelChange: 1,
  },
  {
    player: mockPlayers['ai-1'],
    rank: '三游',
    coinChange: -50,
    newLevel: 10,
    levelChange: 0,
  },
  {
    player: mockPlayers['ai-2'],
    rank: '末游',
    coinChange: -150,
    newLevel: 9,
    levelChange: 0,
  },
];

const mockTributes: TributeAction[] = [
  {
    from: mockPlayers['ai-2'],
    to: mockPlayers['player-1'],
    card: '♠A',
    type: 'tribute',
  },
  {
    from: mockPlayers['player-1'],
    to: mockPlayers['ai-2'],
    card: '♥5',
    type: 'return',
  },
];

const mockStats = {
  totalTurns: 45,
  bombsPlayed: 3,
  straightsPlayed: 8,
  duration: '12分30秒',
};

export default function GameEndPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;

  const handlePlayAgain = () => {
    router.push(`/room/${roomId}`);
  };

  const handleReturnToLobby = () => {
    router.push('/lobby');
  };

  const getRankColor = (rank: RankType) => {
    switch (rank) {
      case '头游':
        return 'text-yellow-600 dark:text-yellow-400';
      case '二游':
        return 'text-blue-600 dark:text-blue-400';
      case '三游':
        return 'text-gray-600 dark:text-gray-400';
      case '末游':
        return 'text-red-600 dark:text-red-400';
    }
  };

  const getRankIcon = (rank: RankType) => {
    if (rank === '头游') {
      return <Trophy size={32} className="text-yellow-500" />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
            游戏结束
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Rankings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            排名结果
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockResults.map((result, index) => (
              <div
                key={result.player.id}
                className={`border-2 rounded-lg p-6 transition-all ${
                  result.rank === '头游'
                    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                    : result.rank === '二游'
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <PlayerAvatar
                      player={result.player}
                      size="md"
                      showInfo={false}
                    />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {result.player.nickname}
                      </p>
                      <p
                        className={`text-lg font-bold ${getRankColor(
                          result.rank
                        )}`}
                      >
                        {result.rank}
                      </p>
                    </div>
                  </div>
                  {getRankIcon(result.rank)}
                </div>

                <div className="space-y-2">
                  {/* Coin Change */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      金币变化
                    </span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        result.coinChange > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {result.coinChange > 0 ? (
                        <ArrowUp size={16} />
                      ) : (
                        <ArrowDown size={16} />
                      )}
                      {result.coinChange > 0 ? '+' : ''}
                      {result.coinChange}
                    </span>
                  </div>

                  {/* Level Change */}
                  {result.levelChange !== 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        等级变化
                      </span>
                      <span className="font-semibold text-blue-600 flex items-center gap-1">
                        <ArrowUp size={16} />
                        Lv.{result.player.level} → Lv.{result.newLevel}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tribute Actions */}
        {mockTributes.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Gift
                size={24}
                className="text-purple-600 dark:text-purple-400"
              />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                进贡/还贡
              </h2>
            </div>
            <div className="space-y-3">
              {mockTributes.map((tribute, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <PlayerAvatar
                      player={tribute.from}
                      size="sm"
                      showInfo={false}
                    />
                    <span className="text-gray-900 dark:text-white">
                      {tribute.from.nickname}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-gray-600 px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-500">
                      <span className="font-bold text-lg">{tribute.card}</span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">
                      {tribute.type === 'tribute'
                        ? '进贡'
                        : tribute.type === 'counter-tribute'
                          ? '抗贡'
                          : '还贡'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <PlayerAvatar
                      player={tribute.to}
                      size="sm"
                      showInfo={false}
                    />
                    <span className="text-gray-900 dark:text-white">
                      {tribute.to.nickname}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            游戏统计
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                总回合数
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockStats.totalTurns}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                炸弹次数
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockStats.bombsPlayed}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                顺子次数
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockStats.straightsPlayed}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                游戏时长
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockStats.duration}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button size="lg" variant="secondary" onClick={handleReturnToLobby}>
            返回大厅
          </Button>
          <Button size="lg" onClick={handlePlayAgain}>
            再来一局
          </Button>
        </div>
      </main>
    </div>
  );
}
