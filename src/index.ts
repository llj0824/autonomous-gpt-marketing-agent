import { config, validateConfig, KOLList, tools } from './config';
import { TwitterClient, TweetCollectionOptions } from './twitter';
import { DecisionEngine } from './decision-engine';
import { OpenAIToolExecutor } from './tools';
import { ResponseGenerator } from './response';
import { CSVOutputWriter } from './output';
import { startServer } from './ui/server';
import dotenv from 'dotenv';

dotenv.config();

// Define error interface for tracking
interface AgentError {
  timestamp: string;
  message: string;
  tweet?: string;
}

// Initialize global status tracker for the UI
export const agentStatus = {
  tweets: { total: 0, pending: 0, processed: 0 },
  decisions: { total: 0, matched: 0, rejected: 0 },
  tools: { total: 0, processed: 0, inProgress: 0 },
  responses: { total: 0, generated: 0, pending: 0 },
  errors: [] as AgentError[]
};

/**
 * Main application class for the Marketing Agent
 */
class MarketingAgent {
  private twitterClient: TwitterClient;
  private decisionEngine: DecisionEngine;
  private toolExecutor: OpenAIToolExecutor;
  private responseGenerator: ResponseGenerator;
  private csvWriter: CSVOutputWriter;

  constructor() {
    // Initialize Twitter client
    this.twitterClient = new TwitterClient({
      username: config.twitter.username,
      password: config.twitter.password,
      email: config.twitter.email,
      proxyUrl: config.twitter.proxyUrl,
      apiKey: config.twitter.apiKey,
      apiSecretKey: config.twitter.apiSecretKey,
      accessToken: config.twitter.accessToken,
      accessTokenSecret: config.twitter.accessTokenSecret
    });

    // Initialize decision engine
    this.decisionEngine = new DecisionEngine({
      openaiApiKey: config.openai.apiKey,
      model: config.openai.model,
      relevanceThreshold: 50 // Default relevance threshold (0-100)
    });

    // Initialize tool executor
    this.toolExecutor = new OpenAIToolExecutor({
      openaiApiKey: config.openai.apiKey,
      model: config.openai.model
    });

    // Initialize response generator
    this.responseGenerator = new ResponseGenerator({
      openaiApiKey: config.openai.apiKey,
      model: config.openai.model
    });

    // Initialize CSV writer
    this.csvWriter = new CSVOutputWriter(config.output.csvPath);
  }
  
  // Update status metrics with collected data
  private updateStatus(tweets: any[], decisions: any[], toolOutputs: any[], responses: any[]): void {
    agentStatus.tweets.total = tweets.length;
    agentStatus.tweets.processed = tweets.length;
    agentStatus.tweets.pending = 0;
    
    agentStatus.decisions.total = decisions.length;
    agentStatus.decisions.matched = decisions.filter(d => d.selectedTool).length;
    agentStatus.decisions.rejected = decisions.length - agentStatus.decisions.matched;
    
    agentStatus.tools.total = toolOutputs.length;
    agentStatus.tools.processed = toolOutputs.length;
    agentStatus.tools.inProgress = 0;
    
    agentStatus.responses.total = responses.length;
    agentStatus.responses.generated = responses.length;
    agentStatus.responses.pending = 0;
  }

