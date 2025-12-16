import { cn } from '@/lib/utils';
import type { Card as CardType } from '@guan-dan-os/shared';

interface CardProps {
  card: CardType;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
} as const;

const suitColors = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-gray-900 dark:text-gray-100',
  spades: 'text-gray-900 dark:text-gray-100',
} as const;

const rankDisplay: Record<number, string> = {
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: '小王',
  15: '大王',
};

export default function Card({
  card,
  selected,
  onClick,
  size = 'md',
  className,
}: CardProps) {
  const isJoker = card.suit === 'joker';
  const displayRank = rankDisplay[card.rank] || card.rank.toString();
  const suitSymbol = !isJoker
    ? suitSymbols[card.suit as keyof typeof suitSymbols]
    : '';
  const colorClass = !isJoker
    ? suitColors[card.suit as keyof typeof suitColors]
    : '';

  const sizeClasses = {
    sm: 'w-12 h-16 text-xs',
    md: 'w-16 h-24 text-sm',
    lg: 'w-20 h-28 text-base',
  };

  const jokerBg =
    card.rank === 15
      ? 'bg-red-100 border-red-400'
      : 'bg-gray-100 border-gray-400';

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-between rounded-lg border-2 bg-white shadow-md transition-all cursor-pointer select-none',
        sizeClasses[size],
        selected && 'ring-4 ring-blue-500 -translate-y-4',
        isJoker && jokerBg,
        !isJoker && 'border-gray-300',
        onClick && 'hover:shadow-lg hover:-translate-y-1',
        className
      )}
      onClick={onClick}
    >
      {/* Top left corner */}
      <div className={cn('p-1 font-bold', colorClass)}>
        <div className="leading-none">{displayRank}</div>
        {suitSymbol && <div className="text-lg leading-none">{suitSymbol}</div>}
      </div>

      {/* Center symbol */}
      <div className={cn('text-4xl font-bold', colorClass)}>
        {isJoker ? (card.rank === 15 ? '★' : '☆') : suitSymbol}
      </div>

      {/* Bottom right corner (rotated) */}
      <div className={cn('p-1 font-bold rotate-180', colorClass)}>
        <div className="leading-none">{displayRank}</div>
        {suitSymbol && <div className="text-lg leading-none">{suitSymbol}</div>}
      </div>

      {/* Windfall indicator */}
      {card.isWindfall && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-400 rounded-full border border-yellow-600" />
      )}
    </div>
  );
}
