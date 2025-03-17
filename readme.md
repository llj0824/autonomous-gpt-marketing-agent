
# Product Feature Document: Autonomous Marketing agent

## 1. Product Overview

**Name**: Autonomous Marketing agent
**Version**: 1.0 (Dry Run)

This feature automates the discovery of relevant tweets from key opinion leaders (KOLs) and responds with appropriate tool demonstrations. By monitoring selected Twitter accounts, the system identifies opportunities to showcase various software tools by applying them directly to the tweet content, demonstrating their value in real-world contexts.


we're building an automated system that:

- **Monitors KOL tweets** from specific industry influencers
- **Identifies opportunities** where our tools could provide value
- **Applies relevant tools** to the tweet content to create demonstrations
- **Generates contextual responses** showcasing the tools in action
- **Outputs responses to CSV** for human review before posting

The core concept is "show, don't tell" marketing - instead of claiming what our tools can do, we're demonstrating their value by applying them to content people already care about. This creates a natural, contextual introduction to our products while providing immediate value to both the original poster and their audience.

## 2. Business Objectives

- Increase awareness of software products through practical demonstrations
- Generate interest by showing tools in action on relevant content
- Provide immediate value to potential customers without requiring signup
- Build credibility within specific Twitter niches

## 3. Feature Requirements

### 3.1 Core Functionality

- Monitor tweets from a predefined list of KOL Twitter accounts
- Analyze tweet content to determine applicability for tool demonstration
- Generate appropriate tool-based responses to relevant tweets
- Output planned responses to CSV file for review (dry run mode)
- Support eventual transition to live response mode

### 3.2 Technical Requirements

