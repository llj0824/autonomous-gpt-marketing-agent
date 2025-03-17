import { config, validateConfig, KOLList, tools } from './config';
import { MockTwitterClient, TweetCollectionOptions } from './twitter';
import { DecisionEngine } from './decision-engine';
import { OpenAIToolExecutor } from './tools';
import { ResponseGenerator } from './response';
import { CSVOutputWriter } from './output';
import { startServer } from './ui/server';
import { agentStatus } from './index';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Development version of the Marketing Agent with mock data
 */
class LimitedMarketingAgent {
  private twitterClient: MockTwitterClient;
  private decisionEngine: DecisionEngine;
  private toolExecutor: OpenAIToolExecutor;
  private responseGenerator: ResponseGenerator;
  private csvWriter: CSVOutputWriter;

  constructor() {
    // Initialize Mock Twitter client
    this.twitterClient = new MockTwitterClient({
      username: config.twitter.username,
      password: config.twitter.password,
      email: config.twitter.email,
      proxyUrl: config.twitter.proxyUrl,
      apiKey: config.twitter.apiKey,
      apiSecretKey: config.twitter.apiSecretKey,
      accessToken: config.twitter.accessToken,
      accessTokenSecret: config.twitter.accessTokenSecret
    });

    // Initialize decision engine with very low threshold for testing
    this.decisionEngine = new DecisionEngine({
      openaiApiKey: config.openai.apiKey,
      model: config.openai.model,
      relevanceThreshold: 10 // Very low relevance threshold for testing (0-100)
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

  // Update status metrics for the UI
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
   * Run the marketing agent pipeline with limited processing
   */
  async run(): Promise<void> {
    try {
      console.log('Starting limited marketing agent (MOCK MODE)...');

      // Validate OpenAI API key
      if (!config.openai.apiKey) {
        console.error('Missing OpenAI API key in .env file');
        return;
      }

      // Initialize Twitter client
      console.log('Initializing Twitter client (MOCK)...');
      await this.twitterClient.initialize();

      // Collect tweets from KOLs
      console.log('Collecting tweets from KOLs (MOCK DATA)...');
      const tweetOptions: TweetCollectionOptions = {
        lookbackDays: config.tweetCollection.lookbackDays,
        minEngagement: config.tweetCollection.minEngagement,
        maxTweetsPerKOL: 2 // Limit tweets to process
      };
      
      const tweets = await this.twitterClient.collectTweetsFromKOLs(KOLList, tweetOptions);
      console.log(`Collected ${tweets.length} mock tweets from KOLs`);
      
      // Update status for UI
      agentStatus.tweets.total = tweets.length;
      agentStatus.tweets.pending = tweets.length;

      // Log the collected tweets for inspection
      console.log("Collected tweets:");
      tweets.forEach((tweet, index) => {
        console.log(`${index + 1}. @${tweet.author.username}: ${tweet.content.substring(0, 100)}${tweet.content.length > 100 ? '...' : ''}`);
      });
      
      // Only analyze first 3 tweets to save API usage
      const limitedTweets = tweets.slice(0, 3);
      console.log(`Limited to analyzing ${limitedTweets.length} tweets (MOCK MODE)`);

      // Analyze tweets and make decisions
      console.log('Analyzing tweets and making decisions...');
      
      // Add some delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const decisions = await this.decisionEngine.analyzeTweets(limitedTweets);
      const relevantDecisions = this.decisionEngine.filterAndRankDecisions(decisions);
      console.log(`Found ${relevantDecisions.length} relevant tweets for tool applications`);
      
      // Update status for UI
      agentStatus.tweets.processed = tweets.length;
      agentStatus.tweets.pending = 0;
      agentStatus.decisions.total = decisions.length;
      agentStatus.decisions.matched = relevantDecisions.length;
      agentStatus.decisions.rejected = decisions.length - relevantDecisions.length;
      agentStatus.tools.total = relevantDecisions.length;
      agentStatus.tools.inProgress = relevantDecisions.length;

      // Execute tools on relevant tweets (max 2 for test)
      console.log('Executing tools on relevant tweets...');
      const toolOutputs = [];
      for (const decision of relevantDecisions.slice(0, 2)) {
        if (decision.selectedTool) {
          console.log(`Applying ${decision.selectedTool.name} to tweet from @${decision.tweet.author.username}`);
          try {
            // Add some delay to simulate processing
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const toolOutput = await this.toolExecutor.execute(decision.tweet, decision.selectedTool);
            toolOutputs.push({
              tweet: decision.tweet,
              tool: decision.selectedTool,
              toolOutput
            });
            
            // Update status for each processed tool
            agentStatus.tools.processed = toolOutputs.length;
            agentStatus.tools.inProgress = Math.min(relevantDecisions.length, 2) - toolOutputs.length;
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
      
      // Add some delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const responses = await this.responseGenerator.generateResponses(toolOutputs);
      
      // Update status
      agentStatus.responses.generated = responses.length;
      agentStatus.responses.pending = 0;
      
      // Write to CSV
      console.log('Writing responses to CSV...');
      await this.csvWriter.writeResponses(responses);
      
      console.log(`Successfully processed ${responses.length} responses and wrote to ${config.output.csvPath}`);
      
      // Log a sample response for review
      if (responses.length > 0) {
        console.log('\nSample Response:');
        console.log('Original Tweet:', responses[0].tweet.content);
        console.log('Tool Used:', responses[0].tool.name);
        console.log('Response:', responses[0].responseText);
      }
      
      // Final status update
      this.updateStatus(tweets, decisions, toolOutputs, responses);
      
      // Keep the process running to serve the UI
      console.log('\nMock processing complete. Web interface is running at http://localhost:3000');
      console.log('Press Ctrl+C to exit...');
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
  
  // Then run the agent with mock data
  const agent = new LimitedMarketingAgent();
  agent.run().catch(error => {
    console.error('Uncaught error running limited marketing agent:', error);
    agentStatus.errors.push({
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : String(error)
    });
    // Don't exit so web server can keep running
    console.log('Error in processing, but web interface is still available');
  });
}

export { LimitedMarketingAgent };