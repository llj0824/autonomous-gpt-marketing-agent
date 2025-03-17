import { NextResponse } from 'next/server';
import { getPublicConfig } from '@/lib/config';

export async function GET() {
  try {
    // Only return public config (no API keys or secrets)
    const publicConfig = getPublicConfig();
    return NextResponse.json(publicConfig);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}