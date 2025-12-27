import { cn } from '@/lib/utils';
import type { Card } from '@guan-dan-os/shared';
import { ArrowDownUp, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import GameCard from './GameCard';

interface HandCardsProps {
  cards: Card[];
  selectedCards: Card[];
  onSelectionChange: (cards: Card[]) => void;
  onSort?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function HandCards({
  cards,
  selectedCards,
  onSelectionChange,
  onSort,
  disabled = false,
  className,
}: HandCardsProps) {
  const [sortBy, setSortBy] = useState<'rank' | 'suit'>('rank');
  const [cardSize, setCardSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Group cards by rank and suit
  const groupedCards = useMemo(() => {
    const groups = cards.reduce((acc, card) => {
      const key = `${card.rank}-${card.suit}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(card);
      return acc;
    }, {} as Record<string, Card[]>);

    // Convert to array and sort
    return Object.entries(groups).sort(([a], [b]) => {
      const [rankA, suitA] = a.split('-');
      const [rankB, suitB] = b.split('-');

      const rankOrder: Record<string, number> = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 11, 'Q': 12, 'K': 13, 'A': 14, 'SmallJoker': 15, 'BigJoker': 16,
      };

      const rankDiff = (rankOrder[rankA] || 0) - (rankOrder[rankB] || 0);
      if (rankDiff !== 0) return rankDiff;

      const suitOrder: Record<string, number> = { '♠': 1, '♥': 2, '♣': 3, '♦': 4, 'JOKER': 5 };
      return (suitOrder[suitA] || 0) - (suitOrder[suitB] || 0);
    });
  }, [cards]);

  // Determine card size based on total number of cards and screen width
  useEffect(() => {
    const updateCardSize = () => {
      const screenWidth = window.innerWidth;
      const totalCards = cards.length;

      if (screenWidth < 640) {
        setCardSize('sm'); // Mobile - always use small
      } else if (screenWidth < 1024) {
        // Tablet - adjust based on card count
        setCardSize(totalCards > 15 ? 'sm' : 'md');
      } else {
        // Desktop - adjust based on card count
        if (totalCards > 20) {
          setCardSize('sm');
        } else if (totalCards > 10) {
          setCardSize('md');
        } else {
          setCardSize('lg');
        }
      }
    };

    updateCardSize();
    window.addEventListener('resize', updateCardSize);
    return () => window.removeEventListener('resize', updateCardSize);
  }, [cards.length]);

  const handleCardClick = useCallback(
    (card: Card) => {
      if (disabled) return;

      const isSelected = selectedCards.some((c) => c.id === card.id);
      if (isSelected) {
        onSelectionChange(selectedCards.filter((c) => c.id !== card.id));
      } else {
        onSelectionChange([...selectedCards, card]);
      }
    },
    [disabled, selectedCards, onSelectionChange]
  );

  const handleSort = useCallback(() => {
    const newSortBy = sortBy === 'rank' ? 'suit' : 'rank';
    setSortBy(newSortBy);
    onSort?.();
  }, [sortBy, onSort]);

  const handleSmartSelect = useCallback(() => {
    // TODO: Implement smart card selection based on card type detection
    // For now, just clear selection
    onSelectionChange([]);
  }, [onSelectionChange]);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Control Buttons */}
      <div className="flex justify-center gap-2">
        <button
          onClick={handleSort}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
        >
          <ArrowDownUp size={14} />
          <span>理牌</span>
        </button>
        <button
          onClick={handleSmartSelect}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
        >
          <Sparkles size={14} />
          <span>提示</span>
        </button>
        {selectedCards.length > 0 && (
          <button
            onClick={() => onSelectionChange([])}
            className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
          >
            取消选择 ({selectedCards.length})
          </button>
        )}
      </div>

      {/* Cards Display */}
      <div className="relative">
        <div
          className={cn(
            'flex justify-center items-start overflow-x-auto pb-2',
            'min-h-[140px] px-4'
          )}
          style={{
            gap: cardSize === 'lg' ? '12px' : cardSize === 'md' ? '8px' : '4px',
          }}
        >
          {groupedCards.map(([key, cardGroup]) => {
            const allSelected = cardGroup.every((card: Card) =>
              selectedCards.some(c => c.id === card.id)
            );
            const someSelected = cardGroup.some((card: Card) =>
              selectedCards.some(c => c.id === card.id)
            );

            // Calculate vertical overlap based on card size (for same rank cards stacking vertically)
            const getVerticalOverlapOffset = () => {
              switch (cardSize) {
                case 'sm': return 16;  // Vertical overlap for small cards
                case 'md': return 20;  // Vertical overlap for medium cards
                case 'lg': return 24;  // Vertical overlap for large cards
                default: return 20;
              }
            };

            const verticalOverlap = getVerticalOverlapOffset();
            const groupWidth = cardSize === 'lg' ? 80 : cardSize === 'md' ? 64 : 48;
            const baseHeight = cardSize === 'lg' ? 120 : cardSize === 'md' ? 96 : 72;
            const stackHeight = baseHeight + (cardGroup.length - 1) * verticalOverlap;

            return (
              <div
                key={key}
                className="relative transition-all duration-200"
                style={{
                  width: `${groupWidth}px`,
                  height: `${stackHeight}px`,
                }}
              >
                {cardGroup.map((card: Card, cardIndex: number) => {
                  const isCardSelected = selectedCards.some(c => c.id === card.id);
                  return (
                    <div
                      key={card.id}
                      className={cn(
                        'absolute transition-all duration-200',
                        'cursor-pointer hover:z-[150]'
                      )}
                      style={{
                        top: `${cardIndex * verticalOverlap}px`,
                        left: 0,
                        zIndex: isCardSelected ? 100 + cardIndex : cardIndex,
                      }}
                      onClick={() => handleCardClick(card)}
                    >
                      <GameCard
                        card={card}
                        selected={isCardSelected}
                        size={cardSize}
                        disabled={disabled}
                        className={cn(
                          'shadow-sm hover:shadow-lg transition-all',
                          isCardSelected && 'ring-2 ring-blue-500 ring-offset-1 -translate-y-2'
                        )}
                      />
                    </div>
                  );
                })}

                {/* Card count indicator for stacks */}
                {cardGroup.length > 1 && (
                  <div
                    className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg pointer-events-none"
                    style={{ zIndex: 200 }}
                  >
                    {cardGroup.length}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Cards count indicator */}
        <div className="absolute -top-8 right-2 bg-gray-800/80 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
          手牌: {cards.length} 张
        </div>
      </div>
    </div>
  );
}
