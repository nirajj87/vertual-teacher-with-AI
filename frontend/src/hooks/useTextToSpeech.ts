import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseTextToSpeechOptions {
  voicePreference?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  defaultSpeed?: number;
  autoPlay?: boolean;
}

export interface UseTextToSpeechReturn {
  isPlaying: boolean;
  isPaused: boolean;
  speed: number;
  isSupported: boolean;
  speak: (text: string, serverAudio?: { base64: string; mimeType: string }) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  replay: () => void;
  setSpeed: (speed: number) => void;
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}): UseTextToSpeechReturn {
  const { voicePreference = 'FEMALE', defaultSpeed = 1, autoPlay = false } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeedState] = useState(defaultSpeed);

  const lastTextRef = useRef('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const pickVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const preferFemale = voicePreference === 'FEMALE';
    const preferMale = voicePreference === 'MALE';

    const english = voices.filter((v) => v.lang.startsWith('en'));
    const pool = english.length ? english : voices;

    if (preferFemale) {
      return pool.find((v) => v.name.toLowerCase().includes('female') || v.name.includes('Samantha') || v.name.includes('Zira')) || pool[0];
    }
    if (preferMale) {
      return pool.find((v) => v.name.toLowerCase().includes('male') || v.name.includes('David') || v.name.includes('Mark')) || pool[0];
    }
    return pool[0];
  }, [voicePreference]);

  const speakBrowser = useCallback(
    (text: string) => {
      return new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speed;
        utterance.voice = pickVoice();
        utteranceRef.current = utterance;

        utterance.onstart = () => {
          setIsPlaying(true);
          setIsPaused(false);
        };
        utterance.onend = () => {
          setIsPlaying(false);
          setIsPaused(false);
          resolve();
        };
        utterance.onerror = () => {
          setIsPlaying(false);
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      });
    },
    [speed, pickVoice]
  );

  const speakServer = useCallback(
    (base64: string, mimeType: string) => {
      return new Promise<void>((resolve) => {
        stop();
        const audio = new Audio(`data:${mimeType};base64,${base64}`);
        audio.playbackRate = speed;
        audioRef.current = audio;

        audio.onplay = () => {
          setIsPlaying(true);
          setIsPaused(false);
        };
        audio.onended = () => {
          setIsPlaying(false);
          resolve();
        };
        audio.onerror = () => {
          setIsPlaying(false);
          resolve();
        };

        audio.play().catch(() => resolve());
      });
    },
    [speed, stop]
  );

  const speak = useCallback(
    async (text: string, serverAudio?: { base64: string; mimeType: string }) => {
      lastTextRef.current = text;
      stop();

      if (serverAudio?.base64) {
        await speakServer(serverAudio.base64, serverAudio.mimeType);
      } else if (isSupported) {
        await speakBrowser(text);
      }
    },
    [stop, speakServer, speakBrowser, isSupported]
  );

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
    } else if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPaused(false);
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const replay = useCallback(() => {
    if (lastTextRef.current) speak(lastTextRef.current);
  }, [speak]);

  const setSpeed = useCallback((s: number) => {
    setSpeedState(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }, []);

  useEffect(() => {
    if (autoPlay && lastTextRef.current) {
      speak(lastTextRef.current);
    }
  }, [autoPlay]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load voices
  useEffect(() => {
    if (isSupported) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, [isSupported]);

  return { isPlaying, isPaused, speed, isSupported, speak, pause, resume, stop, replay, setSpeed };
}
