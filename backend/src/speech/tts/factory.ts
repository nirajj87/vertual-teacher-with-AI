import { TTSProvider } from '../types';
import { OpenAITTSProvider, BrowserTTSProvider, MockTTSProvider } from './openai.tts';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export class TTSProviderFactory {
  static create(provider?: string): TTSProvider {
    const selected = provider || env.TTS_PROVIDER;
    logger.debug('Creating TTS provider', { provider: selected });

    switch (selected) {
      case 'openai':
        if (env.OPENAI_API_KEY) return new OpenAITTSProvider();
        logger.warn('OpenAI key missing for TTS, using browser fallback');
        return new BrowserTTSProvider();
      case 'browser':
        return new BrowserTTSProvider();
      case 'mock':
        return new MockTTSProvider();
      default:
        return env.OPENAI_API_KEY ? new OpenAITTSProvider() : new BrowserTTSProvider();
    }
  }
}

export function getTTSProvider(preferred?: string): TTSProvider {
  return TTSProviderFactory.create(preferred);
}
