/**
 * @content-engine/config
 *
 * Shared configuration library for the Meta Content Engine monorepo.
 * Provides centralized access to environment variables and configuration.
 *
 * @example
 * ```typescript
 * import { env, validateEnv } from '@content-engine/config';
 *
 * // Validate on app startup
 * validateEnv();
 *
 * // Use configuration
 * console.log(env.appName);
 * console.log(env.isDevelopment);
 * ```
 */

export {
  env,
  validateEnv,
  logEnvConfig,
  type EnvConfig,
  type EnvironmentVariables,
} from './lib/env';
