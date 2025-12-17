import { cn } from '@/lib/utils';
import type { Card as CardType } from '@guan-dan-os/shared';
import { Suit } from '@guan-dan-os/shared';

interface CardProps {
  card: CardType;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const suitSymbols: Record<string, string> = {
  '♥': '♥',
  '♦': '♦',
  '♣': '♣',
  '♠': '♠',
};

const suitColors: Record<string, string> = {
  '♥': 'text-red-600',
  '♦': 'text-red-600',
  '♣': 'text-gray-900 dark:text-gray-100',
  '♠': 'text-gray-900 dark:text-gray-100',
};

const rankDisplay: Record<string, string> = {
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  J: 'J',
  Q: 'Q',
  K: 'K',
  A: 'A',
  SmallJoker: '小王',
  BigJoker: '大王',
};

export default function Card({
  card,
  selected,
  onClick,
  size = 'md',
  className,
}: CardProps) {
  const isJoker = card.suit === Suit.JOKER;
  const displayRank = rankDisplay[card.rank] || card.rank.toString();
  const suitSymbol = !isJoker ? suitSymbols[card.suit] || '' : '';
  const colorClass = !isJoker ? suitColors[card.suit] || '' : '';

  const sizeClasses = {
    sm: 'w-12 h-16 text-xs',
    md: 'w-16 h-24 text-sm',
    lg: 'w-20 h-28 text-base',
  };

  const jokerBg =
    card.rank === 'BigJoker'
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
        {isJoker ? (card.rank === 'BigJoker' ? '★' : '☆') : suitSymbol}
      </div>

      {/* Bottom right corner (rotated) */}
      <div className={cn('p-1 font-bold rotate-180', colorClass)}>
        <div className="leading-none">{displayRank}</div>
        {suitSymbol && <div className="text-lg leading-none">{suitSymbol}</div>}
      </div>

      {/* Wildcard indicator */}
      {card.isWildcard && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-400 rounded-full border border-yellow-600" />
      )}
    </div>
  );
}
