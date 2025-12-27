# CardSVG Component

The CardSVG component displays card images using SVG files served from the `/cards` endpoint, providing a performant and flexible way to render playing cards.

## Usage

```tsx
import { CardSVG } from '@guan-dan-os/shared';

<CardSVG
  rank="A"  // Can be '2'-'10', 'J', 'Q', 'K', 'A', 'SmallJoker', 'BigJoker', or 'JOKER'
  suit="spades"  // 'spades', 'hearts', 'diamonds', 'clubs', or 'joker'
  width={80}
  height={120}
  highlight={false}
  pattern="none"  // 'none', 'stripes', or 'dots' for colorblind accessibility
/>
```

## Setup Requirements

The CardSVG component requires an API endpoint to serve the SVG files. The consuming application should:

### For Next.js Applications

Create an API route to serve the SVG files:

```typescript
// pages/api/cards/[...path].ts or app/api/cards/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const svgPath = params.path.join('/');

  // Security check - only allow .svg files
  if (!svgPath.endsWith('.svg')) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const filePath = path.join(
      process.cwd(),
      '../../packages/shared/src/assets/cards',
      svgPath
    );

    const svgContent = await readFile(filePath, 'utf-8');

    return new NextResponse(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    return new NextResponse('SVG not found', { status: 404 });
  }
}
```

## Features

- **Server-Side Rendering Compatible**: Uses standard `<img>` tags that work perfectly with SSR
- **Automatic Fallback**: If an SVG fails to load, a styled card representation is shown
- **Accessibility**: Supports colorblind accessibility patterns (stripes and dots) as overlays
- **Responsive**: SVGs scale properly with width/height props
- **TypeScript**: Fully typed for better developer experience
- **Performance Optimized**: SVGs are cached by the browser with appropriate cache headers

## How It Works

1. The component constructs the appropriate image path based on card rank and suit
2. Images are loaded via standard `<img>` tags with `/cards/` URLs
3. If an image fails to load, React state is used to show a fallback SVG component
4. Colorblind patterns are rendered as overlays when specified

## File Structure

SVG files are expected to be located at:
```
packages/shared/src/assets/cards/
├── 2_of_clubs.svg
├── 2_of_diamonds.svg
├── 2_of_hearts.svg
├── 2_of_spades.svg
├── 3_of_clubs.svg
├── ...
├── ace_of_spades.svg
├── jack_of_clubs.svg
├── ...
├── black_joker.svg
└── red_joker.svg
```

## Mapping Logic

- **Ranks**: '2'-'10' map directly, 'J' → 'jack', 'Q' → 'queen', 'K' → 'king', 'A' → 'ace'
- **Suits**: Map directly to lowercase ('spades' → 'spades', etc.)
- **Jokers**: 'SmallJoker' → 'black_joker.svg', 'BigJoker' → 'red_joker.svg'
- **File Naming**: `{rank}_of_{suit}.svg` for regular cards, `{joker_type}.svg` for jokers

## Performance Considerations

- SVGs are served with cache headers for optimal performance
- The component uses React state to manage error states efficiently
- Fallback rendering is lightweight and doesn't require additional network requests
- Colorblind pattern overlays are rendered inline without extra HTTP requests