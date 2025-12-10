/**
 * Environment Configuration
 *
 * Centralized environment variable access with type safety.
 * All environment variables should be accessed through this module
 * to ensure consistent behavior across the monorepo.
 *
 * @module @content-engine/config
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * All known environment variables in the system
 */
export interface EnvironmentVariables {
  // Supabase
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;

  // App Configuration
  VITE_TENANT_ID?: string;
  VITE_APP_NAME?: string;
  VITE_APP_DESCRIPTION?: string;
  VITE_ENVIRONMENT?: 'development' | 'staging' | 'production';

  // Feature Flags
  VITE_FLAGSMITH_ENVIRONMENT_ID?: string;
  VITE_FLAGSMITH_API_URL?: string;

  // Development Settings
  VITE_DEBUG?: string;
  VITE_SKIP_AUTH?: string;
  VITE_MOCK_AI?: string;
}

/**
 * Environment configuration object
 */
export interface EnvConfig {
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;

  // App
  tenantId: string | null;
  appName: string;
  appDescription: string;
  environment: 'development' | 'staging' | 'production';

  // Feature Flags
  flagsmith: {
    environmentId: string | null;
    apiUrl: string;
  };

  // Development
  debug: boolean;
  skipAuth: boolean;
  mockAI: boolean;

  // Computed
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get an environment variable with fallback
 */
function getEnv(key: keyof EnvironmentVariables, fallback = ''): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env[key] as string) || fallback;
  }
  return fallback;
}

/**
 * Parse a boolean environment variable
 */
function getBoolEnv(key: keyof EnvironmentVariables, fallback = false): boolean {
  const value = getEnv(key, '').toLowerCase();
  if (value === 'true' || value === '1' || value === 'yes') return true;
  if (value === 'false' || value === '0' || value === 'no') return false;
  return fallback;
}

// ============================================
// CONFIGURATION OBJECT
// ============================================

/**
 * Centralized environment configuration
 *
 * This object provides type-safe access to all environment variables
 * with sensible defaults and computed properties.
 *
 * @example
 * ```typescript
 * import { env } from '@content-engine/config';
 *
 * // Access Supabase credentials
 * const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);
 *
 * // Check environment
 * if (env.isDevelopment) {
 *   console.log('Running in development mode');
 * }
 *
 * // Access feature flags
 * if (env.flagsmith.environmentId) {
 *   // Initialize Flagsmith
 * }
 * ```
 */
export const env: EnvConfig = {
  // Supabase Configuration
  supabaseUrl: getEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: getEnv('VITE_SUPABASE_ANON_KEY'),

  // App Configuration
  tenantId: getEnv('VITE_TENANT_ID') || null,
  appName: getEnv('VITE_APP_NAME', 'Perdia'),
  appDescription: getEnv('VITE_APP_DESCRIPTION', 'AI-Powered Content Generation'),
  environment: (getEnv('VITE_ENVIRONMENT', 'development') as EnvConfig['environment']),

  // Feature Flags (Flagsmith)
  flagsmith: {
    environmentId: getEnv('VITE_FLAGSMITH_ENVIRONMENT_ID') || null,
    apiUrl: getEnv('VITE_FLAGSMITH_API_URL', 'https://edge.api.flagsmith.com/api/v1/'),
  },

  // Development Settings
  debug: getBoolEnv('VITE_DEBUG', false),
  skipAuth: getBoolEnv('VITE_SKIP_AUTH', false),
  mockAI: getBoolEnv('VITE_MOCK_AI', false),

  // Computed Properties
  get isDevelopment() {
    return this.environment === 'development';
  },
  get isProduction() {
    return this.environment === 'production';
  },
  get isStaging() {
    return this.environment === 'staging';
  },
};

// ============================================
// VALIDATION
// ============================================

/**
 * Validate that required environment variables are set
 *
 * @throws Error if required variables are missing in production
 * @returns Array of warning messages for missing optional variables
 */
export function validateEnv(): string[] {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Required in all environments
  if (!env.supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  if (!env.supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }

  // Required in production
  if (env.isProduction) {
    if (!env.tenantId) {
      warnings.push('VITE_TENANT_ID should be set in production');
    }
    if (env.skipAuth) {
      errors.push('VITE_SKIP_AUTH must be false in production');
    }
    if (env.mockAI) {
      warnings.push('VITE_MOCK_AI should be false in production');
    }
  }

  // Optional but recommended
  if (!env.flagsmith.environmentId) {
    warnings.push('VITE_FLAGSMITH_ENVIRONMENT_ID not set - feature flags disabled');
  }

  // Throw errors in production
  if (errors.length > 0 && env.isProduction) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }

  // Log warnings in development
  if (env.isDevelopment) {
    warnings.forEach((w) => console.warn(`[env] ${w}`));
    errors.forEach((e) => console.error(`[env] ${e}`));
  }

  return [...errors, ...warnings];
}

// ============================================
// DEBUG UTILITIES
// ============================================

/**
 * Log current environment configuration (safe - no secrets)
 */
export function logEnvConfig(): void {
  if (!env.debug) return;

  console.group('[env] Configuration');
  console.log('Environment:', env.environment);
  console.log('App Name:', env.appName);
  console.log('Tenant ID:', env.tenantId || '(not set)');
  console.log('Supabase URL:', env.supabaseUrl ? '(set)' : '(not set)');
  console.log('Flagsmith:', env.flagsmith.environmentId ? '(enabled)' : '(disabled)');
  console.log('Debug:', env.debug);
  console.log('Mock AI:', env.mockAI);
  console.groupEnd();
}

export default env;
