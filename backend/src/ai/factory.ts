import { AIProvider } from './types';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { GeminiProvider, OpenAIProvider, MockAIProvider } from './providers/gemini.provider';

export class AIProviderFactory {
  static create(provider?: string): AIProvider {
    const selected = provider || env.AI_PROVIDER;
    logger.debug('Creating AI provider', { provider: selected });

    switch (selected) {
      case 'openai':
        if (!env.OPENAI_API_KEY) {
          logger.warn('OpenAI key missing, falling back to mock provider');
          return new MockAIProvider();
        }
        return new OpenAIProvider();
      case 'ollama':
      case 'mock':
        return new MockAIProvider();
      case 'gemini':
      default:
        if (!env.GEMINI_API_KEY) {
          logger.warn('Gemini key missing, falling back to mock provider');
          return new MockAIProvider();
        }
        return new GeminiProvider();
    }
  }
}

export function getAIProvider(preferred?: string): AIProvider {
  // Prefer explicit env provider (e.g. gemini) over stale user settings defaults
  const preferredLower = preferred?.toLowerCase();
  if (env.AI_PROVIDER === 'gemini' && env.GEMINI_API_KEY) {
    return AIProviderFactory.create('gemini');
  }
  if (env.AI_PROVIDER === 'openai' && env.OPENAI_API_KEY) {
    return AIProviderFactory.create('openai');
  }
  return AIProviderFactory.create(preferredLower || env.AI_PROVIDER);
}
