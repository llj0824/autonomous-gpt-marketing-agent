import { TwitterClientConfig, ProcessedTweet, TweetCollectionOptions } from './types';
import { KOL } from '../config/kol-list';

/**
 * Mock Twitter client for development without actual Twitter API
 */
export class MockTwitterClient {
  private config: TwitterClientConfig;
  private isAuthenticated: boolean = false;
  private mockTweets: Map<string, ProcessedTweet[]> = new Map();

  constructor(config: TwitterClientConfig) {
    this.config = config;
    this.initializeMockData();
  }

  /**
   * Initialize with mock tweet data
   */
  private initializeMockData(): void {
    // Mock tweets for hubermanlab
    this.mockTweets.set('hubermanlab', [
      {
        id: '1',
        url: 'https://twitter.com/hubermanlab/status/1',
        author: {
          username: 'hubermanlab',
          displayName: 'Andrew Huberman'
        },
        content: 'New research shows that getting sunlight exposure in the morning can significantly improve sleep quality and boost cognitive function throughout the day.',
        createdAt: new Date(),
        metrics: {
          likes: 1250,
          retweets: 430,
          replies: 78
        },
        isRetweet: false,
        isReply: false,
        hasLinks: false,
        extractedUrls: []
      },
      {
        id: '2',
        url: 'https://twitter.com/hubermanlab/status/2',
        author: {
          username: 'hubermanlab',
          displayName: 'Andrew Huberman'
        },
        content: 'Just released: my conversation with Dr. Matthew Walker on the latest research about sleep, dreams, and how to optimize your rest for better health and performance. Watch here: https://youtu.be/example',
        createdAt: new Date(),
        metrics: {
          likes: 2430,
          retweets: 578,
          replies: 102
        },
        media: [
          {
            type: 'image',
            url: 'https://example.com/image.jpg'
          }
        ],
        isRetweet: false,
        isReply: false,
        hasLinks: true,
        extractedUrls: ['https://youtu.be/example']
      }
    ]);

    // Mock tweets for naval
    this.mockTweets.set('naval', [
      {
        id: '3',
        url: 'https://twitter.com/naval/status/3',
        author: {
          username: 'naval',
          displayName: 'Naval'
        },
        content: 'Wealth is assets that earn while you sleep. Money is how we transfer time and wealth. Status is your position in the social hierarchy.',
        createdAt: new Date(),
        metrics: {
          likes: 5430,
          retweets: 1245,
          replies: 321
        },
        isRetweet: false,
        isReply: false,
        hasLinks: false,
        extractedUrls: []
      },
      {
        id: '4',
        url: 'https://twitter.com/naval/status/4',
        author: {
          username: 'naval',
          displayName: 'Naval'
        },
        content: 'Reading is faster than listening. Doing is faster than watching. Looking something up is faster than remembering it.',
        createdAt: new Date(),
        metrics: {
          likes: 7890,
          retweets: 2345,
          replies: 432
        },
        isRetweet: false,
        isReply: false,
        hasLinks: false,
        extractedUrls: []
      }
    ]);

    // Mock tweets for levelsio
    this.mockTweets.set('levelsio', [
      {
        id: '5',
        url: 'https://twitter.com/levelsio/status/5',
        author: {
          username: 'levelsio',
          displayName: 'Pieter Levels'
        },
        content: 'Just launched a new feature on Nomad List that shows real-time air quality data for 1,200+ cities around the world. Check it out here: https://nomadlist.com',
        createdAt: new Date(),
        metrics: {
          likes: 980,
          retweets: 213,
          replies: 87
        },
        isRetweet: false,
        isReply: false,
        hasLinks: true,
        extractedUrls: ['https://nomadlist.com']
      },
      {
        id: '6',
        url: 'https://twitter.com/levelsio/status/6',
        author: {
          username: 'levelsio',
          displayName: 'Pieter Levels'
        },
        content: 'Remote work is becoming the default for tech companies. I've collected data on 3,000+ companies hiring remote workers in the last year and the trend is accelerating.',
        createdAt: new Date(),
        metrics: {
          likes: 1543,
          retweets: 321,
          replies: 95
        },
        isRetweet: false,
        isReply: false,
        hasLinks: false,
        extractedUrls: []
      }
    ]);
  }

  /**
   * Initialize client
   */
  async initialize(): Promise<boolean> {
    console.log('Mock Twitter client initialized');
    this.isAuthenticated = true;
    return true;
  }

  /**
   * Collects tweets from a list of KOLs
   */
  async collectTweetsFromKOLs(
    kols: KOL[],
    options: TweetCollectionOptions
  ): Promise<ProcessedTweet[]> {
    if (!this.isAuthenticated) {
      throw new Error('Mock Twitter client not authenticated');
    }

    const allTweets: ProcessedTweet[] = [];
    
    for (const kol of kols) {
      console.log(`Collecting mock tweets for KOL: ${kol.username}`);
      
      const kolTweets = this.mockTweets.get(kol.username.toLowerCase()) || [];
      allTweets.push(...kolTweets);
    }

    return allTweets;
  }

  /**
   * Get a specific tweet by ID
   */
  async getTweetById(tweetId: string): Promise<ProcessedTweet | null> {
    for (const tweets of this.mockTweets.values()) {
      const tweet = tweets.find(t => t.id === tweetId);
      if (tweet) {
        return tweet;
      }
    }
    return null;
  }
}