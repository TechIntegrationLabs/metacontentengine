/**
 * Monetization Service
 *
 * Analyzes content and inserts monetization shortcodes based on
 * category matching, keyword patterns, and optimal placement.
 */

// ============================================
// Types
// ============================================

export interface MonetizationCategory {
  id: string;
  tenantId: string;
  category: string;
  categoryId: string;
  subCategory?: string;
  subCategoryId?: string;
  shortcodeTemplate: string;
  shortcodeParams: Record<string, unknown>;
  keywordPatterns: string[];
  topicPatterns: string[];
  priority: number;
  usageCount: number;
  isActive: boolean;
}

export type ShortcodePosition = 'after_intro' | 'mid_content' | 'before_conclusion' | 'sidebar';

export interface ShortcodeSlot {
  id: string;
  position: ShortcodePosition;
  shortcode: string;
  params: Record<string, unknown>;
  categoryId: string;
  categoryName: string;
  matchScore: number;
}

export interface CategoryMatch {
  category: MonetizationCategory;
  matchScore: number;
  matchedKeywords: string[];
  matchedTopics: string[];
}

export interface MonetizationResult {
  contentWithShortcodes: string;
  insertedSlots: ShortcodeSlot[];
  matchedCategories: CategoryMatch[];
  totalMatches: number;
  estimatedValue?: number;
}

export interface ArticleMeta {
  category?: string;
  keywords: string[];
  topics: string[];
  degreeLevel?: string;
  wordCount?: number;
}

export interface MonetizationConfig {
  maxShortcodesPerArticle: number;
  minMatchScore: number;
  preferredPositions: ShortcodePosition[];
  enableAutoInsert: boolean;
  spacing: {
    minParagraphsBetween: number;
    afterIntroPosition: number; // paragraph number (1-indexed)
    beforeConclusionOffset: number; // paragraphs from end
  };
}

// ============================================
// Default Configuration
// ============================================

export const DEFAULT_MONETIZATION_CONFIG: MonetizationConfig = {
  maxShortcodesPerArticle: 3,
  minMatchScore: 50,
  preferredPositions: ['after_intro', 'mid_content', 'before_conclusion'],
  enableAutoInsert: true,
  spacing: {
    minParagraphsBetween: 4,
    afterIntroPosition: 2,
    beforeConclusionOffset: 2,
  },
};

// ============================================
// Shortcode Templates
// ============================================

export const SHORTCODE_TEMPLATES: Record<string, string> = {
  degree_table: '[degree_table program="{program}" level="{level}" accreditation="{accreditation}"]',
  degree_offer: '[degree_offer program="{program}" style="{style}"]',
  school_spotlight: '[school_spotlight school_id="{schoolId}" layout="{layout}"]',
  comparison_table: '[comparison_table programs="{programs}" metrics="{metrics}"]',
  salary_data: '[salary_data occupation="{occupation}" source="{source}"]',
  accreditation_badge: '[accreditation_badge type="{type}"]',
  cta_box: '[cta_box title="{title}" button_text="{buttonText}" link="{link}"]',
  info_panel: '[info_panel type="{type}" content="{content}"]',
};

// ============================================
// MonetizationService Class
// ============================================

export class MonetizationService {
  private config: MonetizationConfig;
  private categories: MonetizationCategory[] = [];

  constructor(config: Partial<MonetizationConfig> = {}) {
    this.config = { ...DEFAULT_MONETIZATION_CONFIG, ...config };
  }

  /**
   * Set available monetization categories
   */
  setCategories(categories: MonetizationCategory[]): void {
    this.categories = categories.filter((c) => c.isActive);
  }

