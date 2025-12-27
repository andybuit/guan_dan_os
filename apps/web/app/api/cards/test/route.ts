import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Cards API is working',
    cwd: process.cwd(),
    timestamp: new Date().toISOString(),
  });
}