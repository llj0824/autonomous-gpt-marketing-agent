import { ProcessedTweet } from '../twitter/types';
import { Tool } from '../config/tools';

// Decision result for a tweet
export interface TweetDecision {
  tweet: ProcessedTweet;
  isRelevant: boolean;
  selectedTool: Tool | null;
  relevanceScore: number; // 0-100
  reasoning: string;
}

// Configuration for the decision engine
export interface DecisionEngineConfig {
  openaiApiKey: string;
  model: string;
  relevanceThreshold: number; // 0-100
}