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
  }
];