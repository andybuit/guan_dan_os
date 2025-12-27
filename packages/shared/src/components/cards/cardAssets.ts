// Import all SVG files as strings
// Note: This approach requires a bundler that can handle raw SVG imports
// For Next.js, you'll need to configure webpack or use a different approach

// Since we can't directly import SVGs as strings in all environments,
// we'll create a mapping that can be used to fetch the SVGs

export const cardSVGPaths = {
  // Spades
  '2_spades': '/cards/2_of_spades.svg',
  '3_spades': '/cards/3_of_spades.svg',
  '4_spades': '/cards/4_of_spades.svg',
  '5_spades': '/cards/5_of_spades.svg',
  '6_spades': '/cards/6_of_spades.svg',
  '7_spades': '/cards/7_of_spades.svg',
  '8_spades': '/cards/8_of_spades.svg',
  '9_spades': '/cards/9_of_spades.svg',
  '10_spades': '/cards/10_of_spades.svg',
  'J_spades': '/cards/jack_of_spades.svg',
  'Q_spades': '/cards/queen_of_spades.svg',
  'K_spades': '/cards/king_of_spades.svg',
  'A_spades': '/cards/ace_of_spades.svg',

  // Hearts
  '2_hearts': '/cards/2_of_hearts.svg',
  '3_hearts': '/cards/3_of_hearts.svg',
  '4_hearts': '/cards/4_of_hearts.svg',
  '5_hearts': '/cards/5_of_hearts.svg',
  '6_hearts': '/cards/6_of_hearts.svg',
  '7_hearts': '/cards/7_of_hearts.svg',
  '8_hearts': '/cards/8_of_hearts.svg',
  '9_hearts': '/cards/9_of_hearts.svg',
  '10_hearts': '/cards/10_of_hearts.svg',
  'J_hearts': '/cards/jack_of_hearts.svg',
  'Q_hearts': '/cards/queen_of_hearts.svg',
  'K_hearts': '/cards/king_of_hearts.svg',
  'A_hearts': '/cards/ace_of_hearts.svg',

  // Diamonds
  '2_diamonds': '/cards/2_of_diamonds.svg',
  '3_diamonds': '/cards/3_of_diamonds.svg',
  '4_diamonds': '/cards/4_of_diamonds.svg',
  '5_diamonds': '/cards/5_of_diamonds.svg',
  '6_diamonds': '/cards/6_of_diamonds.svg',
  '7_diamonds': '/cards/7_of_diamonds.svg',
  '8_diamonds': '/cards/8_of_diamonds.svg',
  '9_diamonds': '/cards/9_of_diamonds.svg',
  '10_diamonds': '/cards/10_of_diamonds.svg',
  'J_diamonds': '/cards/jack_of_diamonds.svg',
  'Q_diamonds': '/cards/queen_of_diamonds.svg',
  'K_diamonds': '/cards/king_of_diamonds.svg',
  'A_diamonds': '/cards/ace_of_diamonds.svg',

  // Clubs
  '2_clubs': '/cards/2_of_clubs.svg',
  '3_clubs': '/cards/3_of_clubs.svg',
  '4_clubs': '/cards/4_of_clubs.svg',
  '5_clubs': '/cards/5_of_clubs.svg',
  '6_clubs': '/cards/6_of_clubs.svg',
  '7_clubs': '/cards/7_of_clubs.svg',
  '8_clubs': '/cards/8_of_clubs.svg',
  '9_clubs': '/cards/9_of_clubs.svg',
  '10_clubs': '/cards/10_of_clubs.svg',
  'J_clubs': '/cards/jack_of_clubs.svg',
  'Q_clubs': '/cards/queen_of_clubs.svg',
  'K_clubs': '/cards/king_of_clubs.svg',
  'A_clubs': '/cards/ace_of_clubs.svg',

  // Jokers
  'SmallJoker': '/cards/black_joker.svg',
  'BigJoker': '/cards/red_joker.svg',
  'JOKER': '/cards/red_joker.svg',
} as const;

export type CardKey = keyof typeof cardSVGPaths;