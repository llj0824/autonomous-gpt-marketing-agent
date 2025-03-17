# Autonomous Marketing Agent - Development Guide

## Development Commands

### Setup Environment
```bash
# Install dependencies
npm install

# Create .env file from example
cp .env.example .env
# Then edit .env with your credentials
```

### Build and Run
```bash
# Build TypeScript
npm run build

# Run the application with real Twitter integration
npm start

# Run with limited API usage (for testing)
npm run mock

# For development (runs with ts-node)
npm run dev
```

## Application Components

### Tweet Collection (src/twitter/)
- `client.ts`: Twitter client that authenticates and fetches tweets from KOLs
- Handles tweet filtering by engagement metrics and date
- Currently having intermittent authentication issues with Twitter API

### Decision Engine (src/decision-engine/)
- LLM-based analysis to determine tweet relevance
- Evaluates which tool would be most appropriate for each tweet
- Assigns relevance scores (0-100) to prioritize responses
- Uses OpenAI API for content analysis

### Tool Execution (src/tools/)
- Framework for five different tool demonstrations:
  1. Content Visualizer - Creates visualizations for content
  2. Research Insight Generator - Links scientific claims to supporting research
  3. Technical Concept Visualizer - Creates visualizations for complex concepts
  4. Market Context Analyzer - Provides market data for crypto/AI mentions
  5. Video Insight Extractor - Extracts key points from video content
- All tool execution is handled through OpenAI API

### Response Generation (src/response/)
- Creates natural-sounding marketing responses
- Incorporates tool outputs into contextual replies
- Maintains helpful tone without being overtly promotional
- Limits responses to Twitter's character constraints

### CSV Output (src/output/)
- Writes generated responses to CSV for review
- Includes full context with original tweet and reasoning
- Tracks status (pending/approved/rejected)
- Supports human review workflow

## Project Structure

- `src/config/` - Configuration and settings
- `src/twitter/` - Twitter client and tweet collection
- `src/decision-engine/` - LLM-based routing logic
- `src/tools/` - Tool implementation for different demonstrations
- `src/response/` - Response generation from tool outputs
- `src/output/` - CSV output management

## Workflow

1. The agent collects tweets from the configured list of KOLs
2. Each tweet is analyzed by the decision engine to determine:
   - If it's suitable for a response
   - Which tool would be most appropriate
   - A relevance score
3. For suitable tweets, the selected tool is applied
4. A natural-sounding response is generated based on the tool output
5. Results are written to a CSV file for human review

## Key Configuration Files

- `kol-list.ts` - Configure which Twitter accounts to monitor
- `tools.ts` - Define the tools available for demonstrations
- `.env` - Twitter API keys and other sensitive configuration

## Known Issues

- Twitter authentication is intermittent - sometimes fails on first attempt
- Twitter username handling needs improvement
- Need to fine-tune relevance thresholds for better tool matching

## Next Steps

1. Fix Twitter authentication issues
2. Test with real KOL tweets to validate decision engine
3. Fine-tune OpenAI prompts for better content analysis
4. Consider adding a review interface for approving responses

## Adding New Tools

1. Add a new tool definition in `src/config/tools.ts`
2. The tool execution logic in `src/tools/executor.ts` handles all tools automatically through OpenAI