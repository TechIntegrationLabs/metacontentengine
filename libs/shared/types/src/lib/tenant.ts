/**
 * Tenant Types - Multi-tenant architecture
 */

export interface Tenant {
  id: string;
  name: string;
  slug: string;

  // Branding
  appName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;

  // Domain configuration
  primaryDomain?: string;
  allowedDomains: string[];
  blockedDomains: string[];

  // Subscription
  plan: TenantPlan;
  status: TenantStatus;

  // Feature flags
  features: TenantFeatures;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export type TenantPlan = 'starter' | 'professional' | 'enterprise' | 'custom';
export type TenantStatus = 'active' | 'suspended' | 'trial' | 'cancelled';

export interface TenantFeatures {
  maxContributors: number;
  maxArticlesPerMonth: number;
  aiGenerationEnabled: boolean;
  wordpressPublishing: boolean;
  customDomains: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  advancedAnalytics: boolean;
}

export interface TenantSettings {
  id: string;
  tenantId: string;
  key: string;
  value: unknown;
}

export interface TenantApiKey {
  id: string;
  tenantId: string;
  service: 'grok' | 'claude' | 'openai' | 'stealthgpt' | 'wordpress' | 'custom';
  encryptedKey: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

export interface TenantBranding {
  tenantId: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  customCss?: string;
}

// Tenant context for React
export interface TenantContextType {
  tenant: Tenant | null;
  tenantId: string | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
