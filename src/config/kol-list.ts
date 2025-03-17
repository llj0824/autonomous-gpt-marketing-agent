/**
 * Key Opinion Leader (KOL) Twitter accounts to monitor
 */
export interface KOL {
  username: string;
  niche: string[];
  interests: string[];
  relevanceScore: number; // 1-10
  description: string;
}

export const KOLList: KOL[] = [
  {
    username: 'hubermanlab',
    niche: ['science', 'health', 'neuroscience'],
    interests: ['research', 'wellness', 'biology'],
    relevanceScore: 9,
    description: 'Science communicator and neuroscientist sharing health and science insights'
  },
  {
    username: 'levelsio',
    niche: ['startups', 'entrepreneurship', 'remote work'],
    interests: ['indie hacking', 'bootstrapping', 'nomadic lifestyle'],
    relevanceScore: 8,
    description: 'Independent entrepreneur sharing insights on bootstrapping and remote work'
  },
  {
    username: 'naval',
    niche: ['startups', 'philosophy', 'wealth'],
    interests: ['investing', 'personal development', 'technology'],
    relevanceScore: 9,
    description: 'Angel investor and entrepreneur focused on wealth creation and philosophy'
  },
  {
    username: 'paulg',
    niche: ['startups', 'technology', 'venture capital'],
    interests: ['programming', 'essays', 'YCombinator'],
    relevanceScore: 9,
    description: 'Y Combinator co-founder, Lisp programmer, and influential startup essayist'
  },
  {
    username: 'elonmusk',
    niche: ['technology', 'space', 'automotive'],
    interests: ['AI', 'renewable energy', 'innovation'],
    relevanceScore: 10,
    description: 'CEO of Tesla, SpaceX, and X (Twitter). Influential tech entrepreneur'
  },
  {
    username: 'balajis',
    niche: ['technology', 'crypto', 'future trends'],
    interests: ['decentralization', 'startups', 'biotech'],
    relevanceScore: 8,
    description: 'Angel investor, entrepreneur, and author focusing on future technologies'
  },
  {
    username: 'sama',
    niche: ['AI', 'startups', 'technology'],
    interests: ['OpenAI', 'venture capital', 'future trends'],
    relevanceScore: 9,
    description: 'CEO of OpenAI, former Y Combinator president, influential in AI space'
  },
  {
    username: 'pmarca',
    niche: ['technology', 'venture capital', 'economics'],
    interests: ['startups', 'software', 'politics'],
    relevanceScore: 9,
    description: 'Co-founder of Andreessen Horowitz, web pioneer, and influential tech investor'
  }
];