  /**
   * Run the entire marketing agent pipeline
   */
  async run(): Promise<void> {
    try {
      console.log('Starting marketing agent...');

      // Validate configuration
      const configErrors = validateConfig();
      if (configErrors.length > 0) {
        console.error('Configuration errors:', configErrors.join(', '));
        return;
      }

      // Initialize Twitter client
      console.log('Initializing Twitter client...');
      const initialized = await this.twitterClient.initialize();
      if (!initialized) {
        console.error('Failed to initialize Twitter client');
        return;
      }

      // Collect tweets from KOLs
      console.log('Collecting tweets from KOLs...');
      const tweetOptions: TweetCollectionOptions = {
        lookbackDays: config.tweetCollection.lookbackDays,
        minEngagement: config.tweetCollection.minEngagement,
        maxTweetsPerKOL: config.tweetCollection.maxTweetsPerKOL
      };
      const tweets = await this.twitterClient.collectTweetsFromKOLs(KOLList, tweetOptions);
      console.log(`Collected ${tweets.length} tweets from KOLs`);
      
      // Update status
      agentStatus.tweets.total = tweets.length;
      agentStatus.tweets.pending = tweets.length;

      if (tweets.length === 0) {
        console.log('No tweets collected, exiting');
        return;
      }

      // Analyze tweets and make decisions
      console.log('Analyzing tweets and making decisions...');
      // Log the tweets for inspection
      console.log("Collected tweets for analysis:");
      tweets.forEach((tweet, index) => {
        console.log(`${index + 1}. @${tweet.author.username}: ${tweet.content.substring(0, 100)}${tweet.content.length > 100 ? '...' : ''}`);
      });
      
      const decisions = await this.decisionEngine.analyzeTweets(tweets);
      const relevantDecisions = this.decisionEngine.filterAndRankDecisions(decisions);
      console.log(`Found ${relevantDecisions.length} relevant tweets for tool applications`);
      
      // Update status
      agentStatus.tweets.processed = tweets.length;
      agentStatus.tweets.pending = 0;
      agentStatus.decisions.total = decisions.length;
      agentStatus.decisions.matched = relevantDecisions.length;
      agentStatus.decisions.rejected = decisions.length - relevantDecisions.length;
      agentStatus.tools.total = relevantDecisions.length;
      agentStatus.tools.inProgress = relevantDecisions.length;

      if (relevantDecisions.length === 0) {
        console.log('No relevant tweets found, exiting');
        return;
      }

      // Execute tools on relevant tweets
      console.log('Executing tools on relevant tweets...');
      const toolOutputs = [];
      for (const decision of relevantDecisions) {
        if (decision.selectedTool) {
          console.log(`Applying ${decision.selectedTool.name} to tweet from @${decision.tweet.author.username}`);
          try {
            const toolOutput = await this.toolExecutor.execute(decision.tweet, decision.selectedTool);
            toolOutputs.push({
              tweet: decision.tweet,
              tool: decision.selectedTool,
              toolOutput
            });
            // Update status for each processed tool
            agentStatus.tools.processed = toolOutputs.length;
            agentStatus.tools.inProgress = relevantDecisions.length - toolOutputs.length;
          } catch (error) {
            console.error(`Error executing tool ${decision.selectedTool.name}:`, error);
            agentStatus.errors.push({
              timestamp: new Date().toISOString(),
              message: `Error executing ${decision.selectedTool.name}: ${error instanceof Error ? error.message : String(error)}`,
              tweet: decision.tweet.author.username
            });
          }
        }
      }

      // Generate responses
      console.log('Generating responses...');
      agentStatus.responses.total = toolOutputs.length;
      agentStatus.responses.pending = toolOutputs.length;
      
      const responses = await this.responseGenerator.generateResponses(toolOutputs);
      
      // Update status
      agentStatus.responses.generated = responses.length;
      agentStatus.responses.pending = 0;
      
      // Write to CSV
      console.log('Writing responses to CSV...');
      await this.csvWriter.writeResponses(responses);
      
      console.log(`Successfully processed ${responses.length} responses and wrote to ${config.output.csvPath}`);
      
      // Final status update with complete data
      this.updateStatus(tweets, decisions, toolOutputs, responses);
    } catch (error) {
      console.error('Error running marketing agent:', error);
      agentStatus.errors.push({
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

// Run the agent when this file is executed directly
if (require.main === module) {
  // Start the web UI server first
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  startServer(port);
  console.log(`Web interface started at http://localhost:${port}`);
  
  // Then run the agent
  const agent = new MarketingAgent();
  agent.run().catch(error => {
    console.error('Uncaught error running marketing agent:', error);
    agentStatus.errors.push({
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  });
}

export { MarketingAgent };