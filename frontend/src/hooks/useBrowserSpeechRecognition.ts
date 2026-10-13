import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string; confidence: number };
  }>;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export interface UseBrowserSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  interimTranscript: string;
  finalTranscript: string;
  error: string | null;
  start: (lang?: string) => void;
  stop: () => string;
  abort: () => void;
  reset: () => void;
}

export function useBrowserSpeechRecognition(): UseBrowserSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef('');
  const shouldRestartRef = useRef(false);

  const Ctor = getSpeechRecognitionCtor();
  const isSupported = !!Ctor;

  const reset = useCallback(() => {
    finalRef.current = '';
    setFinalTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  const abort = useCallback(() => {
    shouldRestartRef.current = false;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const stop = useCallback((): string => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setInterimTranscript('');
    return finalRef.current.trim();
  }, []);

  const start = useCallback(
    (lang = 'en-US') => {
      if (!Ctor) {
        setError('Speech recognition is not supported in this browser. Use Chrome or Edge.');
        return;
      }

      reset();
      shouldRestartRef.current = true;

      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        let interim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;
          if (result.isFinal) finalChunk += text;
          else interim += text;
        }

        if (finalChunk) {
          finalRef.current = `${finalRef.current} ${finalChunk}`.trim();
          setFinalTranscript(finalRef.current);
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event) => {
        const code = event.error || 'unknown';
        if (code === 'aborted' || code === 'no-speech') return;
        if (code === 'not-allowed') {
          setError('Microphone permission denied for speech recognition.');
          shouldRestartRef.current = false;
          setIsListening(false);
          return;
        }
        setError(`Speech recognition error: ${code}`);
      };

      recognition.onend = () => {
        // Chrome often ends recognition mid-session — restart while active
        if (shouldRestartRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
            return;
          } catch {
            // ignore restart races
          }
        }
        setIsListening(false);
      };

      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start speech recognition');
        setIsListening(false);
      }
    },
    [Ctor, reset]
  );

  useEffect(() => () => abort(), [abort]);

  return {
    isSupported,
    isListening,
    interimTranscript,
    finalTranscript,
    error,
    start,
    stop,
    abort,
    reset,
  };
}
