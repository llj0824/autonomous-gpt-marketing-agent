import { ProcessedTweet } from '../twitter/types';
import { Tool } from '../config/tools';

// Output of a tool execution
export interface ToolOutput {
  content: string;
  reasoning: string;
  metadata: Record<string, any>;
}

// Interface for tool executor
export interface ToolExecutor {
  execute(tweet: ProcessedTweet, tool: Tool): Promise<ToolOutput>;
}

// Configuration for the tool executor
export interface ToolExecutorConfig {
  openaiApiKey: string;
  model: string;
}