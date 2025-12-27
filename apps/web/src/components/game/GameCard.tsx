import { cn } from '@/lib/utils';
import type { Card as CardType } from '@guan-dan-os/shared';
import { CardSVG } from '@guan-dan-os/shared';

interface GameCardProps {
  card: CardType;
  selected?: boolean;
  onClick?: () => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  faceDown?: boolean;
}

// Map suit symbols to CardSVG format
const mapSuitToSVG = (
  suit: string
): 'spades' | 'hearts' | 'diamonds' | 'clubs' | 'joker' => {
  const mapping: Record<
    string,
    'spades' | 'hearts' | 'diamonds' | 'clubs' | 'joker'
  > = {
    '♠': 'spades',
    '♥': 'hearts',
    '♦': 'diamonds',
    '♣': 'clubs',
    JOKER: 'joker',
  };
  return mapping[suit] || 'spades';
};

export default function GameCard({
  card,
  selected = false,
  onClick,
  size = 'md',
  className,
  disabled = false,
  faceDown = false,
}: GameCardProps) {
  const svgSuit = mapSuitToSVG(card.suit);

  const sizeMap = {
    xs: { width: 32, height: 48 },
    sm: { width: 48, height: 72 },
    md: { width: 64, height: 96 },
    lg: { width: 80, height: 120 },
  };

  const dimensions = sizeMap[size];

  if (faceDown) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center rounded-lg border-2 shadow-md',
          'bg-linear-to-br from-blue-600 to-blue-800 border-blue-900',
          className
        )}
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <div className="text-white text-xl font-bold opacity-50">🂠</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative transition-all select-none',
        selected && 'ring-2 ring-blue-500 ring-offset-1 -translate-y-3',
        onClick &&
          !disabled &&
          'hover:shadow-lg hover:-translate-y-1 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={!disabled ? onClick : undefined}
    >
      <CardSVG
        rank={card.rank}
        suit={svgSuit}
        width={dimensions.width}
        height={dimensions.height}
        highlight={selected}
        pattern="none"
      />

      {/* Wildcard indicator */}
      {card.isWildcard && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-yellow-600 flex items-center justify-center text-[8px] font-bold">
          配
        </div>
      )}
    </div>
  );
}
