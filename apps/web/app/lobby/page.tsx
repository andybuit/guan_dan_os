'use client';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import PlayerAvatar from '@/components/ui/PlayerAvatar';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/lib/hooks/useToast';
import type { Player, Room } from '@guan-dan-os/shared';
import { RoomState, SeatPosition, Team } from '@guan-dan-os/shared';
import { LogIn, Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Mock data for development
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

const mockRooms: Room[] = [
  {
    id: 'room-1',
    roomCode: 'ABC123',
    hostId: 'player-1',
    state: RoomState.WAITING,
    seats: {
      [SeatPosition.SOUTH]: {
        position: SeatPosition.SOUTH,
        player: null,
        isReady: false,
        isHost: true,
        team: Team.NS,
      },
      [SeatPosition.NORTH]: {
        position: SeatPosition.NORTH,
        player: null,
        isReady: false,
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
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: {
      bet: 100,
      startingRank: '2',
      allowAIAutoFill: true,
      autoFillTimeoutMs: 10000,
      turnTimeoutMs: 30000,
      isPrivate: false,
    },
  },
  {
    id: 'room-2',
    roomCode: 'DEF456',
    hostId: 'player-2',
    state: RoomState.WAITING,
    seats: {
      [SeatPosition.SOUTH]: {
        position: SeatPosition.SOUTH,
        player: null,
        isReady: true,
        isHost: true,
        team: Team.NS,
      },
      [SeatPosition.NORTH]: {
        position: SeatPosition.NORTH,
        player: null,
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
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: {
      bet: 200,
      startingRank: '2',
      allowAIAutoFill: true,
      autoFillTimeoutMs: 10000,
      turnTimeoutMs: 30000,
      isPrivate: false,
    },
  },
];

export default function LobbyPage() {
  const router = useRouter();
  const { toasts, removeToast, success, error } = useToast();
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [baseBet, setBaseBet] = useState(100);
  const [roomCode, setRoomCode] = useState('');

  const handleCreateRoom = () => {
    // TODO: Call API to create room
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      roomCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      hostId: mockPlayer.profile.id,
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
          player: null,
          isReady: false,
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
      createdAt: Date.now(),
      updatedAt: Date.now(),
      config: {
        bet: baseBet,
        startingRank: '2',
        allowAIAutoFill: true,
        autoFillTimeoutMs: 10000,
        turnTimeoutMs: 30000,
        isPrivate: false,
      },
    };

    setRooms((prev) => [newRoom, ...prev]);
    setShowCreateModal(false);
    success('房间创建成功！');
    router.push(`/room/${newRoom.id}`);
  };

  const handleJoinRoom = () => {
    const room = rooms.find((r) => r.roomCode === roomCode.toUpperCase());
    if (!room) {
      error('房间代码无效');
      return;
    }

    const availableSeats = Object.values(room.seats).filter(
      (s) => s === null
    ).length;
    if (availableSeats === 0) {
      error('房间已满');
      return;
    }

    setShowJoinModal(false);
    success('加入房间成功！');
    router.push(`/room/${room.id}`);
  };

  const getOccupiedSeats = (room: Room) => {
    return Object.values(room.seats).filter((s) => s !== null).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                掼蛋大厅
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                欢迎回来，{mockPlayer.profile.nickname}！
              </p>
            </div>
            <PlayerAvatar player={mockPlayer} size="md" showInfo={false} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button
            size="lg"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            创建房间
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setShowJoinModal(true)}
            className="flex items-center gap-2"
          >
            <LogIn size={20} />
            加入房间
          </Button>
        </div>

        {/* Room List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users size={24} className="text-gray-600 dark:text-gray-400" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              房间列表
            </h2>
            <span className="text-gray-500 dark:text-gray-400">
              ({rooms.length} 个房间)
            </span>
          </div>

          {rooms.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              暂无房间，创建一个开始游戏吧！
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/room/${room.id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
                      <span className="text-blue-700 dark:text-blue-300 font-mono font-bold">
                        {room.roomCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Users size={16} />
                      <span className="text-sm">
                        {getOccupiedSeats(room)}/4
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        底注
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {room.config.bet}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        状态
                      </span>
                      <span
                        className={`font-semibold ${
                          room.state === 'WAITING'
                            ? 'text-green-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {room.state === 'WAITING' ? '等待中' : '游戏中'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Room Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建房间"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              底注
            </label>
            <select
              value={baseBet}
              onChange={(e) => setBaseBet(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowCreateModal(false)}
            >
              取消
            </Button>
            <Button className="flex-1" onClick={handleCreateRoom}>
              创建
            </Button>
          </div>
        </div>
      </Modal>

      {/* Join Room Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="加入房间"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              房间代码
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="输入6位房间代码"
              maxLength={6}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-lg text-center"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowJoinModal(false)}
            >
              取消
            </Button>
            <Button
              className="flex-1"
              onClick={handleJoinRoom}
              disabled={roomCode.length !== 6}
            >
              加入
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
