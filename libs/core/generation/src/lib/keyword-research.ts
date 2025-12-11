/**
 * Keyword Research Service
 *
 * Provides keyword research functionality with optional DataForSEO integration.
 * Supports manual entry, batch lookup, and trend analysis.
 */

// ============================================
// Types
// ============================================

export interface KeywordData {
  id?: string;
  keyword: string;
  searchVolume?: number;
  keywordDifficulty?: number;
  cpc?: number;
  competition?: 'low' | 'medium' | 'high';
  competitionLevel?: number;
  trendData?: MonthlyTrend[];
  seasonality?: SeasonalityPattern;
  serpFeatures?: SerpFeature[];
  serpDifficulty?: number;
  isStarred?: boolean;
  clusterId?: string;
  tags?: string[];
  notes?: string;
  source?: 'manual' | 'dataforseo' | 'import';
  lastUpdatedAt?: Date;
}

export interface MonthlyTrend {
  month: string; // YYYY-MM
  volume: number;
}

export interface SeasonalityPattern {
  peakMonths: number[];
  lowMonths: number[];
  variance: number;
}

export type SerpFeature =
  | 'featured_snippet'
  | 'people_also_ask'
  | 'local_pack'
  | 'knowledge_panel'
  | 'image_pack'
  | 'video_carousel'
  | 'shopping_results'
  | 'news_box'
  | 'reviews'
  | 'sitelinks';

export interface KeywordCluster {
  id: string;
  name: string;
  description?: string;
  totalVolume: number;
  avgDifficulty: number;
  keywordCount: number;
  color?: string;
  isActive: boolean;
}

export interface DataForSEOConfig {
  login: string;
  password: string;
  apiEndpoint?: string;
}

export interface KeywordLookupResult {
  success: boolean;
  keyword: string;
  data?: KeywordData;
  error?: string;
  creditsUsed?: number;
}

export interface BatchLookupResult {
  success: boolean;
  results: KeywordLookupResult[];
  totalCreditsUsed: number;
  failedCount: number;
}

export interface KeywordSuggestion {
  keyword: string;
  searchVolume?: number;
  keywordDifficulty?: number;
  relevanceScore: number;
}

// ============================================
// DataForSEO API Client
// ============================================

export class DataForSEOClient {
  private config: DataForSEOConfig;
  private baseUrl: string;

  constructor(config: DataForSEOConfig) {
    this.config = config;
    this.baseUrl = config.apiEndpoint || 'https://api.dataforseo.com/v3';
  }

  /**
   * Get authorization header
   */
  private getAuthHeader(): string {
    const credentials = btoa(`${this.config.login}:${this.config.password}`);
    return `Basic ${credentials}`;
  }

  /**
   * Make API request
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: unknown
  ): Promise<{ success: boolean; data?: T; error?: string; cost?: number }> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const result = await response.json();

      if (!response.ok || result.status_code !== 20000) {
        return {
          success: false,
          error: result.status_message || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data: result.tasks?.[0]?.result || result,
        cost: result.cost,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get keyword data from DataForSEO
   */
  async getKeywordData(
    keywords: string[],
    location: number = 2840, // US
    language: string = 'en'
  ): Promise<BatchLookupResult> {
    const results: KeywordLookupResult[] = [];
    let totalCreditsUsed = 0;
    let failedCount = 0;

    // DataForSEO accepts up to 1000 keywords per request
    const chunks = this.chunkArray(keywords, 1000);

    for (const chunk of chunks) {
      const response = await this.request<DataForSEOKeywordResult[]>(
        '/keywords_data/google_ads/search_volume/live',
        'POST',
        [
          {
            keywords: chunk,
            location_code: location,
            language_code: language,
          },
        ]
      );

      if (response.success && response.data) {
        totalCreditsUsed += response.cost || 0;

        for (const item of response.data) {
          if (item.keyword_info) {
            results.push({
              success: true,
              keyword: item.keyword,
              data: this.mapDataForSEOResult(item),
              creditsUsed: response.cost ? response.cost / chunk.length : undefined,
            });
          } else {
            results.push({
              success: false,
              keyword: item.keyword,
              error: 'No data available',
            });
            failedCount++;
          }
        }
      } else {
        // Mark all keywords in chunk as failed
        for (const kw of chunk) {
          results.push({
            success: false,
            keyword: kw,
            error: response.error,
          });
          failedCount++;
        }
      }
    }

    return {
      success: failedCount < keywords.length,
      results,
      totalCreditsUsed,
      failedCount,
    };
  }

