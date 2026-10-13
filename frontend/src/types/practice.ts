export interface QuestionBank {
  id: string;
  name: string;
  description: string | null;
  topic: string | null;
  createdAt: string;
  _count?: { questions: number };
}

export interface Question {
  id: string;
  text: string;
  topic: string | null;
  difficulty: string;
  hasExpectedAnswer: boolean;
  answer?: { text: string } | null;
}

export interface ImportPreviewItem {
  question: string;
  expectedAnswer?: string;
  topic?: string;
  status: 'available' | 'missing';
}

export interface ImportPreview {
  previewId: string;
  fileName: string;
  totalQuestions: number;
  withAnswers: number;
  missingAnswers: number;
  items: ImportPreviewItem[];
}

export interface PracticeSession {
  id: string;
  difficulty: string;
  status: string;
  totalQuestions: number;
  currentIndex: number;
  averageScore: number | null;
  topic: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface CurrentQuestion {
  sessionId: string;
  currentIndex: number;
  totalQuestions: number;
  difficulty: string;
  mode?: string;
  topic?: string | null;
  bankId?: string | null;
  question: {
    id: string;
    text: string;
    topic: string | null;
    difficulty: string;
    hasAnswer: boolean;
  };
}

export interface AnswerEvaluation {
  score: number;
  correctness: number;
  relevance: number;
  clarity: number;
  grammar?: number;
  technicalAccuracy?: number;
  communication?: number;
  strengths: string[];
  improvements: string[];
  correctAnswer: string;
  explanation: string;
  shortModelAnswer: string;
  confidence: number;
}

export interface SubmitAnswerResult {
  answerId: string;
  evaluation: AnswerEvaluation;
  nextIndex: number;
  isLast: boolean;
  questionIndex?: number;
  questionText?: string;
  provider?: string;
  model?: string;
}

export interface SessionSummary {
  sessionId: string;
  status: string;
  totalQuestions: number;
  answered: number;
  averageScore: number;
  durationMinutes: number;
  strongTopics: string[];
  weakTopics: string[];
  questions: Array<{
    question: string;
    yourAnswer: string;
    score: number;
    correctness?: number;
    relevance?: number;
    clarity?: number;
    grammar?: number;
    technicalAccuracy?: number;
    communication?: number;
    strengths: string[];
    improvements: string[];
    correctAnswer: string;
    shortModelAnswer?: string;
    explanation: string;
  }>;
}
