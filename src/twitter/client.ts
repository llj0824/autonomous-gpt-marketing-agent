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
      console.log('Attempting to login with:', { 
        username: this.config.username,
        email: this.config.email,
        hasPassword: !!this.config.password,
        hasApiKey: !!this.config.apiKey
      });
      
      // Authenticate with Twitter
      await this.scraper.login(
        this.config.username,
        this.config.password,
        this.config.email
      );

      this.isAuthenticated = await this.scraper.isLoggedIn();
      console.log('Login successful:', this.isAuthenticated);
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
        // Get tweets generator from this KOL
        const tweetsGenerator = this.scraper.getTweets(kol.username, options.maxTweetsPerKOL);
        
        // Convert AsyncGenerator to array of tweets
        const tweets: Tweet[] = [];
        for await (const tweet of tweetsGenerator) {
          tweets.push(tweet);
          if (tweets.length >= options.maxTweetsPerKOL) {
            break;
          }
        }
        
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

        // Check if tweet is within the lookback period (using timestamp or timeParsed)
        const tweetDate = tweet.timeParsed || (tweet.timestamp ? new Date(tweet.timestamp) : new Date());
        if (tweetDate < lookbackDate) {
          continue;
        }

        // Check if tweet meets minimum engagement
        const likes = tweet.likes || 0;
        const retweets = tweet.retweets || 0;
        const totalEngagement = likes + retweets;
        if (totalEngagement < options.minEngagement) {
          continue;
        }

        // Extract URLs from tweet content
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const tweetText = tweet.text || '';
        const extractedUrls = tweetText.match(urlRegex) || [];

        // Process media items
        const media = tweet.photos?.map(photo => ({
          type: 'image' as const,
          url: photo.url
        })) || [];

        // Create standardized tweet object
        const processedTweet: ProcessedTweet = {
          id: tweet.id || '',
          url: tweet.permanentUrl || `https://twitter.com/i/status/${tweet.id || ''}`,
          author: {
            username: tweet.userId || '',
            displayName: tweet.name || tweet.userId || ''
          },
          content: tweetText,
          createdAt: tweetDate,
          metrics: {
            likes: likes,
            retweets: retweets,
            replies: tweet.replies || 0
          },
          media: media,
          isRetweet: !!tweet.isRetweet,
          isReply: !!tweet.isReply,
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
      const tweetText = tweet.text || '';
      const extractedUrls = tweetText.match(urlRegex) || [];

      // Process media items
      const media = tweet.photos?.map(photo => ({
        type: 'image' as const,
        url: photo.url
      })) || [];

      // Create standardized tweet object
      return {
        id: tweet.id || '',
        url: tweet.permanentUrl || `https://twitter.com/i/status/${tweet.id || ''}`,
        author: {
          username: tweet.userId || '',
          displayName: tweet.name || tweet.userId || ''
        },
        content: tweetText,
        createdAt: tweet.timeParsed || (tweet.timestamp ? new Date(tweet.timestamp) : new Date()),
        metrics: {
          likes: tweet.likes || 0,
          retweets: tweet.retweets || 0,
          replies: tweet.replies || 0
        },
        media: media,
        isRetweet: !!tweet.isRetweet,
        isReply: !!tweet.isReply,
        hasLinks: extractedUrls.length > 0,
        extractedUrls: extractedUrls
      };
    } catch (error) {
      console.error('Error fetching tweet by ID:', error);
      return null;
    }
  }
}