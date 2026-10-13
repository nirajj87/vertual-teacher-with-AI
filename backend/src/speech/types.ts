export interface TranscriptionResult {
  transcript: string;
  confidence?: number;
  language?: string;
  durationMs?: number;
}

export interface SynthesisResult {
  /** Base64-encoded audio for client playback */
  audioBase64: string;
  mimeType: string;
  /** Cache key hash */
  cacheKey?: string;
}

export interface SynthesisOptions {
  voice?: string;
  speed?: number;
  language?: string;
}

export interface STTProvider {
  readonly name: string;
  transcribe(audio: Buffer, mimeType: string, language?: string): Promise<TranscriptionResult>;
}

export interface TTSProvider {
  readonly name: string;
  synthesize(text: string, options?: SynthesisOptions): Promise<SynthesisResult>;
}

export interface SpeechConfig {
  sttProvider: string;
  ttsProvider: string;
  browserSttAvailable: boolean;
  browserTtsAvailable: boolean;
  supportedAudioFormats: string[];
  voices: Array<{ id: string; name: string; gender?: string }>;
}
