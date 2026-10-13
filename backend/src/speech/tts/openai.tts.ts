import { env } from '../../config/env';
import { TTSProvider, SynthesisResult, SynthesisOptions } from '../types';
import { logger } from '../../utils/logger';

const VOICE_MAP: Record<string, string> = {
  MALE: 'onyx',
  FEMALE: 'nova',
  NEUTRAL: 'alloy',
};

export class OpenAITTSProvider implements TTSProvider {
  readonly name = 'openai';

  async synthesize(text: string, options: SynthesisOptions = {}): Promise<SynthesisResult> {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured for text-to-speech');
    }

    const voice = options.voice || VOICE_MAP.FEMALE;
    const speed = options.speed ?? 1.0;

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.slice(0, 4096),
        voice: VOICE_MAP[voice.toUpperCase()] || voice,
        speed: Math.min(2, Math.max(0.5, speed)),
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI TTS error: ${response.status} ${err}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    logger.debug('TTS completed', { provider: 'openai', bytes: buffer.length });

    return {
      audioBase64: buffer.toString('base64'),
      mimeType: 'audio/mpeg',
    };
  }
}

export class BrowserTTSProvider implements TTSProvider {
  readonly name = 'browser';

  async synthesize(text: string): Promise<SynthesisResult> {
    // Signal client to use Web Speech API — no server audio generated
    return {
      audioBase64: '',
      mimeType: 'text/plain',
      cacheKey: `browser:${text.slice(0, 50)}`,
    };
  }
}

export class MockTTSProvider implements TTSProvider {
  readonly name = 'mock';

  async synthesize(text: string): Promise<SynthesisResult> {
    // Minimal silent MP3 header stub — client should use browser TTS
    void text;
    return {
      audioBase64: '',
      mimeType: 'audio/mpeg',
    };
  }
}
