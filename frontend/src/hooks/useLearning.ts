import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useEnglishOverview() {
  return useQuery({
    queryKey: ['english-overview'],
    queryFn: async () => {
      const { data } = await api.get('/english/overview');
      return data.data;
    },
  });
}

export function useVocabulary(count = 6) {
  return useQuery({
    queryKey: ['vocabulary', count],
    queryFn: async () => {
      const { data } = await api.get('/english/vocabulary', { params: { count } });
      return data.data as {
        words: Array<{
          word: string;
          meaning: string;
          example: string;
          synonyms: string[];
          antonyms: string[];
        }>;
      };
    },
  });
}

export function useGrammarTopics() {
  return useQuery({
    queryKey: ['grammar-topics'],
    queryFn: async () => {
      const { data } = await api.get('/english/grammar/topics');
      return data.data as {
        topics: Array<{ id: string; name: string; description: string }>;
      };
    },
  });
}

export function useCorrectEnglish() {
  return useMutation({
    mutationFn: async (text: string) => {
      const { data } = await api.post('/english/correct', { text });
      return data.data as {
        original: string;
        corrected: string;
        explanation: string;
        errors: string[];
      };
    },
  });
}

export function useStartInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      interviewType: string;
      targetJob?: string;
      technology?: string;
      company?: string;
      difficulty?: string;
      questionCount?: number;
    }) => {
      const { data } = await api.post('/interview/sessions', payload);
      return data.data as {
        interviewId: string;
        sessionId: string;
        interviewType: string;
        totalQuestions: number;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-session'] });
      queryClient.invalidateQueries({ queryKey: ['interview-history'] });
    },
  });
}

export function useInterviewHistory() {
  return useQuery({
    queryKey: ['interview-history'],
    queryFn: async () => {
      const { data } = await api.get('/interview/history');
      return data.data;
    },
  });
}

export function useInterviewAnalytics() {
  return useQuery({
    queryKey: ['interview-analytics'],
    queryFn: async () => {
      const { data } = await api.get('/interview/analytics');
      return data.data;
    },
  });
}

export function useProgressOverview() {
  return useQuery({
    queryKey: ['progress-overview'],
    queryFn: async () => {
      const { data } = await api.get('/progress');
      return data.data;
    },
  });
}

export function useWeakAreas() {
  return useQuery({
    queryKey: ['weak-areas'],
    queryFn: async () => {
      const { data } = await api.get('/progress/weak-areas');
      return data.data as {
        weakAreas: Array<{
          id: string;
          category: string;
          topic: string;
          severity: number;
          count: number;
          rating?: number;
          ratingLabel?: string;
          whatToImprove?: string[];
          feedback?: string;
          suggestedMode?: string;
          averageScore?: number;
          totalAttempts?: number;
          focusPlan?: { action: string; summary: string; minutes: number; mode: string };
        }>;
        recommendations: Array<{
          topic: string;
          category: string;
          suggestedMode: string;
          action: string;
          rating?: number;
          ratingLabel?: string;
          whatToImprove?: string[];
          minutes?: number;
        }>;
      };
    },
  });
}

export function useLearningPlan() {
  return useQuery({
    queryKey: ['learning-plan'],
    queryFn: async () => {
      const { data } = await api.get('/progress/learning-plan');
      return data.data;
    },
  });
}
