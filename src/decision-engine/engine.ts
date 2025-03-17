import OpenAI from 'openai';
import { DecisionEngineConfig, TweetDecision } from './types';
import { ProcessedTweet } from '../twitter/types';
import { Tool, tools } from '../config/tools';
import { KOL, KOLList } from '../config/kol-list';

export class DecisionEngine {
  private openai: OpenAI;
  private config: DecisionEngineConfig;
  private toolList: Tool[];
  private kolList: KOL[];

  constructor(config: DecisionEngineConfig, toolList: Tool[] = tools, kolList: KOL[] = KOLList) {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey
    });
    this.config = config;
    this.toolList = toolList;
    this.kolList = kolList;
  }

  /**
   * Analyzes a tweet and determines if it's relevant and which tool to use
   */
  async analyzeTweet(tweet: ProcessedTweet): Promise<TweetDecision> {
    try {
      // Find the KOL in our list to provide context
      const kol = this.kolList.find(k => k.username.toLowerCase() === tweet.author.username.toLowerCase());
      
      // Create a prompt for the LLM
      const prompt = this.createAnalysisPrompt(tweet, kol);
      
      // Get LLM analysis
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { 
            role: 'system', 
            content: 'You are a marketing agent that analyzes tweets to determine if they are good opportunities for tool demonstrations. You will be given a tweet and information about available tools, and you need to determine if the tweet is relevant for a tool demonstration and which tool would be most appropriate to use.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      });

      // Parse the response
      const responseContent = completion.choices[0].message.content || '{}';
      const decision = JSON.parse(responseContent) as {
        isRelevant: boolean;
        selectedToolId: string | null;
        relevanceScore: number;
        reasoning: string;
      };

      // Find the selected tool in our list
      const selectedTool = decision.selectedToolId
        ? this.toolList.find(tool => tool.id === decision.selectedToolId) || null
        : null;

      return {
        tweet,
        isRelevant: decision.isRelevant,
        selectedTool,
        relevanceScore: decision.relevanceScore,
        reasoning: decision.reasoning
      };
    } catch (error) {
      console.error('Error analyzing tweet:', error);
      
      // Return a default decision indicating failure
      return {
        tweet,
        isRelevant: false,
        selectedTool: null,
        relevanceScore: 0,
        reasoning: `Error analyzing tweet: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Analyzes multiple tweets and returns decisions for each
   */
  async analyzeTweets(tweets: ProcessedTweet[]): Promise<TweetDecision[]> {
    const decisions: TweetDecision[] = [];
    
    for (const tweet of tweets) {
      const decision = await this.analyzeTweet(tweet);
      decisions.push(decision);
    }
    
    return decisions;
  }

  /**
   * Creates a detailed analysis prompt for the LLM
   */
  private createAnalysisPrompt(tweet: ProcessedTweet, kol: KOL | undefined): string {
    // Tool descriptions
    const toolDescriptions = this.toolList.map(tool => 
      `ID: ${tool.id}\nName: ${tool.name}\nDescription: ${tool.description}\nAudience: ${tool.audience}\nKeywords: ${tool.keywords.join(', ')}`
    ).join('\n\n');

    // KOL context
    const kolContext = kol 
      ? `\nKOL Information:
Username: ${kol.username}
Niche: ${kol.niche.join(', ')}
Interests: ${kol.interests.join(', ')}
Description: ${kol.description}`
      : '\nNote: This account is not in our KOL database.';

    // Create the prompt
    return `
Analyze the following tweet to determine if it's a good opportunity for a tool demonstration:

Tweet Information:
Author: @${tweet.author.username} (${tweet.author.displayName})
Content: "${tweet.content}"
Engagement: ${tweet.metrics.likes} likes, ${tweet.metrics.retweets} retweets, ${tweet.metrics.replies} replies
Media Types: ${tweet.media ? tweet.media.map(m => m.type).join(', ') : 'None'}
URLs: ${tweet.extractedUrls.length > 0 ? tweet.extractedUrls.join(', ') : 'None'}
Is Reply: ${tweet.isReply}
${kolContext}

Available Tools:
${toolDescriptions}

Task:
1. Analyze the tweet content, context, and audience
2. Determine if the tweet is relevant for any of our tools
3. Select the most appropriate tool to demonstrate (if relevant)
4. Rate the relevance on a scale of 0-100 (0 = completely irrelevant, 100 = perfect match)
5. Explain your reasoning

Return your analysis in the following JSON format:
{
  "isRelevant": boolean,
  "selectedToolId": string or null,
  "relevanceScore": number (0-100),
  "reasoning": "Your detailed explanation..."
}
`;
  }

  /**
   * Filters decisions based on relevance threshold and sorts by relevance score
   */
  filterAndRankDecisions(decisions: TweetDecision[]): TweetDecision[] {
    return decisions
      .filter(decision => decision.isRelevant && decision.relevanceScore >= this.config.relevanceThreshold)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}