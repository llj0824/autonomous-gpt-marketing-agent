import { config as originalConfig, validateConfig, KOLList, tools } from '../config';

// Server-side only config
export function getServerConfig() {
  return {
    ...originalConfig,
    // Override values from environment variables
    twitter: {
      ...originalConfig.twitter,
      username: process.env.TWITTER_USERNAME || originalConfig.twitter.username,
      password: process.env.TWITTER_PASSWORD || originalConfig.twitter.password,
      email: process.env.TWITTER_EMAIL || originalConfig.twitter.email,
      proxyUrl: process.env.TWITTER_PROXY_URL || originalConfig.twitter.proxyUrl,
      apiKey: process.env.TWITTER_API_KEY || originalConfig.twitter.apiKey,
      apiSecretKey: process.env.TWITTER_API_SECRET_KEY || originalConfig.twitter.apiSecretKey,
      accessToken: process.env.TWITTER_ACCESS_TOKEN || originalConfig.twitter.accessToken,
      accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || originalConfig.twitter.accessTokenSecret
    },
    openai: {
      ...originalConfig.openai,
      apiKey: process.env.OPENAI_API_KEY || originalConfig.openai.apiKey
    },
    output: {
      ...originalConfig.output,
      csvPath: process.env.OUTPUT_CSV_PATH || originalConfig.output.csvPath
    }
  };
}

// Client-safe config (no secrets)
export function getPublicConfig() {
  return {
    tweetCollection: originalConfig.tweetCollection,
    kolCount: KOLList.length,
    toolCount: tools.length,
    tools: tools.map(tool => ({
      id: tool.id,
      name: tool.name,
      description: tool.description
    }))
  };
}

export { validateConfig, KOLList, tools };