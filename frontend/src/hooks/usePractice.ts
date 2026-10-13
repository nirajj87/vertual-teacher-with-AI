import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  QuestionBank,
  ImportPreview,
  PracticeSession,
  CurrentQuestion,
  SubmitAnswerResult,
  SessionSummary,
} from '@/types/practice';

export function useQuestionBanks(page = 1) {
  return useQuery({
    queryKey: ['question-banks', page],
    queryFn: async () => {
      const { data } = await api.get('/question-banks', { params: { page } });
      return data.data as { banks: QuestionBank[]; total: number };
    },
  });
}

export function useQuestionBank(id: string) {
  return useQuery({
    queryKey: ['question-bank', id],
    queryFn: async () => {
      const { data } = await api.get(`/question-banks/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useUploadPreview() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/question-banks/upload/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data as ImportPreview;
    },
  });
}

export function useConfirmImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      previewId: string;
      bankId?: string;
      bankName?: string;
      topic?: string;
      questions: Array<{ question: string; expectedAnswer?: string; topic?: string }>;
    }) => {
      const { data } = await api.post('/question-banks/upload/confirm', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
    },
  });
}

export function useActiveSession() {
  return useQuery({
    queryKey: ['active-session'],
    queryFn: async () => {
      const { data } = await api.get('/practice/active');
      return data.data as PracticeSession | null;
    },
  });
}

export function useStartPractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      bankId?: string;
      difficulty: string;
      questionCount: number;
      topic?: string;
      source: 'bank' | 'ai' | 'mixed';
      mode?: 'PRACTICE' | 'ENGLISH' | 'INTERVIEW' | 'VOCABULARY' | 'GRAMMAR';
    }) => {
      const { data } = await api.post('/practice/sessions', payload);
      return data.data as PracticeSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-session'] });
    },
  });
}

export function useCurrentQuestion(sessionId: string) {
  return useQuery({
    queryKey: ['current-question', sessionId],
    queryFn: async () => {
      const { data } = await api.get(`/practice/sessions/${sessionId}/current`);
      return data.data as CurrentQuestion;
    },
    enabled: !!sessionId,
  });
}

export function useSubmitAnswer(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      answerText,
      answerType = 'WRITTEN',
    }: {
      answerText: string;
      answerType?: 'WRITTEN' | 'VOICE';
    }) => {
      const { data } = await api.post(`/practice/sessions/${sessionId}/answer`, {
        answerText,
        answerType,
      });
      return data.data as SubmitAnswerResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-question', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['active-session'] });
    },
  });
}

export function useSessionSummary(sessionId: string) {
  return useQuery({
    queryKey: ['session-summary', sessionId],
    queryFn: async () => {
      // Prefer complete (computes average + weak areas), then fall back to summary GET
      try {
        const { data } = await api.post(`/practice/sessions/${sessionId}/complete`);
        if (data?.data) return data.data as SessionSummary;
      } catch {
        // already completed or complete failed — still load summary
      }
      const { data } = await api.get(`/practice/sessions/${sessionId}/summary`);
      return data.data as SessionSummary;
    },
    enabled: !!sessionId,
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePracticeHistory(page = 1) {
  return useQuery({
    queryKey: ['practice-history', page],
    queryFn: async () => {
      const { data } = await api.get('/practice/history', { params: { page } });
      return data.data;
    },
  });
}

export function useAbandonSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await api.post(`/practice/sessions/${sessionId}/abandon`);
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['active-session'] });
      queryClient.invalidateQueries({ queryKey: ['current-question', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['practice-history'] });
    },
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      mode,
    }: {
      sessionId: string;
      mode: 'review' | 'discard';
    }) => {
      if (mode === 'discard') {
        await api.post(`/practice/sessions/${sessionId}/abandon`);
        return { mode: 'discard' as const, sessionId };
      }
      const { data } = await api.post(`/practice/sessions/${sessionId}/complete`);
      return { mode: 'review' as const, sessionId, summary: data.data as SessionSummary };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['active-session'] });
      queryClient.invalidateQueries({ queryKey: ['current-question', result.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['practice-history'] });
      queryClient.invalidateQueries({ queryKey: ['session-summary', result.sessionId] });
    },
  });
}

export function useGetHint(sessionId: string) {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/practice/sessions/${sessionId}/hint`);
      return data.data as { hint: string };
    },
  });
}
