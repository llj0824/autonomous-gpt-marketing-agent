import OpenAI from 'openai';
import { ResponseGeneratorConfig, MarketingResponse } from './types';
import { ProcessedTweet } from '../twitter/types';
import { Tool } from '../config/tools';
import { ToolOutput } from '../tools/types';

export class ResponseGenerator {
  private openai: OpenAI;
  private config: ResponseGeneratorConfig;

  constructor(config: ResponseGeneratorConfig) {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey
    });
    this.config = config;
  }

  /**
   * Generate a marketing response based on a tweet and tool output
   */
  async generateResponse(tweet: ProcessedTweet, tool: Tool, toolOutput: ToolOutput): Promise<MarketingResponse> {
    try {
      // Create a prompt for response generation
      const prompt = this.createResponsePrompt(tweet, tool, toolOutput);
      
      // Generate response with OpenAI
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are a marketing assistant that creates engaging, helpful responses that demonstrate tools. 
Your job is to craft a tweet response that naturally introduces the tool's output in a way that adds value to the conversation.
Your response should be helpful first, with subtle marketing second - the quality of the tool's output should speak for itself.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      });

      // Get the generated response
      const responseText = completion.choices[0].message.content || 'Error generating response.';

      // Create and return the marketing response
      return {
        tweet,
        tool,
        toolOutput,
        responseText,
        timestamp: new Date(),
        status: 'pending'
      };
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Return a default response with error information
      return {
        tweet,
        tool,
        toolOutput,
        responseText: 'Error generating response.',
        timestamp: new Date(),
        status: 'rejected'
      };
    }
  }

  /**
   * Create a prompt for response generation
   */
  private createResponsePrompt(tweet: ProcessedTweet, tool: Tool, toolOutput: ToolOutput): string {
    return `
Original Tweet:
@${tweet.author.username}: "${tweet.content}"

Tool Used:
${tool.name} - ${tool.description}

Tool Output:
${toolOutput.content}

Task:
1. Create a natural, conversational tweet response (max 280 characters) that:
   - Introduces the tool output in a contextual way
   - Directly addresses the original tweet author
   - Delivers value first, with subtle marketing second
   - Feels like a helpful contribution to the conversation
   - Showcases the tool's capabilities through its output
2. Keep your response concise, engaging, and well-structured
3. Make sure the response flows naturally and doesn't feel forced or overly promotional
4. Ensure the most important/valuable part of the tool output is highlighted

Return ONLY the text of the tweet response, no additional commentary or explanation.
`;
  }

  /**
   * Batch generate responses for multiple tweet/tool combinations
   */
  async generateResponses(
    items: Array<{ tweet: ProcessedTweet; tool: Tool; toolOutput: ToolOutput }>
  ): Promise<MarketingResponse[]> {
    const responses: MarketingResponse[] = [];
    
    for (const item of items) {
      try {
        const response = await this.generateResponse(item.tweet, item.tool, item.toolOutput);
        responses.push(response);
      } catch (error) {
        console.error('Error in batch response generation:', error);
      }
    }
    
    return responses;
  }
}