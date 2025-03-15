# Twitter Client for Autonomous Marketing Agent

## Overview

This Twitter client is part of a larger autonomous marketing agent system, designed to automate Twitter/X interactions using AI. The client provides a comprehensive set of features for managing Twitter accounts, including posting tweets, responding to mentions, searching for relevant content, and even hosting Twitter Spaces.

## Architecture

The client is built with a modular architecture, consisting of several specialized components:

- **Base Client (`ClientBase`)**: Handles core Twitter operations like authentication, session management, and API interactions.
- **Post Client (`TwitterPostClient`)**: Manages autonomous tweet generation and posting.
- **Interaction Client (`TwitterInteractionClient`)**: Handles mentions, replies, and other user interactions.
- **Search Client (`TwitterSearchClient`)**: Searches for relevant tweets and can engage with them.
- **Space Client (`TwitterSpaceClient`)**: Creates and manages Twitter Spaces (audio conversations).

## Key Features

### Authentication and Session Management
- Supports email/password login
- Handles 2FA authentication
- Cookie-based session persistence

### Autonomous Posting
- AI-generated tweet content based on agent personality
- Scheduled posting with configurable intervals
- Support for media attachments
- Optional approval workflow via Discord

### Interaction Handling
- Automatic detection and response to mentions
- Conversation threading and context awareness
- Smart filtering of spam/irrelevant mentions

### Content Search
- Keyword-based tweet search
- Engagement with relevant content
- Configurable search parameters and rate limiting

### Twitter Spaces
- Automated Space creation and management
- Speaker queue management
- Text-to-speech and speech-to-text integration
- Filler content generation during quiet periods

## Configuration Options

The client is highly configurable through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `TWITTER_DRY_RUN` | Run without actually posting tweets | `false` |
| `TWITTER_USERNAME` | Twitter/X username | Required |
| `TWITTER_PASSWORD` | Twitter/X password | Required |
| `TWITTER_EMAIL` | Twitter/X email | Required |
| `MAX_TWEET_LENGTH` | Maximum tweet length | 280 |
| `TWITTER_SEARCH_ENABLE` | Enable search functionality | `false` |
| `TWITTER_2FA_SECRET` | 2FA secret for authentication | "" |
| `TWITTER_RETRY_LIMIT` | Number of retries for failed operations | 5 |
| `TWITTER_POLL_INTERVAL` | Interval between polling for new mentions (seconds) | 120 |
| `TWITTER_TARGET_USERS` | Comma-separated list of users to target | [] |
| `POST_INTERVAL_MIN` | Minimum interval between posts (minutes) | 90 |
| `POST_INTERVAL_MAX` | Maximum interval between posts (minutes) | 180 |
| `ENABLE_ACTION_PROCESSING` | Enable processing of timeline actions | `false` |
| `ACTION_INTERVAL` | Interval between action processing (minutes) | 5 |
| `POST_IMMEDIATELY` | Post tweets immediately without scheduling | `false` |
| `TWITTER_SPACES_ENABLE` | Enable Twitter Spaces functionality | `false` |
| `MAX_ACTIONS_PROCESSING` | Maximum number of actions to process at once | 1 |
| `ACTION_TIMELINE_TYPE` | Type of timeline to process for actions | "ForYou" |

## Safety Features

- Rate limiting to prevent API abuse
- Exponential backoff for failed requests
- Content filtering to prevent spam
- Dry run mode for testing without posting

## Integration

The client integrates with the ElizaOS framework, providing:

- AI-powered content generation
- Memory and state management
- Image description services
- Transcription services for Spaces

## Warning

The search functionality includes warnings about:
1. Potentially violating consent of random users
2. Burning rate limits
3. Risking account bans

Use this feature with caution and in accordance with Twitter's terms of service.

## Dependencies

- `agent-twitter-client`: Core Twitter API interaction
- `@elizaos/core`: AI agent framework
- `discord.js`: For approval workflow (optional)
- Various Node.js standard libraries

## Usage

This client is designed to be used as part of the larger autonomous marketing agent system. It exposes a standard interface that can be initialized with the appropriate configuration.

```typescript
import { TwitterClientInterface } from './client-twitter/src';

// The client will be initialized with the agent runtime
const twitterClient = await TwitterClientInterface.start(agentRuntime);
```

## License

This project is proprietary software and part of the autonomous-gpt-marketing-agent system. 