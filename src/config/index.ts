import dotenv from 'dotenv';
import { KOLList } from './kol-list';
import { tools } from './tools';

// Load environment variables
dotenv.config();

// Application config
export const config = {
  // Twitter config
  twitter: {
    username: process.env.TWITTER_USERNAME || '',
    password: process.env.TWITTER_PASSWORD || '',
    email: process.env.TWITTER_EMAIL || '',
    proxyUrl: process.env.PROXY_URL,
    apiKey: process.env.TWITTER_API_KEY || '',
    apiSecretKey: process.env.TWITTER_API_SECRET_KEY || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || '',
  },
  
  // OpenAI config
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4o', // Default model
  },
  
  // Tweet collection config
  tweetCollection: {
    lookbackDays: 1, // How many days back to look for tweets
    minEngagement: 1000, // Minimum likes/retweets to consider a tweet
    maxTweetsPerKOL: 5, // Maximum tweets to process per KOL
  },
  
  // CSV output config
  output: {
    csvPath: './output/responses.csv',
  }
};

// Export KOL list and tools
export { KOLList, tools };

// Validate required configuration
export function validateConfig(): string[] {
  const errors: string[] = [];
  
  // Check Twitter credentials
  if (!config.twitter.username || !config.twitter.password || !config.twitter.email) {
    errors.push('Missing Twitter authentication credentials');
  }
  
  // Check OpenAI API key
  if (!config.openai.apiKey) {
    errors.push('Missing OpenAI API key');
  }
  
  return errors;
}