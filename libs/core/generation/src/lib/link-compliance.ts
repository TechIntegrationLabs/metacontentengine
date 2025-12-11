/**
 * Link Compliance Validation Service
 * Multi-tenant link validation with configurable domain rules
 *
 * Features:
 * - Tenant-specific blocked domains
 * - .edu domain blocking
 * - Competitor domain detection
 * - Allowed domain whitelisting
 * - Real-time compliance checking
 */

import { createClient } from '@supabase/supabase-js';

// Default blocked domains (competitors and news sites)
export const DEFAULT_BLOCKED_DOMAINS = [
  'forbes.com',
  'entrepreneur.com',
  'businessinsider.com',
  'inc.com',
  'fastcompany.com',
  'hbr.org',
  'wsj.com',
  'bloomberg.com',
  'cnbc.com',
  'reuters.com',
  'nytimes.com',
  'washingtonpost.com',
  'bbc.com',
  'cnn.com',
  'fortune.com',
  'theatlantic.com',
  'wired.com',
];

// Default allowed domains (government, education authorities, nonprofit)
export const DEFAULT_ALLOWED_DOMAINS = [
  // Bureau of Labor Statistics
  'bls.gov',
  'stats.bls.gov',
  // Government education sites
  'ed.gov',
  'nces.ed.gov',
  'studentaid.gov',
  'fafsa.gov',
  'collegescorecard.ed.gov',
  // Accreditation bodies
  'chea.org',
  'aacsb.edu',
  'abet.org',
  'cacrep.org',
  'ccne-accreditation.org',
  'cswe.org',
  // Professional associations
  'apa.org',
  'nasw.org',
  'nursingworld.org',
];

export interface LinkViolation {
  domain: string;
  url: string;
  anchorText?: string;
  ruleType: 'blocked' | 'competitor' | 'edu_restricted' | 'unapproved';
  severity: 'error' | 'warning';
  suggestion: string | null;
  message: string;
}

export interface ComplianceResult {
  isCompliant: boolean;
  violations: LinkViolation[];
  allowedLinks: string[];
  blockedCount: number;
  warningCount: number;
  totalLinks: number;
  internalLinks: number;
  externalLinks: number;
  anchorLinks: number;
}

export interface DomainRule {
  id: string;
  tenant_id: string;
  domain: string;
  rule_type: 'blocked' | 'allowed' | 'competitor' | 'trusted';
  reason?: string;
  match_subdomains: boolean;
  pattern?: string;
  is_active: boolean;
  created_at: string;
}

export interface ExtractedLink {
  url: string;
  anchorText: string;
  fullMatch: string;
}

/**
 * Link Compliance Service
 * Validates links against tenant-specific domain rules
 */
export class LinkComplianceService {
  private supabase;
  private tenantId: string;
  private blockedDomains: string[] = [];
  private allowedDomains: string[] = [];
  private competitorDomains: string[] = [];
  private rulesLoaded = false;

  constructor(supabaseUrl: string, supabaseKey: string, tenantId: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.tenantId = tenantId;
  }

