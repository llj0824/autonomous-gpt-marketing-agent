import OpenAI from 'openai';
import { ToolExecutor, ToolExecutorConfig, ToolOutput } from './types';
import { ProcessedTweet } from '../twitter/types';
import { Tool } from '../config/tools';

export class OpenAIToolExecutor implements ToolExecutor {
  private openai: OpenAI;
  private config: ToolExecutorConfig;

  constructor(config: ToolExecutorConfig) {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey
    });
    this.config = config;
  }

  /**
   * Execute a tool on a tweet to generate content
   */
  async execute(tweet: ProcessedTweet, tool: Tool): Promise<ToolOutput> {
    try {
      // Create a prompt based on the tool and tweet
      const prompt = this.createExecutionPrompt(tweet, tool);
      
      // Generate content with OpenAI
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are a marketing assistant that demonstrates tools in response to tweets. 
You help create valuable content based on tweets using the specified tool. 
Your responses should showcase the value of the tool while being genuinely helpful and not overly promotional.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      // Parse the response
      const responseContent = completion.choices[0].message.content || '{}';
      const result = JSON.parse(responseContent) as {
        content: string;
        reasoning: string;
        metadata: Record<string, any>;
      };

      return {
        content: result.content,
        reasoning: result.reasoning,
        metadata: result.metadata || {}
      };
    } catch (error) {
      console.error('Error executing tool:', error);
      
      // Return error information
      return {
        content: 'Error generating tool output.',
        reasoning: `Failed to execute tool: ${error instanceof Error ? error.message : String(error)}`,
        metadata: { error: true }
      };
    }
  }

  /**
   * Create a prompt for tool execution
   */
  private createExecutionPrompt(tweet: ProcessedTweet, tool: Tool): string {
    return `
Tweet Information:
Author: @${tweet.author.username} (${tweet.author.displayName})
Content: "${tweet.content}"
URLs in tweet: ${tweet.extractedUrls.length > 0 ? tweet.extractedUrls.join(', ') : 'None'}
Media in tweet: ${tweet.media ? tweet.media.map(m => m.type).join(', ') : 'None'}

Tool to Apply:
Name: ${tool.name}
Description: ${tool.description}
Example Response: "${tool.exampleResponse}"

Task:
1. Analyze the tweet content
2. Apply the ${tool.name} tool to create a valuable response
3. Create content that showcases the tool's value while being helpful to the original tweet author and their audience
4. Ensure your response is contextual and specifically addresses the tweet content
5. Include relevant visualization descriptions, insights, or data based on the tool's purpose

Return your response in the following JSON format:
{
  "content": "The actual tool output/response that would be sent (without explanatory meta-commentary)",
  "reasoning": "Your behind-the-scenes explanation of why you chose this approach and how you applied the tool",
  "metadata": {
    "contentType": "text" or "visual" or "data",
    "additionalInfo": "Any other relevant details about the content"
  }
}
`;
  }
}