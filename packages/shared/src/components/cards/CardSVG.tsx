import React, { useState } from 'react';

export interface CardSVGProps {
  rank: string; // e.g. 'A', '2', ..., 'K', 'JOKER'
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs' | 'joker';
  width?: number;
  height?: number;
  highlight?: boolean;
  pattern?: 'stripes' | 'dots' | 'none'; // for colorblind accessibility
}

// Simple card back SVG
export const CardBack: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 80 120"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="2"
      y="2"
      width="76"
      height="116"
      rx="10"
      fill="url(#cardBackGradient)"
      stroke="#1e40af"
      strokeWidth="2"
    />
    <defs>
      <linearGradient id="cardBackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1e40af" />
      </linearGradient>
    </defs>
    <text
      x="40"
      y="60"
      textAnchor="middle"
      fontSize="24"
      fill="white"
      opacity="0.3"
    >
      🂠
    </text>
  </svg>
);


// Fallback card component
const FallbackCard: React.FC<{
  rank: string;
  suit: string;
  width: number;
  height: number;
  highlight: boolean;
}> = ({ rank, suit, width, height, highlight }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 80 120"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="2"
      y="2"
      width="76"
      height="116"
      rx="10"
      fill="#fff"
      stroke={highlight ? '#FFD700' : '#D7263D'}
      strokeWidth={highlight ? "4" : "3"}
    />
    <text
      x="40"
      y="60"
      textAnchor="middle"
      fontSize="24"
      fontWeight="bold"
      fill="#333"
    >
      {rank}{suit !== 'joker' ? suit.charAt(0).toUpperCase() : ''}
    </text>
  </svg>
);

export const CardSVG: React.FC<CardSVGProps> = ({
  rank,
  suit,
  width = 80,
  height = 120,
  highlight = false,
  pattern = 'none',
}) => {
  const [hasError, setHasError] = useState(false);

  // Map rank and suit to image path
  const getImagePath = (rank: string, suit: string): string => {
    // Handle jokers
    if (rank === 'SmallJoker' || rank === 'BigJoker' || rank === 'JOKER') {
      const jokerFile = rank === 'SmallJoker' ? 'black_joker' : 'red_joker';
      return `/api/cards/${jokerFile}.svg`;
    }

    // Map rank to filename
    const rankMap: Record<string, string> = {
      '2': '2',
      '3': '3',
      '4': '4',
      '5': '5',
      '6': '6',
      '7': '7',
      '8': '8',
      '9': '9',
      '10': '10',
      'J': 'jack',
      'Q': 'queen',
      'K': 'king',
      'A': 'ace',
    };

    const rankFile = rankMap[rank] || rank.toLowerCase();
    const suitFile = suit.toLowerCase();

    return `/api/cards/${rankFile}_of_${suitFile}.svg`;
  };

  // Patterns for colorblind accessibility overlay
  const PatternOverlay = pattern !== 'none' ? (
    <svg
      width={width}
      height={height}
      viewBox="0 0 80 120"
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      <defs>
        {pattern === 'stripes' && (
          <pattern id={`stripes-${rank}-${suit}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="3" height="6" fill="#fff" fillOpacity="0.2" />
          </pattern>
        )}
        {pattern === 'dots' && (
          <pattern id={`dots-${rank}-${suit}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.5" fill="#fff" fillOpacity="0.2" />
          </pattern>
        )}
      </defs>
      <rect x="2" y="2" width="76" height="116" rx="10" fill={`url(#${pattern}-${rank}-${suit})`} />
    </svg>
  ) : null;

  // If image failed to load, show fallback
  if (hasError) {
    return (
      <div
        style={{
          position: 'relative',
          width,
          height,
          filter: highlight ? 'drop-shadow(0 0 8px gold)' : undefined,
        }}
        aria-label={`${rank} of ${suit}`}
        role="img"
      >
        <FallbackCard rank={rank} suit={suit} width={width} height={height} highlight={highlight} />
        {PatternOverlay}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        filter: highlight ? 'drop-shadow(0 0 8px gold)' : undefined,
      }}
      aria-label={`${rank} of ${suit}`}
      role="img"
    >
      <img
        src={getImagePath(rank, suit)}
        alt={`${rank} of ${suit}`}
        width={width}
        height={height}
        style={{
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          backgroundColor: '#fff',
        }}
        onError={() => setHasError(true)}
      />
      {PatternOverlay}
    </div>
  );
};