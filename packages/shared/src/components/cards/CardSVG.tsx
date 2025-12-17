import React from 'react';

export interface CardSVGProps {
  rank: string; // e.g. 'A', '2', ..., 'K', 'JOKER'
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs' | 'joker';
  width?: number;
  height?: number;
  highlight?: boolean;
  pattern?: 'stripes' | 'dots' | 'none'; // for colorblind accessibility
}

const suitSymbols: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  joker: '★',
};

const suitColors: Record<string, string> = {
  spades: '#222',
  clubs: '#222',
  hearts: '#D7263D',
  diamonds: '#D7263D',
  joker: '#FFD700',
};

export const CardSVG: React.FC<CardSVGProps> = ({
  rank,
  suit,
  width = 80,
  height = 120,
  highlight = false,
  pattern = 'none',
}) => {
  // Patterns for colorblind accessibility
  const renderPattern = () => {
    if (pattern === 'stripes') {
      return (
        <pattern
          id="stripes"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <rect width="3" height="6" fill="#fff" fillOpacity="0.2" />
        </pattern>
      );
    }
    if (pattern === 'dots') {
      return (
        <pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.5" fill="#fff" fillOpacity="0.2" />
        </pattern>
      );
    }
    return null;
  };

  const patternFill =
    pattern === 'stripes'
      ? 'url(#stripes)'
      : pattern === 'dots'
        ? 'url(#dots)'
        : '#fff';

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 80 120"
      aria-label={`${rank} of ${suit}`}
      role="img"
      style={{ filter: highlight ? 'drop-shadow(0 0 8px gold)' : undefined }}
    >
      <defs>{renderPattern()}</defs>
      {/* Card background */}
      <rect
        x="2"
        y="2"
        width="76"
        height="116"
        rx="10"
        fill="#fff"
        stroke={highlight ? '#FFD700' : '#D7263D'}
        strokeWidth="3"
        fillOpacity="1"
      />
      {/* Pattern overlay for accessibility */}
      {pattern !== 'none' && (
        <rect x="2" y="2" width="76" height="116" rx="10" fill={patternFill} />
      )}
      {/* Suit symbol */}
      <text
        x="12"
        y="28"
        fontSize="24"
        fontWeight="bold"
        fill={suitColors[suit]}
        aria-hidden="true"
      >
        {suitSymbols[suit]}
      </text>
      {/* Rank */}
      <text
        x="12"
        y="52"
        fontSize="20"
        fontWeight="bold"
        fill={suitColors[suit]}
        aria-hidden="true"
      >
        {rank}
      </text>
      {/* Large suit in center for Joker */}
      {suit === 'joker' && (
        <text
          x="40"
          y="80"
          fontSize="48"
          fontWeight="bold"
          fill={suitColors[suit]}
          textAnchor="middle"
          aria-hidden="true"
        >
          {suitSymbols[suit]}
        </text>
      )}
    </svg>
  );
};
