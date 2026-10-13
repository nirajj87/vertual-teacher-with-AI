import { env } from '../../config/env';
import { STTProvider, TranscriptionResult } from '../types';
import { logger } from '../../utils/logger';

export class OpenAISTTProvider implements STTProvider {
  readonly name = 'openai';

  async transcribe(audio: Buffer, mimeType: string, language = 'en'): Promise<TranscriptionResult> {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured for speech-to-text');
    }

    const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'wav';
    const formData = new FormData();
    formData.append('file', new Blob([audio], { type: mimeType }), `audio.${ext}`);
    formData.append('model', 'whisper-1');
    formData.append('language', language.split('-')[0]);

    const start = Date.now();
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Whisper API error: ${response.status} ${err}`);
    }

    const data = (await response.json()) as { text: string };
    logger.debug('STT completed', { provider: 'openai', durationMs: Date.now() - start });

    return {
      transcript: data.text.trim(),
      confidence: 0.9,
      language,
      durationMs: Date.now() - start,
    };
  }
}

/** Returns empty - browser handles STT client-side */
export class BrowserSTTProvider implements STTProvider {
  readonly name = 'browser';

  async transcribe(): Promise<TranscriptionResult> {
    throw new Error('Browser STT is handled client-side via Web Speech API');
  }
}

export class MockSTTProvider implements STTProvider {
  readonly name = 'mock';

  async transcribe(_audio: Buffer, _mimeType: string): Promise<TranscriptionResult> {
    return {
      transcript: 'This is a mock transcription. Configure OPENAI_API_KEY for real speech-to-text.',
      confidence: 0.5,
    };
  }
}
