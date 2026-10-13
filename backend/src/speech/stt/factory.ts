import { STTProvider } from '../types';
import { OpenAISTTProvider, BrowserSTTProvider, MockSTTProvider } from './openai.stt';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export class STTProviderFactory {
  static create(provider?: string): STTProvider {
    const selected = provider || env.STT_PROVIDER;
    logger.debug('Creating STT provider', { provider: selected });

    switch (selected) {
      case 'openai':
      case 'whisper':
        if (env.OPENAI_API_KEY) return new OpenAISTTProvider();
        logger.warn('OpenAI key missing for STT, using mock');
        return new MockSTTProvider();
      case 'browser':
        return new BrowserSTTProvider();
      case 'mock':
        return new MockSTTProvider();
      default:
        return env.OPENAI_API_KEY ? new OpenAISTTProvider() : new MockSTTProvider();
    }
  }
}

export function getSTTProvider(preferred?: string): STTProvider {
  return STTProviderFactory.create(preferred);
}