  /**
   * Get loaded categories
   */
  getCategories(): MonetizationCategory[] {
    return this.categories;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<MonetizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Find categories that match the article content
   */
  findMatchingCategories(meta: ArticleMeta): CategoryMatch[] {
    const matches: CategoryMatch[] = [];

    for (const category of this.categories) {
      const { score, matchedKeywords, matchedTopics } = this.calculateMatchScore(category, meta);

      if (score >= this.config.minMatchScore) {
        matches.push({
          category,
          matchScore: score,
          matchedKeywords,
          matchedTopics,
        });
      }
    }

    // Sort by match score (highest first), then by priority
    return matches.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return b.category.priority - a.category.priority;
    });
  }

  /**
   * Calculate match score between category and article
   */
  private calculateMatchScore(
    category: MonetizationCategory,
    meta: ArticleMeta
  ): {
    score: number;
    matchedKeywords: string[];
    matchedTopics: string[];
  } {
    let score = 0;
    const matchedKeywords: string[] = [];
    const matchedTopics: string[] = [];

    // Normalize for comparison
    const articleKeywords = meta.keywords.map((k) => k.toLowerCase());
    const articleTopics = meta.topics.map((t) => t.toLowerCase());
    const articleCategory = meta.category?.toLowerCase() || '';

    // Keyword pattern matching (max 50 points)
    for (const pattern of category.keywordPatterns) {
      const patternLower = pattern.toLowerCase();
      const matches = articleKeywords.filter((k) =>
        k.includes(patternLower) || patternLower.includes(k)
      );

      if (matches.length > 0) {
        matchedKeywords.push(...matches);
        score += Math.min(25, matches.length * 10);
      }
    }

    // Topic pattern matching (max 30 points)
    for (const pattern of category.topicPatterns) {
      const patternLower = pattern.toLowerCase();
      const matches = articleTopics.filter((t) =>
        t.includes(patternLower) || patternLower.includes(t)
      );

      if (matches.length > 0) {
        matchedTopics.push(...matches);
        score += Math.min(15, matches.length * 5);
      }
    }

    // Category match (20 points)
    if (articleCategory && category.category.toLowerCase().includes(articleCategory)) {
      score += 20;
    }

    // Sub-category match (bonus 10 points)
    if (category.subCategory && articleCategory.includes(category.subCategory.toLowerCase())) {
      score += 10;
    }

    // Priority bonus (max 10 points)
    score += Math.min(10, category.priority);

    return {
      score: Math.min(100, score),
      matchedKeywords: [...new Set(matchedKeywords)],
      matchedTopics: [...new Set(matchedTopics)],
    };
  }

  /**
   * Generate a shortcode string from template and params
   */
  generateShortcode(template: string, params: Record<string, unknown>): string {
    let shortcode = SHORTCODE_TEMPLATES[template] || template;

    // Replace placeholders with actual values
    for (const [key, value] of Object.entries(params)) {
      const placeholder = `{${key}}`;
      shortcode = shortcode.replace(placeholder, String(value || ''));
    }

    // Remove any unreplaced placeholders
    shortcode = shortcode.replace(/\{[^}]+\}/g, '');

    return shortcode.trim();
  }

  /**
   * Validate shortcode syntax
   */
  validateShortcode(shortcode: string): { valid: boolean; error?: string } {
    // Check basic structure
    if (!shortcode.startsWith('[') || !shortcode.endsWith(']')) {
      return { valid: false, error: 'Shortcode must be wrapped in brackets' };
    }

    // Extract shortcode name
    const match = shortcode.match(/^\[(\w+)/);
    if (!match) {
      return { valid: false, error: 'Invalid shortcode name' };
    }

    // Check for balanced brackets
    const openBrackets = (shortcode.match(/\[/g) || []).length;
    const closeBrackets = (shortcode.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      return { valid: false, error: 'Unbalanced brackets' };
    }

    return { valid: true };
  }

  /**
   * Determine optimal positions for shortcode insertion
   */
  findInsertionPositions(content: string): Map<ShortcodePosition, number> {
    const positions = new Map<ShortcodePosition, number>();
    const paragraphs = content.split(/\n\s*\n/);
    const totalParagraphs = paragraphs.length;

    // After introduction (usually paragraph 2-3)
    if (totalParagraphs > 3) {
      positions.set('after_intro', this.config.spacing.afterIntroPosition);
    }

    // Mid content (around middle)
    if (totalParagraphs > 6) {
      positions.set('mid_content', Math.floor(totalParagraphs / 2));
    }

    // Before conclusion (2-3 paragraphs from end)
    if (totalParagraphs > 4) {
      positions.set(
        'before_conclusion',
        totalParagraphs - this.config.spacing.beforeConclusionOffset
      );
    }

    return positions;
  }

  /**
   * Insert shortcodes into content at optimal positions
   */
  insertShortcodes(
    content: string,
    slots: ShortcodeSlot[]
  ): string {
    if (slots.length === 0) return content;

    const paragraphs = content.split(/\n\s*\n/);
    const positions = this.findInsertionPositions(content);

    // Create insertion map (paragraph index -> shortcodes)
    const insertions = new Map<number, string[]>();

    for (const slot of slots) {
      const paragraphIndex = positions.get(slot.position);
      if (paragraphIndex !== undefined && paragraphIndex < paragraphs.length) {
        const existing = insertions.get(paragraphIndex) || [];
        existing.push(`\n\n${slot.shortcode}\n\n`);
        insertions.set(paragraphIndex, existing);
      }
    }

    // Build new content with insertions
    const newParagraphs: string[] = [];

    for (let i = 0; i < paragraphs.length; i++) {
      newParagraphs.push(paragraphs[i]);

      const shortcodesToInsert = insertions.get(i);
      if (shortcodesToInsert) {
        newParagraphs.push(shortcodesToInsert.join(''));
      }
    }

    return newParagraphs.join('\n\n');
  }

  /**
   * Main monetization function - analyze and optionally insert shortcodes
   */
  monetizeContent(
    content: string,
    meta: ArticleMeta,
    autoInsert: boolean = this.config.enableAutoInsert
  ): MonetizationResult {
    // Find matching categories
    const matchedCategories = this.findMatchingCategories(meta);

    // Take top N matches based on config
    const topMatches = matchedCategories.slice(0, this.config.maxShortcodesPerArticle);

    // Create shortcode slots
    const positions = this.config.preferredPositions;
    const insertedSlots: ShortcodeSlot[] = [];

    for (let i = 0; i < topMatches.length && i < positions.length; i++) {
      const match = topMatches[i];
      const position = positions[i];

      const shortcode = this.generateShortcode(
        match.category.shortcodeTemplate,
        match.category.shortcodeParams
      );

      insertedSlots.push({
        id: `slot-${i}-${Date.now()}`,
        position,
        shortcode,
        params: match.category.shortcodeParams,
        categoryId: match.category.id,
        categoryName: match.category.category,
        matchScore: match.matchScore,
      });
    }

    // Optionally insert shortcodes into content
    const contentWithShortcodes = autoInsert
      ? this.insertShortcodes(content, insertedSlots)
      : content;

    return {
      contentWithShortcodes,
      insertedSlots,
      matchedCategories,
      totalMatches: matchedCategories.length,
    };
  }

  /**
   * Preview how a shortcode would appear in content
   */
  previewShortcode(
    content: string,
    slot: ShortcodeSlot
  ): string {
    return this.insertShortcodes(content, [slot]);
  }

  /**
   * Remove a shortcode from content
   */
  removeShortcode(content: string, shortcode: string): string {
    // Escape special regex characters in the shortcode
    const escaped = shortcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\n*${escaped}\\n*`, 'g');
    return content.replace(pattern, '\n\n').replace(/\n{3,}/g, '\n\n');
  }

  /**
   * Get position display label
   */
  getPositionLabel(position: ShortcodePosition): string {
    const labels: Record<ShortcodePosition, string> = {
      after_intro: 'After Introduction',
      mid_content: 'Mid-Content',
      before_conclusion: 'Before Conclusion',
      sidebar: 'Sidebar',
    };
    return labels[position];
  }

  /**
   * Get available shortcode templates
   */
  getAvailableTemplates(): { name: string; template: string }[] {
    return Object.entries(SHORTCODE_TEMPLATES).map(([name, template]) => ({
      name,
      template,
    }));
  }
}

// ============================================
// Singleton Export
// ============================================

let defaultService: MonetizationService | null = null;

export function getMonetizationService(
  config?: Partial<MonetizationConfig>
): MonetizationService {
  if (!defaultService || config) {
    defaultService = new MonetizationService(config);
  }
  return defaultService;
}

export function createMonetizationService(
  config?: Partial<MonetizationConfig>
): MonetizationService {
  return new MonetizationService(config);
}

export default MonetizationService;
