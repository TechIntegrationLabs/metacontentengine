// Core Generation Library
export * from './types';
export { GrokProvider } from './providers/grok';
export { ClaudeProvider } from './providers/claude';
export { StealthGPTProvider } from './providers/stealthgpt';

// Re-export for convenience
import { GrokProvider } from './providers/grok';
import { ClaudeProvider } from './providers/claude';
import { StealthGPTProvider } from './providers/stealthgpt';
import {
  AIProvider,
  AIProviderConfig,
  StealthGPTProviderConfig,
  StealthGPTHumanizeOptions,
} from './types';

/**
 * Create an AI provider instance from configuration
 */
export function createProvider(config: AIProviderConfig): AIProvider {
  switch (config.provider) {
    case 'grok':
      return new GrokProvider({
        apiKey: config.apiKey,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });
    case 'claude':
      return new ClaudeProvider({
        apiKey: config.apiKey,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });
    case 'stealthgpt':
      return new StealthGPTProvider({
        apiKey: config.apiKey,
      });
    default:
      throw new Error('Unsupported provider: ' + config.provider);
  }
}

/**
 * Create a StealthGPT provider with advanced configuration
 * Use this for full control over humanization settings
 */
export function createStealthGPTProvider(config: StealthGPTProviderConfig): StealthGPTProvider {
  return new StealthGPTProvider(config);
}

/**
 * Create a configured StealthGPT provider from environment variables
 * Automatically configures Edge Function proxy for production use
 */
export function createStealthGPTProviderFromEnv(options?: {
  apiKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  useEdgeFunction?: boolean;
  defaultOptions?: Partial<StealthGPTHumanizeOptions>;
}): StealthGPTProvider {
  // In a real implementation, these would come from environment
  // For now, accept them as parameters with fallbacks
  const apiKey = options?.apiKey || '';
  const supabaseUrl = options?.supabaseUrl;
  const supabaseAnonKey = options?.supabaseAnonKey;

  return new StealthGPTProvider({
    apiKey,
    supabaseUrl,
    supabaseAnonKey,
    useEdgeFunction: options?.useEdgeFunction ?? !!supabaseUrl,
    defaultOptions: options?.defaultOptions,
  });
}
