import { config, validateConfig, KOLList, tools } from './config';
import { TwitterClient, TweetCollectionOptions } from './twitter';
import { DecisionEngine } from './decision-engine';
import { OpenAIToolExecutor } from './tools';
import { ResponseGenerator } from './response';
import { CSVOutputWriter } from './output';

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

  /**
   * Run the entire marketing agent pipeline
   */
  async run() {
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

      if (tweets.length === 0) {
        console.log('No tweets collected, exiting');
        return;
      }

      // Analyze tweets and make decisions
      console.log('Analyzing tweets and making decisions...');
      const decisions = await this.decisionEngine.analyzeTweets(tweets);
      const relevantDecisions = this.decisionEngine.filterAndRankDecisions(decisions);
      console.log(`Found ${relevantDecisions.length} relevant tweets for tool applications`);

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
          const toolOutput = await this.toolExecutor.execute(decision.tweet, decision.selectedTool);
          toolOutputs.push({
            tweet: decision.tweet,
            tool: decision.selectedTool,
            toolOutput
          });
        }
      }

      // Generate responses
      console.log('Generating responses...');
      const responses = await this.responseGenerator.generateResponses(toolOutputs);
      
      // Write to CSV
      console.log('Writing responses to CSV...');
      await this.csvWriter.writeResponses(responses);
      
      console.log(`Successfully processed ${responses.length} responses and wrote to ${config.output.csvPath}`);
    } catch (error) {
      console.error('Error running marketing agent:', error);
    }
  }
}

// Run the agent when this file is executed directly
if (require.main === module) {
  const agent = new MarketingAgent();
  agent.run().catch(error => {
    console.error('Uncaught error running marketing agent:', error);
    process.exit(1);
  });
}

export { MarketingAgent };