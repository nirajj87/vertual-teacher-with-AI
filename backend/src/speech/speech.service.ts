import fs from 'fs';
import { getSTTProvider } from './stt/factory';
import { getTTSProvider } from './tts/factory';
import { cacheService } from '../cache/cache.service';
import { hashContent } from '../utils/hash';
import { aiUsageService } from '../services/aiUsage.service';
import { SpeechConfig, TranscriptionResult, SynthesisResult } from './types';
import { env } from '../config/env';
import { prisma } from '../config/database';

const AUDIO_TTL = 30 * 24 * 3600; // 30 days
const TRANSCRIPT_TTL = 3600; // 1 hour

export class SpeechService {
  getConfig(): SpeechConfig {
    return {
      sttProvider: env.STT_PROVIDER,
      ttsProvider: env.TTS_PROVIDER,
      browserSttAvailable: true,
      browserTtsAvailable: true,
      supportedAudioFormats: ['audio/webm', 'audio/wav', 'audio/mp4', 'audio/mpeg', 'audio/ogg'],
      voices: [
        { id: 'FEMALE', name: 'Female', gender: 'female' },
        { id: 'MALE', name: 'Male', gender: 'male' },
        { id: 'NEUTRAL', name: 'Neutral', gender: 'neutral' },
      ],
    };
  }

  async transcribe(
    userId: string,
    audioPath: string,
    mimeType: string,
    language?: string,
    sessionId?: string
  ): Promise<TranscriptionResult & { cached: boolean }> {
    const buffer = fs.readFileSync(audioPath);
    const audioHash = hashContent(buffer.toString('base64').slice(0, 1000));
    const cacheKey = `transcript:${audioHash}`;

    const cached = await cacheService.get<TranscriptionResult>(cacheKey);
    if (cached) {
      if (sessionId) {
        await cacheService.set(`transcript:session:${sessionId}`, cached, TRANSCRIPT_TTL);
      }
      fs.unlinkSync(audioPath);
      return { ...cached, cached: true };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, settings: true },
    });
    const settings = user?.settings?.voice as { sttProvider?: string } | null;
    const provider = getSTTProvider(settings?.sttProvider || env.STT_PROVIDER);

    const start = Date.now();
    const result = await provider.transcribe(buffer, mimeType, language || user?.profile?.preferredLanguage || 'en');

    await aiUsageService.logUsage({
      userId,
      provider: provider.name,
      model: provider.name === 'openai' ? 'whisper-1' : 'browser',
      requestType: 'speech_to_text',
      responseTimeMs: Date.now() - start,
    });

    await cacheService.set(cacheKey, result, TRANSCRIPT_TTL);
    if (sessionId) {
      await cacheService.set(`transcript:session:${sessionId}`, result, TRANSCRIPT_TTL);
    }

    fs.unlinkSync(audioPath);
    return { ...result, cached: false };
  }

  async synthesize(
    userId: string,
    text: string,
    options: { voice?: string; speed?: number } = {}
  ): Promise<SynthesisResult & { provider: string; useBrowser: boolean; text: string; cached: boolean }> {
    const textHash = hashContent(text + (options.voice || '') + (options.speed || 1));
    const cacheKey = `tts:${textHash}`;

    const cached = await cacheService.get<SynthesisResult>(cacheKey);
    if (cached?.audioBase64) {
      return { ...cached, provider: env.TTS_PROVIDER, useBrowser: false, text, cached: true };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, settings: true },
    });
    const voiceSettings = user?.settings?.voice as { ttsProvider?: string; speed?: number } | null;
    const voicePref = options.voice || user?.profile?.voicePreference || 'FEMALE';
    const speed = options.speed ?? voiceSettings?.speed ?? 1.0;

    const provider = getTTSProvider(voiceSettings?.ttsProvider || env.TTS_PROVIDER);

    if (provider.name === 'browser') {
      return {
        audioBase64: '',
        mimeType: 'text/plain',
        provider: 'browser',
        useBrowser: true,
        text,
        cached: false,
      };
    }

    const start = Date.now();
    const result = await provider.synthesize(text, { voice: voicePref, speed });

    await aiUsageService.logUsage({
      userId,
      provider: provider.name,
      model: provider.name === 'openai' ? 'tts-1' : 'browser',
      requestType: 'text_to_speech',
      responseTimeMs: Date.now() - start,
    });

    if (result.audioBase64) {
      await cacheService.set(cacheKey, result, AUDIO_TTL);
    }

    return { ...result, provider: provider.name, useBrowser: !result.audioBase64, text, cached: false };
  }

  async getSessionTranscript(sessionId: string, userId: string) {
    const session = await prisma.practiceSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) return null;
    return cacheService.get(`transcript:session:${sessionId}`);
  }

  async saveDraftTranscript(sessionId: string, userId: string, transcript: string) {
    const session = await prisma.practiceSession.findFirst({
      where: { id: sessionId, userId, status: 'ACTIVE' },
    });
    if (!session) return;

    await cacheService.set(
      `session:draft:${userId}`,
      { sessionId, draftAnswer: transcript, updatedAt: new Date().toISOString() },
      86400
    );
  }
}

export const speechService = new SpeechService();