  /**
   * Get keyword suggestions
   */
  async getKeywordSuggestions(
    seedKeyword: string,
    limit: number = 50,
    location: number = 2840
  ): Promise<{ success: boolean; suggestions?: KeywordSuggestion[]; error?: string }> {
    const response = await this.request<DataForSEOSuggestionResult[]>(
      '/keywords_data/google_ads/keywords_for_keywords/live',
      'POST',
      [
        {
          keywords: [seedKeyword],
          location_code: location,
          language_code: 'en',
          limit,
        },
      ]
    );

    if (!response.success || !response.data) {
      return { success: false, error: response.error };
    }

    const suggestions: KeywordSuggestion[] = response.data.map((item) => ({
      keyword: item.keyword,
      searchVolume: item.search_volume,
      keywordDifficulty: item.keyword_difficulty,
      relevanceScore: item.relevance || 0,
    }));

    return { success: true, suggestions };
  }

  /**
   * Map DataForSEO result to our format
   */
  private mapDataForSEOResult(item: DataForSEOKeywordResult): KeywordData {
    const info = item.keyword_info;

    return {
      keyword: item.keyword,
      searchVolume: info.search_volume,
      keywordDifficulty: info.keyword_difficulty,
      cpc: info.cpc,
      competition: this.mapCompetition(info.competition_level),
      competitionLevel: info.competition_level,
      trendData: info.monthly_searches?.map((m: { month: string; search_volume: number }) => ({
        month: m.month,
        volume: m.search_volume,
      })),
      serpFeatures: item.serp_info?.serp_item_types as SerpFeature[],
      source: 'dataforseo',
      lastUpdatedAt: new Date(),
    };
  }

  /**
   * Map competition level to category
   */
  private mapCompetition(level?: number): 'low' | 'medium' | 'high' | undefined {
    if (level === undefined) return undefined;
    if (level < 0.33) return 'low';
    if (level < 0.66) return 'medium';
    return 'high';
  }

  /**
   * Helper to chunk array
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// DataForSEO API response types (simplified)
interface DataForSEOKeywordResult {
  keyword: string;
  keyword_info: {
    search_volume: number;
    keyword_difficulty: number;
    cpc: number;
    competition_level: number;
    monthly_searches?: Array<{ month: string; search_volume: number }>;
  };
  serp_info?: {
    serp_item_types: string[];
  };
}

interface DataForSEOSuggestionResult {
  keyword: string;
  search_volume?: number;
  keyword_difficulty?: number;
  relevance?: number;
}

// ============================================
// KeywordResearchService Class
// ============================================

export class KeywordResearchService {
  private dataForSEOClient: DataForSEOClient | null = null;

  /**
   * Configure DataForSEO client
   */
  setDataForSEOConfig(config: DataForSEOConfig): void {
    this.dataForSEOClient = new DataForSEOClient(config);
  }

  /**
   * Check if DataForSEO is configured
   */
  isDataForSEOConfigured(): boolean {
    return this.dataForSEOClient !== null;
  }

  /**
   * Lookup keywords via DataForSEO
   */
  async lookupKeywords(keywords: string[]): Promise<BatchLookupResult> {
    if (!this.dataForSEOClient) {
      return {
        success: false,
        results: keywords.map((kw) => ({
          success: false,
          keyword: kw,
          error: 'DataForSEO not configured',
        })),
        totalCreditsUsed: 0,
        failedCount: keywords.length,
      };
    }

    return this.dataForSEOClient.getKeywordData(keywords);
  }

  /**
   * Get keyword suggestions from seed keyword
   */
  async getSuggestions(
    seedKeyword: string,
    limit?: number
  ): Promise<{ success: boolean; suggestions?: KeywordSuggestion[]; error?: string }> {
    if (!this.dataForSEOClient) {
      return { success: false, error: 'DataForSEO not configured' };
    }

    return this.dataForSEOClient.getKeywordSuggestions(seedKeyword, limit);
  }

  /**
   * Calculate keyword opportunity score
   */
  calculateOpportunityScore(keyword: KeywordData): number {
    // Opportunity = High volume + Low difficulty + Low competition
    let score = 0;

    // Volume score (0-40 points)
    if (keyword.searchVolume) {
      if (keyword.searchVolume >= 10000) score += 40;
      else if (keyword.searchVolume >= 5000) score += 35;
      else if (keyword.searchVolume >= 1000) score += 30;
      else if (keyword.searchVolume >= 500) score += 20;
      else if (keyword.searchVolume >= 100) score += 10;
    }

    // Difficulty score (0-40 points) - lower is better
    if (keyword.keywordDifficulty !== undefined) {
      const invertedDifficulty = 100 - keyword.keywordDifficulty;
      score += Math.round(invertedDifficulty * 0.4);
    }

    // Competition score (0-20 points) - lower is better
    if (keyword.competitionLevel !== undefined) {
      const invertedCompetition = 1 - keyword.competitionLevel;
      score += Math.round(invertedCompetition * 20);
    }

    return Math.min(100, score);
  }

