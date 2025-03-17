/**
 * Types for the Twitter module
 */

// Represents a processed tweet with metadata
export interface ProcessedTweet {
  id: string;
  url: string;
  author: {
    username: string;
    displayName: string;
  };
  content: string;
  createdAt: Date;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
  };
  media?: {
    type: 'image' | 'video' | 'link' | 'poll';
    url?: string;
  }[];
  isRetweet: boolean;
  isReply: boolean;
  hasLinks: boolean;
  extractedUrls: string[];
}

// Twitter client configuration
export interface TwitterClientConfig {
  username: string;
  password: string;
  email: string;
  proxyUrl?: string | undefined;
  apiKey?: string;
  apiSecretKey?: string;
  accessToken?: string;
  accessTokenSecret?: string;
}

// Tweet collection options
export interface TweetCollectionOptions {
  lookbackDays: number;
  minEngagement: number;
  maxTweetsPerKOL: number;
}