  /**
   * Load domain rules from database for the tenant
   */
  async loadDomainRules(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('tenant_domain_rules')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .eq('is_active', true);

      if (error) {
        console.error('Error loading domain rules:', error);
        // Fall back to defaults
        this.blockedDomains = [...DEFAULT_BLOCKED_DOMAINS];
        this.allowedDomains = [...DEFAULT_ALLOWED_DOMAINS];
        return;
      }

      // Reset arrays
      this.blockedDomains = [];
      this.allowedDomains = [];
      this.competitorDomains = [];

      // Populate from database
      if (data && data.length > 0) {
        for (const rule of data as DomainRule[]) {
          switch (rule.rule_type) {
            case 'blocked':
              this.blockedDomains.push(rule.domain);
              break;
            case 'allowed':
            case 'trusted':
              this.allowedDomains.push(rule.domain);
              break;
            case 'competitor':
              this.competitorDomains.push(rule.domain);
              this.blockedDomains.push(rule.domain);
              break;
          }
        }
      } else {
        // No custom rules, use defaults
        this.blockedDomains = [...DEFAULT_BLOCKED_DOMAINS];
        this.allowedDomains = [...DEFAULT_ALLOWED_DOMAINS];
      }

      this.rulesLoaded = true;
    } catch (err) {
      console.error('Exception loading domain rules:', err);
      this.blockedDomains = [...DEFAULT_BLOCKED_DOMAINS];
      this.allowedDomains = [...DEFAULT_ALLOWED_DOMAINS];
    }
  }

  /**
   * Extract all links from HTML content
   */
  extractLinksFromContent(content: string): ExtractedLink[] {
    if (!content) return [];

    const links: ExtractedLink[] = [];
    const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      links.push({
        url: match[1],
        anchorText: match[2] || '',
        fullMatch: match[0],
      });
    }

    return links;
  }

  /**
   * Validate a single URL
   */
  private validateLink(url: string, anchorText = ''): {
    isValid: boolean;
    type: 'internal' | 'external' | 'anchor' | 'invalid';
    violation?: LinkViolation;
  } {
    // Handle empty or invalid URLs
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        type: 'invalid',
        violation: {
          domain: '',
          url,
          anchorText,
          ruleType: 'blocked',
          severity: 'error',
          suggestion: null,
          message: 'Empty or invalid URL',
        },
      };
    }

    // Handle anchor links (always valid)
    if (url.startsWith('#')) {
      return { isValid: true, type: 'anchor' };
    }

    // Handle relative URLs (internal - always valid)
    if (url.startsWith('/')) {
      return { isValid: true, type: 'internal' };
    }

    // Parse URL to extract domain
    let domain = '';
    let urlObj: URL;

    try {
      urlObj = new URL(url);
      domain = urlObj.hostname.toLowerCase();
    } catch (e) {
      return {
        isValid: false,
        type: 'invalid',
        violation: {
          domain: '',
          url,
          anchorText,
          ruleType: 'blocked',
          severity: 'error',
          suggestion: null,
          message: 'Invalid URL format',
        },
      };
    }

    // Check if internal link (same domain or relative)
    // Note: In a real implementation, you'd check against tenant's primary domain
    // For now, we'll mark as external and continue validation

    // CRITICAL: Block .edu links
    if (domain.endsWith('.edu')) {
      return {
        isValid: false,
        type: 'external',
        violation: {
          domain,
          url,
          anchorText,
          ruleType: 'edu_restricted',
          severity: 'error',
          suggestion: 'Use your site\'s own content pages or approved educational resources instead',
          message: 'Direct .edu links are not allowed. Use internal pages or approved sources.',
        },
      };
    }

    // Check if domain is explicitly blocked
    const isBlocked = this.blockedDomains.some(
      (blocked) => domain === blocked || domain.endsWith('.' + blocked)
    );

    if (isBlocked) {
      const isCompetitor = this.competitorDomains.some(
        (comp) => domain === comp || domain.endsWith('.' + comp)
      );

      return {
        isValid: false,
        type: 'external',
        violation: {
          domain,
          url,
          anchorText,
          ruleType: isCompetitor ? 'competitor' : 'blocked',
          severity: 'error',
          suggestion: isCompetitor
            ? 'Link to your own content instead of competitors'
            : 'Remove this link or replace with an approved source',
          message: isCompetitor
            ? `Competitor link detected: ${domain}. This link is not allowed.`
            : `Blocked domain: ${domain}. This link violates content policy.`,
        },
      };
    }

    // Check if domain is on the allowed whitelist
    const isAllowed = this.allowedDomains.some(
      (allowed) => domain === allowed || domain.endsWith('.' + allowed)
    );

    if (!isAllowed) {
      // Not on whitelist - warning but not blocking
      return {
        isValid: true,
        type: 'external',
        violation: {
          domain,
          url,
          anchorText,
          ruleType: 'unapproved',
          severity: 'warning',
          suggestion: 'Consider using government, BLS, or nonprofit sources',
          message: `External link to ${domain} is not on the approved list. Review carefully.`,
        },
      };
    }

    // Link is valid and allowed
    return { isValid: true, type: 'external' };
  }

  /**
   * Check compliance for content
   */
  async checkCompliance(content: string): Promise<ComplianceResult> {
    // Ensure rules are loaded
    if (!this.rulesLoaded) {
      await this.loadDomainRules();
    }

    const links = this.extractLinksFromContent(content);
    const result: ComplianceResult = {
      isCompliant: true,
      violations: [],
      allowedLinks: [],
      blockedCount: 0,
      warningCount: 0,
      totalLinks: links.length,
      internalLinks: 0,
      externalLinks: 0,
      anchorLinks: 0,
    };

    for (const link of links) {
      const validation = this.validateLink(link.url, link.anchorText);

      // Count by type
      switch (validation.type) {
        case 'internal':
          result.internalLinks++;
          result.allowedLinks.push(link.url);
          break;
        case 'anchor':
          result.anchorLinks++;
          break;
        case 'external':
          result.externalLinks++;
          if (validation.isValid && !validation.violation) {
            result.allowedLinks.push(link.url);
          }
          break;
        case 'invalid':
          // Handled by violation below
          break;
      }

      // Collect violations
      if (validation.violation) {
        result.violations.push(validation.violation);

        if (validation.violation.severity === 'error') {
          result.blockedCount++;
          result.isCompliant = false;
        } else {
          result.warningCount++;
        }
      }
    }

    return result;
  }

  /**
   * Add a domain rule for the tenant
   */
  async addDomainRule(
    domain: string,
    ruleType: 'blocked' | 'allowed' | 'competitor' | 'trusted',
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('tenant_domain_rules')
        .insert({
          tenant_id: this.tenantId,
          domain: domain.toLowerCase(),
          rule_type: ruleType,
          reason,
          match_subdomains: true,
          is_active: true,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      // Reload rules
      await this.loadDomainRules();

      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  /**
   * Remove a domain rule
   */
  async removeDomainRule(ruleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('tenant_domain_rules')
        .delete()
        .eq('id', ruleId)
        .eq('tenant_id', this.tenantId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Reload rules
      await this.loadDomainRules();

      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  /**
   * Get all domain rules for the tenant
   */
  async getDomainRules(): Promise<DomainRule[]> {
    try {
      const { data, error } = await this.supabase
        .from('tenant_domain_rules')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching domain rules:', error);
        return [];
      }

      return (data as DomainRule[]) || [];
    } catch (err) {
      console.error('Exception fetching domain rules:', err);
      return [];
    }
  }

  /**
   * Increment the times_blocked counter for a domain rule
   */
  async incrementBlockedCount(domain: string): Promise<void> {
    try {
      await this.supabase.rpc('increment_domain_block_count', {
        p_tenant_id: this.tenantId,
        p_domain: domain,
      });
    } catch (err) {
      // Silent fail - this is just for analytics
      console.debug('Could not increment block count:', err);
    }
  }
}

/**
 * Factory function to create a LinkComplianceService instance
 */
export function createLinkComplianceService(
  supabaseUrl: string,
  supabaseKey: string,
  tenantId: string
): LinkComplianceService {
  return new LinkComplianceService(supabaseUrl, supabaseKey, tenantId);
}

export default LinkComplianceService;
