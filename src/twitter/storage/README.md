# Twitter Data Storage

This directory stores cached Twitter data from previous API calls. The files are used for:

1. Reducing API usage during development
2. Creating consistent test data for debugging
3. Fallback data when API calls fail
4. Avoiding rate limits with Twitter's API

## File Formats

There are two main types of files stored here:

1. **KOL tweet collections**: `username_YYYY-MM-DDThh-mm-ss.json`
   - Contains a collection of tweets from a specific KOL
   - Timestamp format is ISO 8601 with special characters replaced by hyphens

2. **Individual tweets**: `tweet_[tweetId]_YYYY-MM-DDThh-mm-ss.json`
   - Contains a single tweet retrieved by ID
   - Includes all metadata for the tweet

## Data Flow

The Twitter client will:
1. First check for cached data within the lookback period
2. If no recent data is found, call the Twitter API
3. Store API responses in this directory for future use
4. Use cached data as fallback if API calls fail

## Usage Notes

- The mock client will use this real data when available
- Always prefer cached data over making new API calls
- Data is automatically rotated based on collection dates