- Integrate with [agent-twitter-client](https://github.com/elizaOS/agent-twitter-client) library
- Implement modular architecture for swappable tool integration
- Create flexible LLM-based routing logic for action decisions
- Handle various content types (text, videos, links, etc.)
- Store response data in structured CSV format

## 4. System Architecture - Chain-of-Thought Agent Architecture
```
┌───────────┐      ┌────────────────┐      ┌────────────────┐
│  Twitter  │      │  Tweet Context │      │  LLM Reasoner  │
│  Stream   │─────▶│  Preparation   │─────▶│  with CoT      │
└───────────┘      └────────────────┘      └───────┬────────┘
                                                   │
                                                   ▼
┌───────────┐      ┌────────────────┐      ┌────────────────┐
│ CSV with  │      │ Response       │      │ Tool Execution │
│ Decision  │◀─────│ Generation     │◀─────│ with Reasoning │
│ Trace     │      │                │      │ Artifacts      │
└───────────┘      └────────────────┘      └────────────────┘
```

Frontend UI/UX
```

## Option 1: Pipeline Status Board
```
┌─────────────────────────────────────────────────────────────┐
│ AUTONOMOUS MARKETING AGENT - PIPELINE MONITOR               │
├────────────┬────────────────┬────────────────┬──────────────┤
│ TWEET      │ DECISION       │ TOOL           │ RESPONSE     │
│ COLLECTION │ ENGINE         │ APPLICATION    │ GENERATION   │
├────────────┼────────────────┼────────────────┼──────────────┤
│            │                │                │              │
│ 24 tweets  │ 16 matched     │ 12 processed   │ 10 generated │
│ 3 pending  │ 8 rejected     │ 4 in progress  │ 2 pending    │
│            │                │                │              │
│ [Details]  │ [Details]      │ [Details]      │ [Details]    │
└────────────┴────────────────┴────────────────┴──────────────┘
│ ERROR LOG: Tool application failed for @techleader tweet    │
│ [View Errors] [3 issues in the last hour]                   │
└─────────────────────────────────────────────────────────────┘
```


## 5. Implementation Details

### 5.1 KOL List Management

- Store KOL Twitter accounts in a configuration file
- Include metadata for each KOL (niche, interests, relevance score)
- Support easy addition/removal of accounts

### 5.2 Tweet Collection

- Utilize agent-twitter-client to fetch recent tweets (last 3-7 days)
- Filter initial tweets based on basic criteria (engagement threshold, content types)
- Store relevant tweet metadata (URL, content, media type, engagement metrics)

### 5.3 Decision Engine

- Implement LLM-based routing logic to determine:
  - Whether a tweet is suitable for response
  - Which tool would be most appropriate to showcase
  - Priority/relevance score for the potential response

### 5.4 Tool Application

- Modular framework for different tool demonstrations:
  ### 1. **Content visualizer**
  - **Functionality**: Create visualizations for content
  - **Audience Fit**: Perfect for busy professionals following content-heavy accounts
  - **Implementation**: Relatively straightforward using existing LLM capabilities
  - **Example**: long form -> turn into mindmap, mermaid sequence

  ### 2. **Research Insight Generator**
  - **Functionality**: Extracts scientific claims from content and links to supporting research
  - **Audience Fit**: Ideal for Huberman's science-oriented audience who value evidence
  - **Implementation**: Medium difficulty - requires knowledge extraction and research database integration
  - **Example**: "Great point about [health claim]. I found the supporting research papers and extracted this relevant data..."

  ### 3. **Technical Concept Visualizer**
  - **Functionality**: Creates simple visualizations or analogies for complex technical concepts
  - **Audience Fit**: Perfect for AI news enthusiasts dealing with rapidly evolving concepts
  - **Implementation**: Medium - combines LLM conceptual explanation with basic visualization
  - **Example**: "Your explanation of [AI concept] was excellent. Here's a visual representation that might help your audience understand..."

  ### 4. **Market Context Analyzer**
  - **Functionality**: Provides relevant market data and trend analysis for crypto/AI mentions
  - **Audience Fit**: Directly valuable to crypto audience and AI market followers
  - **Implementation**: Requires integration with finance/market APIs
  - **Example**: "Following up on your mention of [token/company], here's the relevant 30-day performance data and major factors driving current trends..."

  ### 5. **Video Insight Extractor**
  - **Functionality**: Pulls key insights, timestamps, and quotes from video content
  - **Audience Fit**: Valuable for followers of Huberman's long-form content
  - **Implementation**: More complex - requires video processing or transcript analysis
  - **Example**: "For followers who don't have time for the full interview, I've extracted these 3 key insights with timestamps..."
- Each tool module should:
  - Accept relevant tweet data
  - Process according to tool's functionality
  - Return demonstration output

### 5.5 Response Composition

- Generate contextual responses that:
  - Reference the original tweet appropriately
  - Showcase the tool's output clearly
  - Include brief marketing message about the tool
  - Maintain natural, helpful tone (not overtly promotional)

### 5.6 Output Management

- Write to CSV file with columns:
  - Original tweet URL
  - Tweet author
  - Tweet content
  - Selected tool
  - Generated response
  - Timestamp
  - Action status (pending/approved/rejected)
```


## Running the Application

### Web Interface
The agent now includes a web-based dashboard to monitor the processing pipeline and review generated responses.

**Features:**
- Real-time status of each pipeline component (tweets, decisions, tools, responses)
- Error reporting and tracking
- View and manage generated responses
- Easy filtering and sorting of content

**To use the web interface:**
1. Start the application with `npm run dev` or `npm start`
2. Open your browser to `http://localhost:3000` (or the configured port)
3. Dashboard will automatically refresh every 5 seconds
4. Use the "Refresh Data" button to manually update the display

### Development Checkpoints

#### [Done] Checkpoint 1: Tweet Collection System
- Configure KOL list with metadata
- Implement Twitter API integration
- Test collection of relevant tweets
- Set up basic filtering by engagement metrics
- **Deliverable**: Working tweet collector outputting to console/file

#### [Done] Checkpoint 2: Decision Engine Prototype
- Implement basic LLM-based routing logic
- Create criteria for tweet suitability assessment
- Develop simple tool-matching algorithm
- **Deliverable**: System that can classify tweets and recommend tools

#### [Done] Checkpoint 3: Web Interface
- Build pipeline monitoring dashboard
- Create real-time status tracking
- Add response viewing and filtering
- **Deliverable**: Functional web UI to monitor agent activity

#### [In Progress] Checkpoint 4: First Tool Integration
- Build modular tool framework
- Implement content tools
- Process tweets containing links to articles/threads
- **Deliverable**: Working demonstration of tools on sample tweets

#### Checkpoint 5: Response Generation System
- Create response templates
- Build context-aware response composer
- Combine tool output with appropriate messaging
- **Deliverable**: System generating natural-sounding responses

#### Checkpoint 6: Full Dry Run Pipeline
- Implement CSV output structure
- Connect all components end-to-end
- Include complete metadata for human review
- **Deliverable**: Complete pipeline generating review-ready responses in CSV
