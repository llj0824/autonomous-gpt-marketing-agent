import { NextResponse } from 'next/server';
import { MarketingAgent } from '@/lib/marketingAgent';
import { getServerConfig } from '@/lib/config';

export const maxDuration = 300; // Max duration of 5 minutes

export async function GET() {
  try {
    // Get server config with environment variables
    const serverConfig = getServerConfig();
    
    // Create and initialize agent with server config
    const agent = new MarketingAgent(serverConfig);
    const result = await agent.run();
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}