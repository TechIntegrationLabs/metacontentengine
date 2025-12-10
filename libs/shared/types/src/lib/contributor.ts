/**
 * Contributor Types - AI Personas / Authors
 */

export interface Contributor {
  id: string;
  tenantId: string;

  // Identity
  name: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;

  // WordPress mapping
  wpAuthorId?: number;
  wpAuthorSlug?: string;

  // Style proxy (celebrity/known writer to emulate)
  styleProxy?: string;
  styleProxyDescription?: string;

  // Voice Profile
  voiceProfile: ContributorVoice;

  // Expertise
  expertiseAreas: string[];
  contentTypes: ContentType[];

  // Settings
  isActive: boolean;
  isDefault: boolean;

  // Stats
  articleCount: number;
  averageQualityScore?: number;

  createdAt: string;
  updatedAt: string;
}

export interface ContributorVoice {
  // Tone scale (1-10: Formal to Casual)
  formalitySale: number;

  // Voice description
  description: string;

  // Writing guidelines
  guidelines?: string;

  // Signature elements
  signaturePhrases: string[];
  transitionWords: string[];

  // Things to avoid
  phrasesToAvoid: string[];
  topicsToAvoid: string[];

  // Examples
  writingSamples?: WritingSample[];
}

export interface WritingSample {
  id: string;
  title: string;
  content: string;
  source?: string;
  addedAt: string;
}

export type ContentType =
  | 'blog_post'
  | 'how_to_guide'
  | 'listicle'
  | 'comparison'
  | 'review'
  | 'news'
  | 'opinion'
  | 'case_study'
  | 'interview'
  | 'roundup'
  | 'pillar_content';

export interface ContributorStats {
  contributorId: string;
  period: 'week' | 'month' | 'quarter' | 'year' | 'all_time';

  articlesPublished: number;
  totalWords: number;
  averageQualityScore: number;
  averageHumanScore: number;
  topCategories: { categoryId: string; count: number }[];
}
