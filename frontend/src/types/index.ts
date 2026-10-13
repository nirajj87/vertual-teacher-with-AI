export interface UserProfile {
  id: string;
  name: string;
  profilePhoto: string | null;
  preferredLanguage: string;
  englishLevel: string;
  learningGoal: string | null;
  experienceLevel: string;
  targetRole: string | null;
  preferredAiProvider: string;
  voicePreference: string;
}

export interface UserSettings {
  theme: {
    mode: 'light' | 'dark' | 'system';
    accentColor: string;
  };
  notifications: {
    email: boolean;
    practiceReminders: boolean;
    weeklyReport: boolean;
  };
  practice: {
    defaultDifficulty: 'BEGINNER' | 'MEDIUM' | 'ADVANCED';
    questionsPerSession: number;
    showHints: boolean;
    autoAdvance: boolean;
  };
  ai: {
    provider: 'gemini' | 'openai' | 'ollama';
    maxTokens: number;
    temperature: number;
  };
  voice: {
    enabled: boolean;
    speed: number;
    autoPlayQuestions: boolean;
    sttProvider?: 'browser' | 'openai' | 'whisper' | 'mock';
    ttsProvider?: 'browser' | 'openai' | 'mock';
  };
}

export interface DashboardStats {
  greeting: string;
  streak: number;
  practiceTime: string;
  questionsAnswered: number;
  averageScore: number;
  totalSessions: number;
  weakAreas: string[];
  recommendedPractice: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}
