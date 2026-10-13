import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { SpeechConfig, TranscriptionResponse, SynthesisResponse } from '@/types/speech';

export function useSpeechConfig() {
  return useQuery({
    queryKey: ['speech-config'],
    queryFn: async () => {
      const { data } = await api.get<{ data: SpeechConfig }>('/speech/config');
      return data.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useTranscribeAudio() {
  return useMutation({
    mutationFn: async ({ blob, sessionId, language }: { blob: Blob; sessionId?: string; language?: string }) => {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      if (sessionId) formData.append('sessionId', sessionId);
      if (language) formData.append('language', language);

      const { data } = await api.post<{ data: TranscriptionResponse }>('/speech/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data;
    },
  });
}

export function useSynthesizeSpeech() {
  return useMutation({
    mutationFn: async (payload: { text: string; voice?: string; speed?: number }) => {
      const { data } = await api.post<{ data: SynthesisResponse }>('/speech/synthesize', payload);
      return data.data;
    },
  });
}

export function useSaveDraftTranscript(sessionId: string) {
  return useMutation({
    mutationFn: async (transcript: string) => {
      await api.post(`/speech/sessions/${sessionId}/draft`, { transcript });
    },
  });
}