  /**
   * Get difficulty label
   */
  getDifficultyLabel(difficulty: number): {
    label: string;
    color: string;
    description: string;
  } {
    if (difficulty <= 20) {
      return {
        label: 'Very Easy',
        color: 'text-emerald-400',
        description: 'Great opportunity - low competition',
      };
    }
    if (difficulty <= 40) {
      return {
        label: 'Easy',
        color: 'text-green-400',
        description: 'Good opportunity with some effort',
      };
    }
    if (difficulty <= 60) {
      return {
        label: 'Medium',
        color: 'text-amber-400',
        description: 'Moderate competition - requires quality content',
      };
    }
    if (difficulty <= 80) {
      return {
        label: 'Hard',
        color: 'text-orange-400',
        description: 'High competition - requires authority',
      };
    }
    return {
      label: 'Very Hard',
      color: 'text-red-400',
      description: 'Extremely competitive - difficult to rank',
    };
  }

  /**
   * Format search volume for display
   */
  formatVolume(volume?: number): string {
    if (!volume) return '-';
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  }

  /**
   * Detect seasonality from trend data
   */
  detectSeasonality(trendData?: MonthlyTrend[]): SeasonalityPattern | null {
    if (!trendData || trendData.length < 12) return null;

    const volumes = trendData.map((t) => t.volume);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;

    // Find peak and low months
    const threshold = avgVolume * 0.2;
    const peakMonths: number[] = [];
    const lowMonths: number[] = [];

    trendData.forEach((t, index) => {
      const month = (index % 12) + 1;
      if (t.volume > avgVolume + threshold) {
        peakMonths.push(month);
      } else if (t.volume < avgVolume - threshold) {
        lowMonths.push(month);
      }
    });

    // Calculate variance
    const variance =
      volumes.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / volumes.length;
    const normalizedVariance = Math.sqrt(variance) / avgVolume;

    return {
      peakMonths: [...new Set(peakMonths)],
      lowMonths: [...new Set(lowMonths)],
      variance: normalizedVariance,
    };
  }

  /**
   * Auto-cluster keywords by similarity
   */
  autoClusterKeywords(keywords: KeywordData[]): Map<string, KeywordData[]> {
    const clusters = new Map<string, KeywordData[]>();

    // Simple word-based clustering
    for (const kw of keywords) {
      const words = kw.keyword.toLowerCase().split(/\s+/);
      const primaryWord = words.find((w) => w.length > 3) || words[0];

      if (!clusters.has(primaryWord)) {
        clusters.set(primaryWord, []);
      }
      clusters.get(primaryWord)!.push(kw);
    }

    // Filter out single-keyword clusters
    const filteredClusters = new Map<string, KeywordData[]>();
    clusters.forEach((keywords, name) => {
      if (keywords.length >= 2) {
        filteredClusters.set(name, keywords);
      }
    });

    return filteredClusters;
  }

  /**
   * Parse keywords from CSV
   */
  parseCSV(csvContent: string): KeywordData[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map((h) => h.trim());
    const keywords: KeywordData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const data: KeywordData = { keyword: '', source: 'import' };

      headers.forEach((header, index) => {
        const value = values[index];
        if (!value) return;

        switch (header) {
          case 'keyword':
          case 'keywords':
          case 'query':
            data.keyword = value;
            break;
          case 'volume':
          case 'search_volume':
          case 'searchvolume':
            data.searchVolume = parseInt(value) || undefined;
            break;
          case 'difficulty':
          case 'kd':
          case 'keyword_difficulty':
            data.keywordDifficulty = parseInt(value) || undefined;
            break;
          case 'cpc':
          case 'cost':
            data.cpc = parseFloat(value) || undefined;
            break;
          case 'competition':
            data.competition = value.toLowerCase() as 'low' | 'medium' | 'high';
            break;
        }
      });

      if (data.keyword) {
        keywords.push(data);
      }
    }

    return keywords;
  }

  /**
   * Export keywords to CSV
   */
  exportToCSV(keywords: KeywordData[]): string {
    const headers = [
      'keyword',
      'search_volume',
      'keyword_difficulty',
      'cpc',
      'competition',
      'is_starred',
      'tags',
    ];

    const rows = keywords.map((kw) => [
      `"${kw.keyword}"`,
      kw.searchVolume || '',
      kw.keywordDifficulty || '',
      kw.cpc || '',
      kw.competition || '',
      kw.isStarred ? 'true' : 'false',
      `"${(kw.tags || []).join(';')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

// ============================================
// Singleton Export
// ============================================

let defaultService: KeywordResearchService | null = null;

export function getKeywordResearchService(): KeywordResearchService {
  if (!defaultService) {
    defaultService = new KeywordResearchService();
  }
  return defaultService;
}

export function createKeywordResearchService(): KeywordResearchService {
  return new KeywordResearchService();
}

export default KeywordResearchService;
