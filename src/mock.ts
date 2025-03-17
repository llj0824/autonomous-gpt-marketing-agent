import { config, validateConfig, KOLList, tools } from './config';
import { MockTwitterClient, TweetCollectionOptions } from './twitter';
import { DecisionEngine } from './decision-engine';
import { OpenAIToolExecutor } from './tools';
import { ResponseGenerator } from './response';
import { CSVOutputWriter } from './output';

/**
 * Development version of the Marketing Agent using mock data
 */
class MockMarketingAgent {
  private twitterClient: MockTwitterClient;
  private decisionEngine: DecisionEngine;
  private toolExecutor: OpenAIToolExecutor;
  private responseGenerator: ResponseGenerator;
  private csvWriter: CSVOutputWriter;

  constructor() {
    // Initialize Twitter client with mock data
    this.twitterClient = new MockTwitterClient({
      username: config.twitter.username,
      password: config.twitter.password,
      email: config.twitter.email
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
   * Run the mock marketing agent pipeline
   */
  async run() {
    try {
      console.log('Starting mock marketing agent for development...');

      // Validate OpenAI API key
      if (!config.openai.apiKey) {
        console.error('Missing OpenAI API key in .env file');
        return;
      }

      // Initialize Twitter mock client
      console.log('Initializing mock Twitter client...');
      await this.twitterClient.initialize();

      // Collect mock tweets from KOLs
      console.log('Collecting mock tweets from KOLs...');
      const tweetOptions: TweetCollectionOptions = {
        lookbackDays: config.tweetCollection.lookbackDays,
        minEngagement: config.tweetCollection.minEngagement,
        maxTweetsPerKOL: config.tweetCollection.maxTweetsPerKOL
      };
      
      const tweets = await this.twitterClient.collectTweetsFromKOLs(KOLList, tweetOptions);
      console.log(`Collected ${tweets.length} mock tweets from KOLs`);

      // Analyze tweets and make decisions
      console.log('Analyzing tweets and making decisions...');
      const decisions = await this.decisionEngine.analyzeTweets(tweets);
      const relevantDecisions = this.decisionEngine.filterAndRankDecisions(decisions);
      console.log(`Found ${relevantDecisions.length} relevant tweets for tool applications`);

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
      console.error('Error running mock marketing agent:', error);
    }
  }
}

// Run the mock agent when this file is executed directly
if (require.main === module) {
  const agent = new MockMarketingAgent();
  agent.run().catch(error => {
    console.error('Uncaught error running mock marketing agent:', error);
    process.exit(1);
  });
}

export { MockMarketingAgent };