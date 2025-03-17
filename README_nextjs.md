# Autonomous GPT Marketing Agent (Next.js Version)

A Next.js application that monitors key opinion leader (KOL) tweets, analyzes them using AI, applies marketing tools, and generates contextual responses. Designed for easy deployment on Vercel.

## Features

- **Tweet Collection**: Collect tweets from KOLs with filtering by engagement metrics
- **AI Decision Engine**: Determine tweet relevance and select appropriate tools
- **Tool Execution**: Apply specialized marketing tools to relevant content
- **Response Generation**: Create natural, contextual marketing responses 
- **Web Interface**: Dashboard for running the agent and reviewing results
- **CSV Output**: Export all responses for review and approval

## Getting Started

### Prerequisites

- Node.js 18+
- Twitter API credentials
- OpenAI API key

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/llj0824/autonomous-gpt-marketing-agent.git
   cd autonomous-gpt-marketing-agent
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create .env.local file with your API credentials
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your API keys
   ```

### Development

Run the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Deployment on Vercel

1. Push your repository to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Project Structure

- `src/app/` - Next.js pages and API routes
- `src/components/` - React components
- `src/lib/` - Server-side utilities
- `src/config/` - Configuration and settings
- `src/twitter/` - Twitter client for collecting tweets
- `src/decision-engine/` - AI-based analysis and routing
- `src/tools/` - Marketing tool implementations
- `src/response/` - Response generation from tool outputs
- `src/output/` - CSV output management

## Tools

The agent supports five different marketing tools:

1. **Content Visualizer** - Creates visualizations for content
2. **Research Insight Generator** - Links scientific claims to supporting research
3. **Technical Concept Visualizer** - Creates visualizations for complex concepts
4. **Market Context Analyzer** - Provides market data for crypto/AI mentions
5. **Video Insight Extractor** - Extracts key points from video content

## License

MIT