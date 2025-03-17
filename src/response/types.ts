import { ProcessedTweet } from '../twitter/types';
import { Tool } from '../config/tools';
import { ToolOutput } from '../tools/types';

// Final response ready for output/publishing
export interface MarketingResponse {
  tweet: ProcessedTweet;
  tool: Tool;
  toolOutput: ToolOutput;
  responseText: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
}

// Configuration for the response generator
export interface ResponseGeneratorConfig {
  openaiApiKey: string;
  model: string;
}