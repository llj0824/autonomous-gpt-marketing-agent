import { TwitterClientConfig, ProcessedTweet, TweetCollectionOptions } from './types';
import { KOL } from '../config/kol-list';
import fs from 'fs';
import path from 'path';

/**
 * Mock Twitter client for development without actual Twitter API
 * Uses stored real Twitter data when available, falls back to mock data
 */
export class MockTwitterClient {
  private config: TwitterClientConfig;
  private isAuthenticated: boolean = false;
  private mockTweets: Map<string, ProcessedTweet[]> = new Map();
  private storageDir: string;

  constructor(config: TwitterClientConfig) {
    this.config = config;
    this.storageDir = path.join(__dirname, 'storage');
    this.initializeMockData();
    
    // Log if we have any stored real tweets
    this.logAvailableStoredData();
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
        content: "Remote work is becoming the default for tech companies. I've collected data on 3,000+ companies hiring remote workers in the last year and the trend is accelerating.",
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
   * Log available stored real data
   */
  private logAvailableStoredData(): void {
    try {
      if (!fs.existsSync(this.storageDir)) {
        console.log('No stored Twitter data available yet. Will use mock data.');
        return;
      }
      
      const files = fs.readdirSync(this.storageDir);
      if (files.length === 0) {
        console.log('No stored Twitter data available yet. Will use mock data.');
        return;
      }
      
      // Group files by username
      const userFiles: Record<string, string[]> = {};
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const username = file.split('_')[0];
          if (!userFiles[username]) {
            userFiles[username] = [];
          }
          userFiles[username].push(file);
        }
      }
      
      console.log('Available stored Twitter data:');
      for (const [username, files] of Object.entries(userFiles)) {
        console.log(`- ${username}: ${files.length} file(s)`);
      }
    } catch (error) {
      console.error('Error checking stored data:', error);
    }
  }
  
  /**
   * Get stored tweets for a specific KOL
   */
  private getStoredTweets(username: string): ProcessedTweet[] {
    try {
      if (!fs.existsSync(this.storageDir)) {
        return [];
      }
      
      const files = fs.readdirSync(this.storageDir);
      const userFiles = files.filter(file => 
        file.startsWith(`${username.toLowerCase()}_`) && file.endsWith('.json')
      );
      
      if (userFiles.length === 0) {
        return [];
      }
      
      // Sort files by date (newest first) and take the most recent file
      userFiles.sort().reverse();
      const mostRecentFile = userFiles[0];
      const filePath = path.join(this.storageDir, mostRecentFile);
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const storedTweets = JSON.parse(fileContent) as any[];
      
      // Convert dates back to Date objects
      return storedTweets.map(tweet => ({
        ...tweet,
        createdAt: new Date(tweet.createdAt)
      }));
    } catch (error) {
      console.error(`Error getting stored tweets for ${username}:`, error);
      return [];
    }
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
      // First try to get real stored tweets
      const storedTweets = this.getStoredTweets(kol.username);
      
      if (storedTweets.length > 0) {
        console.log(`Using ${storedTweets.length} real stored tweets for @${kol.username}`);
        allTweets.push(...storedTweets);
      } else {
        // Fall back to mock tweets if no stored data
        console.log(`No stored tweets found for @${kol.username}, using mock data`);
        const mockTweets = this.mockTweets.get(kol.username.toLowerCase()) || [];
        allTweets.push(...mockTweets);
      }
    }

    return allTweets;
  }

  /**
   * Get a specific tweet by ID
   */
  async getTweetById(tweetId: string): Promise<ProcessedTweet | null> {
    // First, try to find the tweet in stored real data
    try {
      if (fs.existsSync(this.storageDir)) {
        const files = fs.readdirSync(this.storageDir);
        
        // Check specific tweet files first
        const tweetFiles = files.filter(file => file.startsWith(`tweet_${tweetId}_`));
        
        if (tweetFiles.length > 0) {
          const filePath = path.join(this.storageDir, tweetFiles[0]);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const storedTweets = JSON.parse(fileContent) as any[];
          
          if (storedTweets.length > 0) {
            return {
              ...storedTweets[0],
              createdAt: new Date(storedTweets[0].createdAt)
            };
          }
        }
        
        // If not found in specific files, check all KOL files
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const filePath = path.join(this.storageDir, file);
              const fileContent = fs.readFileSync(filePath, 'utf-8');
              const storedTweets = JSON.parse(fileContent) as any[];
              
              const matchingTweet = storedTweets.find(tweet => tweet.id === tweetId);
              if (matchingTweet) {
                return {
                  ...matchingTweet,
                  createdAt: new Date(matchingTweet.createdAt)
                };
              }
            } catch (err) {
              // Continue to next file
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error searching for stored tweet ${tweetId}:`, error);
    }
    
    // If not found in stored data, fall back to mock data
    for (const tweets of this.mockTweets.values()) {
      const tweet = tweets.find(t => t.id === tweetId);
      if (tweet) {
        return tweet;
      }
    }
    
    return null;
  }
}