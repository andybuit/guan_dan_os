import { cn } from '@/lib/utils';
import type { Card } from '@guan-dan-os/shared';
import { ArrowDownUp, Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';
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
            'flex justify-center items-end gap-0.5 overflow-x-auto pb-2',
            'min-h-[120px]'
          )}
          style={{
            // Create overlap effect for cards
            marginLeft: cards.length > 15 ? '-2rem' : '0',
          }}
        >
          {cards.map((card, index) => {
            const isSelected = selectedCards.some((c) => c.id === card.id);
            return (
              <div
                key={card.id}
                className="relative"
                style={{
                  marginLeft: index > 0 && cards.length > 15 ? '-2.5rem' : '0',
                  zIndex: isSelected ? 100 : cards.length - index,
                }}
              >
                <GameCard
                  card={card}
                  selected={isSelected}
                  onClick={() => handleCardClick(card)}
                  size="md"
                  disabled={disabled}
                  className="transition-all duration-200"
                />
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
