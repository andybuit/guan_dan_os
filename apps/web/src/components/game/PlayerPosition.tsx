import { cn } from '@/lib/utils';
import type { Card, Player } from '@guan-dan-os/shared';
import { User } from 'lucide-react';
import GameCard from './GameCard';

interface PlayerPositionProps {
  player: Player | null;
  position: 'top' | 'left' | 'right';
  remainingCards?: number;
  lastPlay?: Card[];
  isPassed?: boolean;
  isCurrentTurn?: boolean;
  countdown?: number;
  className?: string;
}

export default function PlayerPosition({
  player,
  position,
  remainingCards = 0,
  lastPlay,
  isPassed,
  isCurrentTurn,
  countdown,
  className,
}: PlayerPositionProps) {
  if (!player) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <div className="text-gray-400 text-sm">等待玩家...</div>
      </div>
    );
  }

  const positionStyles = {
    top: 'flex-col items-center',
    left: 'flex-row items-center',
    right: 'flex-row-reverse items-center',
  };

  const cardContainerStyles = {
    top: 'flex-row justify-center mt-2',
    left: 'flex-col ml-2',
    right: 'flex-col mr-2',
  };

  return (
    <div className={cn('flex gap-3', positionStyles[position], className)}>
      {/* Player Info */}
      <div className="flex flex-col items-center gap-1 bg-white/90 dark:bg-gray-800/90 rounded-lg p-2 shadow-md min-w-[100px]">
        {/* Avatar */}
        <div
          className={cn(
            'relative w-12 h-12 rounded-full flex items-center justify-center',
            isCurrentTurn
              ? 'ring-4 ring-yellow-400 ring-offset-2'
              : 'ring-2 ring-gray-300'
          )}
        >
          {player.profile.avatar ? (
            <img
              src={player.profile.avatar}
              alt={player.profile.nickname}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <User className="text-white" size={24} />
            </div>
          )}

          {/* Countdown Badge */}
          {isCurrentTurn && countdown !== undefined && countdown > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">
              {countdown}
            </div>
          )}
        </div>

        {/* Nickname */}
        <div className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-20">
          {player.profile.nickname}
        </div>

        {/* Coins */}
        <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
          <span>💰</span>
          <span>{(player.profile.coins / 10000).toFixed(2)}万</span>
        </div>

        {/* Remaining Cards Count */}
        <div className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
          {remainingCards} 张
        </div>
      </div>

      {/* Last Play Area */}
      <div className={cn('flex gap-1', cardContainerStyles[position])}>
        {isPassed && (
          <div className="bg-gray-800/80 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg">
            不出
          </div>
        )}

        {lastPlay && lastPlay.length > 0 && !isPassed && (
          <div className="flex gap-1 flex-wrap max-w-[300px]">
            {lastPlay.map((card, index) => (
              <GameCard
                key={`${card.id}-${index}`}
                card={card}
                size="sm"
                className={
                  position === 'left' || position === 'right' ? 'mb-1' : ''
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
