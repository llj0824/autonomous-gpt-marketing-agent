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
  }
];