import { cn } from '@/lib/utils';
import type { Player } from '@guan-dan-os/shared';

interface PlayerAvatarProps {
  player: Player | null;
  size?: 'sm' | 'md' | 'lg';
  showInfo?: boolean;
  className?: string;
}

export default function PlayerAvatar({
  player,
  size = 'md',
  showInfo = true,
  className,
}: PlayerAvatarProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (!player) {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div
          className={cn(
            'rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center',
            sizeClasses[size]
          )}
        >
          <span className="text-gray-400 text-2xl">?</span>
        </div>
        {showInfo && (
          <div className={cn('text-center', textSizeClasses[size])}>
            <p className="text-gray-500">等待中...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative">
        <div
          className={cn(
            'rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden',
            sizeClasses[size]
          )}
        >
          {player.profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={player.profile.avatar}
              alt={player.profile.nickname}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl">
              {player.profile.nickname.charAt(0)}
            </span>
          )}
        </div>
        {player.profile.isAI && (
          <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs px-1 rounded">
            AI
          </div>
        )}
      </div>
      {showInfo && (
        <div className={cn('text-center', textSizeClasses[size])}>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {player.profile.nickname}
          </p>
          <p className="text-gray-500 text-xs">
            Lv.{player.profile.level} • {player.profile.coins.toLocaleString()}
            币
          </p>
        </div>
      )}
    </div>
  );
}
