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

# Run with mock data (recommended for development)
npm run mock

# For development (runs with ts-node)
npm run dev
```

### Project Structure

- `src/config/` - Configuration and settings
- `src/twitter/` - Twitter client and tweet collection
- `src/decision-engine/` - LLM-based routing logic
- `src/tools/` - Tool implementation for different demonstrations
- `src/response/` - Response generation from tool outputs
- `src/output/` - CSV output management

### Workflow

1. The agent collects tweets from the configured list of KOLs
2. Each tweet is analyzed by the decision engine to determine:
   - If it's suitable for a response
   - Which tool would be most appropriate
   - A relevance score
3. For suitable tweets, the selected tool is applied
4. A natural-sounding response is generated based on the tool output
5. Results are written to a CSV file for human review

### Key Configuration Files

- `kol-list.ts` - Configure which Twitter accounts to monitor
- `tools.ts` - Define the tools available for demonstrations
- `.env` - Twitter API keys and other sensitive configuration

### Development with Mock Data

For development without needing actual Twitter credentials:
1. Make sure you still have an OpenAI API key in your `.env` file
2. Run `npm run mock` to use the mock Twitter client
3. Mock tweets are predefined in `src/twitter/mock-client.ts`
4. The mock version will still generate real tool outputs using OpenAI

### Adding New Tools

1. Add a new tool definition in `src/config/tools.ts`
2. The tool execution logic in `src/tools/executor.ts` handles all tools automatically through OpenAI