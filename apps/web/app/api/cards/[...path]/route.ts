import { readdir, readFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const svgPath = pathSegments.join('/');

  // Security check - only allow .svg files
  if (!svgPath.endsWith('.svg')) {
    return new NextResponse('Not found', { status: 404 });
  }

  // The correct path from apps/web (cwd) to packages/shared/src/assets/cards
  const basePath = path.resolve(
    process.cwd(),
    '../../packages/shared/src/assets/cards'
  );
  const filePath = path.join(basePath, svgPath);

  try {
    const svgContent = await readFile(filePath, 'utf-8');

    return new NextResponse(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error loading SVG:', error);

    // Try to debug by listing the directory contents
    try {
      const dirPath = path.join(
        process.cwd(),
        '../../packages/shared/src/assets/cards'
      );
      console.log('Listing directory:', dirPath);
      const files = await readdir(dirPath);
      console.log('Files in directory:', files.slice(0, 10)); // Show first 10 files
    } catch (dirError) {
      console.error('Could not list directory:', dirError);
    }

    return new NextResponse('SVG not found', { status: 404 });
  }
}
