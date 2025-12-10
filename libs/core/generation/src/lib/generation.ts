// Core Generation Library
export * from './types';
export { GrokProvider } from './providers/grok';
export { ClaudeProvider } from './providers/claude';

// Re-export for convenience
import { GrokProvider } from './providers/grok';
import { ClaudeProvider } from './providers/claude';
import { AIProvider, AIProviderConfig } from './types';

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
    default:
      throw new Error('Unsupported provider: ' + config.provider);
  }
}
