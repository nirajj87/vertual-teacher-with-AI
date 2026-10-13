export interface SpeechConfig {
  sttProvider: string;
  ttsProvider: string;
  browserSttAvailable: boolean;
  browserTtsAvailable: boolean;
  supportedAudioFormats: string[];
  voices: Array<{ id: string; name: string; gender?: string }>;
}

export interface TranscriptionResponse {
  transcript: string;
  confidence?: number;
  cached: boolean;
}

export interface SynthesisResponse {
  audioBase64: string;
  mimeType: string;
  provider: string;
  useBrowser: boolean;
  text: string;
  cached: boolean;
}
