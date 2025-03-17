import { config, validateConfig, KOLList, tools } from './config';
import { MockTwitterClient, TweetCollectionOptions } from './twitter';
import { DecisionEngine } from './decision-engine';
import { OpenAIToolExecutor } from './tools';
import { ResponseGenerator } from './response';
import { CSVOutputWriter } from './output';

/**
 * Development version of the Marketing Agent
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

  /**
   * Run the marketing agent pipeline with limited processing
   */
  async run() {
    try {
      console.log('Starting limited marketing agent...');

      // Validate OpenAI API key
      if (!config.openai.apiKey) {
        console.error('Missing OpenAI API key in .env file');
        return;
      }

      // Initialize Twitter client
      console.log('Initializing Twitter client...');
      await this.twitterClient.initialize();

      // Collect tweets from KOLs
      console.log('Collecting tweets from KOLs...');
      const tweetOptions: TweetCollectionOptions = {
        lookbackDays: config.tweetCollection.lookbackDays,
        minEngagement: config.tweetCollection.minEngagement,
        maxTweetsPerKOL: 2 // Limit tweets to process
      };
      
      const tweets = await this.twitterClient.collectTweetsFromKOLs(KOLList, tweetOptions);
      console.log(`Collected ${tweets.length} tweets from KOLs`);

      // Log the collected tweets for inspection
      console.log("Collected tweets:");
      tweets.forEach((tweet, index) => {
        console.log(`${index + 1}. @${tweet.author.username}: ${tweet.content.substring(0, 100)}${tweet.content.length > 100 ? '...' : ''}`);
      });
      
      // Only analyze first 3 tweets to save API usage
      const limitedTweets = tweets.slice(0, 3);
      console.log(`Limited to analyzing ${limitedTweets.length} tweets`);

      // Analyze tweets and make decisions
      console.log('Analyzing tweets and making decisions...');
      const decisions = await this.decisionEngine.analyzeTweets(limitedTweets);
      const relevantDecisions = this.decisionEngine.filterAndRankDecisions(decisions);
      console.log(`Found ${relevantDecisions.length} relevant tweets for tool applications`);

      // Execute tools on relevant tweets (max 1 for test)
      console.log('Executing tools on relevant tweets...');
      const toolOutputs = [];
      for (const decision of relevantDecisions.slice(0, 1)) {
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
      
      // Log a sample response for review
      if (responses.length > 0) {
        console.log('\nSample Response:');
        console.log('Original Tweet:', responses[0].tweet.content);
        console.log('Tool Used:', responses[0].tool.name);
        console.log('Response:', responses[0].responseText);
      }
    } catch (error) {
      console.error('Error running marketing agent:', error);
    }
  }
}

// Run the agent when this file is executed directly
if (require.main === module) {
  const agent = new LimitedMarketingAgent();
  agent.run().catch(error => {
    console.error('Uncaught error running limited marketing agent:', error);
    process.exit(1);
  });
}

export { LimitedMarketingAgent };