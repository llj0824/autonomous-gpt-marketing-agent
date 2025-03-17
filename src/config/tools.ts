/**
 * Tools that can be applied to tweets
 */
export interface Tool {
  id: string;
  name: string;
  description: string;
  audience: string;
  complexity: 'low' | 'medium' | 'high';
  keywords: string[];
  exampleResponse: string;
}

export const tools: Tool[] = [
  {
    id: 'content-visualizer',
    name: 'Content Visualizer',
    description: 'Creates visualizations for content like mindmaps, sequence diagrams, etc.',
    audience: 'Perfect for busy professionals following content-heavy accounts',
    complexity: 'low',
    keywords: ['content', 'article', 'thread', 'learning', 'information', 'insights'],
    exampleResponse: "I turned your insights into a visual mindmap for easier reference:\n\n[Visual representation of content]"
  },
  {
    id: 'research-insight-generator',
    name: 'Research Insight Generator',
    description: 'Extracts scientific claims from content and links to supporting research',
    audience: 'Ideal for science-oriented audience who value evidence',
    complexity: 'medium',
    keywords: ['research', 'study', 'science', 'evidence', 'data', 'findings', 'experiment'],
    exampleResponse: "Great point about [health claim]. I found the supporting research papers and extracted this relevant data:\n\n[Research insights]"
  },
  {
    id: 'technical-concept-visualizer',
    name: 'Technical Concept Visualizer',
    description: 'Creates simple visualizations or analogies for complex technical concepts',
    audience: 'Perfect for AI news enthusiasts dealing with rapidly evolving concepts',
    complexity: 'medium',
    keywords: ['technical', 'AI', 'concept', 'technology', 'complex', 'explanation'],
    exampleResponse: "Your explanation of [AI concept] was excellent. Here's a visual representation that might help your audience understand:\n\n[Concept visualization]"
  },
  {
    id: 'market-context-analyzer',
    name: 'Market Context Analyzer',
    description: 'Provides relevant market data and trend analysis for crypto/AI mentions',
    audience: 'Directly valuable to crypto audience and AI market followers',
    complexity: 'medium',
    keywords: ['crypto', 'token', 'market', 'price', 'trading', 'trends', 'investment'],
    exampleResponse: "Following up on your mention of [token/company], here's the relevant 30-day performance data and major factors driving current trends:\n\n[Market analysis]"
  },
  {
    id: 'video-insight-extractor',
    name: 'Video Insight Extractor',
    description: 'Pulls key insights, timestamps, and quotes from video content',
    audience: 'Valuable for followers of long-form content',
    complexity: 'high',
    keywords: ['video', 'podcast', 'interview', 'episode', 'YouTube', 'stream'],
    exampleResponse: "For followers who don't have time for the full interview, I've extracted these 3 key insights with timestamps:\n\n[Video insights]"
  }
];