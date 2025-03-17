import { Scraper, SearchMode, Tweet } from 'agent-twitter-client';
import { TwitterClientConfig, ProcessedTweet, TweetCollectionOptions } from './types';
import { KOL } from '../config/kol-list';

export class TwitterClient {
  private scraper: Scraper;
  private config: TwitterClientConfig;
  private isAuthenticated: boolean = false;

  constructor(config: TwitterClientConfig) {
    this.scraper = new Scraper();
    this.config = config;
  }

  /**
   * Initialize the Twitter client and authenticate
   */
  async initialize(): Promise<boolean> {
    try {
      // Authenticate with Twitter
      await this.scraper.login(
        this.config.username,
        this.config.password,
        this.config.email,
        this.config.apiKey,
        this.config.apiSecretKey,
        this.config.accessToken,
        this.config.accessTokenSecret
      );

      this.isAuthenticated = await this.scraper.isLoggedIn();
      return this.isAuthenticated;
    } catch (error) {
      console.error('Error initializing Twitter client:', error);
      return false;
    }
  }

  /**
   * Collects tweets from a list of KOLs based on the provided options
   */
  async collectTweetsFromKOLs(
    kols: KOL[], 
    options: TweetCollectionOptions
  ): Promise<ProcessedTweet[]> {
    if (!this.isAuthenticated) {
      throw new Error('Twitter client not authenticated');
    }

    const allProcessedTweets: ProcessedTweet[] = [];
    
    for (const kol of kols) {
      console.log(`Collecting tweets for KOL: ${kol.username}`);
      
      try {
        // Get tweets from this KOL
        const tweets = await this.scraper.getTweets(kol.username, options.maxTweetsPerKOL);
        
        // Process and filter tweets
        const processedTweets = await this.processTweets(tweets, options);
        
        allProcessedTweets.push(...processedTweets);
      } catch (error) {
        console.error(`Error collecting tweets for ${kol.username}:`, error);
      }
    }
    
    return allProcessedTweets;
  }

  /**
   * Process raw tweets into a standardized format and filter based on options
   */
  private async processTweets(
    tweets: Tweet[], 
    options: TweetCollectionOptions
  ): Promise<ProcessedTweet[]> {
    const processedTweets: ProcessedTweet[] = [];
    const currentDate = new Date();
    const lookbackDate = new Date(currentDate);
    lookbackDate.setDate(lookbackDate.getDate() - options.lookbackDays);

    for (const tweet of tweets) {
      try {
        // Skip retweets if configured
        if (tweet.isRetweet) {
          continue;
        }

        // Check if tweet is within the lookback period
        const tweetDate = new Date(tweet.date);
        if (tweetDate < lookbackDate) {
          continue;
        }

        // Check if tweet meets minimum engagement
        const totalEngagement = tweet.likes + tweet.retweets;
        if (totalEngagement < options.minEngagement) {
          continue;
        }

        // Extract URLs from tweet content
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const extractedUrls = tweet.text.match(urlRegex) || [];

        // Process media items
        const media = tweet.media?.map(item => {
          const mediaType = this.getMediaType(item.type);
          return {
            type: mediaType,
            url: item.url
          };
        });

        // Create standardized tweet object
        const processedTweet: ProcessedTweet = {
          id: tweet.id,
          url: `https://twitter.com/${tweet.username}/status/${tweet.id}`,
          author: {
            username: tweet.username,
            displayName: tweet.name || tweet.username
          },
          content: tweet.text,
          createdAt: tweetDate,
          metrics: {
            likes: tweet.likes,
            retweets: tweet.retweets,
            replies: tweet.replies
          },
          media: media,
          isRetweet: tweet.isRetweet,
          isReply: tweet.isReply,
          hasLinks: extractedUrls.length > 0,
          extractedUrls: extractedUrls
        };

        processedTweets.push(processedTweet);
      } catch (error) {
        console.error('Error processing tweet:', error);
      }
    }

    return processedTweets;
  }

  /**
   * Maps Twitter media types to standardized types
   */
  private getMediaType(type: string): 'image' | 'video' | 'link' | 'poll' {
    switch (type.toLowerCase()) {
      case 'photo':
        return 'image';
      case 'video':
      case 'animated_gif':
        return 'video';
      case 'poll':
        return 'poll';
      default:
        return 'link';
    }
  }

  /**
   * Get a specific tweet by ID with all data
   */
  async getTweetById(tweetId: string): Promise<ProcessedTweet | null> {
    try {
      const tweet = await this.scraper.getTweet(tweetId);
      if (!tweet) {
        return null;
      }

      // Extract URLs from tweet content
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const extractedUrls = tweet.text.match(urlRegex) || [];

      // Process media items
      const media = tweet.media?.map(item => {
        const mediaType = this.getMediaType(item.type);
        return {
          type: mediaType,
          url: item.url
        };
      });

      // Create standardized tweet object
      return {
        id: tweet.id,
        url: `https://twitter.com/${tweet.username}/status/${tweet.id}`,
        author: {
          username: tweet.username,
          displayName: tweet.name || tweet.username
        },
        content: tweet.text,
        createdAt: new Date(tweet.date),
        metrics: {
          likes: tweet.likes,
          retweets: tweet.retweets,
          replies: tweet.replies
        },
        media: media,
        isRetweet: tweet.isRetweet,
        isReply: tweet.isReply,
        hasLinks: extractedUrls.length > 0,
        extractedUrls: extractedUrls
      };
    } catch (error) {
      console.error('Error fetching tweet by ID:', error);
      return null;
    }
  }
}