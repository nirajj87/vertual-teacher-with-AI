import { z } from 'zod';

export const createBankSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  topic: z.string().max(200).optional(),
});

export const updateBankSchema = createBankSchema.partial();

export const createQuestionSchema = z.object({
  text: z.string().min(5).max(5000),
  expectedAnswer: z.string().max(5000).optional(),
  topic: z.string().max(200).optional(),
  difficulty: z.enum(['BEGINNER', 'MEDIUM', 'ADVANCED']).optional(),
});

export const importQuestionsSchema = z.object({
  bankId: z.string().uuid().optional(),
  bankName: z.string().min(1).max(200).optional(),
  topic: z.string().max(200).optional(),
  previewId: z.string().uuid(),
  questions: z.array(
    z.object({
      question: z.string().min(3),
      expectedAnswer: z.string().optional(),
      topic: z.string().optional(),
    })
  ).min(1),
});

export const startPracticeSchema = z.object({
  bankId: z.string().uuid().optional(),
  difficulty: z.enum(['BEGINNER', 'MEDIUM', 'ADVANCED']).default('MEDIUM'),
  questionCount: z.number().min(1).max(50).default(10),
  topic: z.string().max(200).optional(),
  source: z.enum(['bank', 'ai', 'mixed']).default('bank'),
  questionIds: z.array(z.string().uuid()).optional(),
  mode: z.enum(['PRACTICE', 'ENGLISH', 'INTERVIEW', 'VOCABULARY', 'GRAMMAR']).default('PRACTICE'),
});

export const submitAnswerSchema = z.object({
  answerText: z.string().min(1).max(10000),
  answerType: z.enum(['WRITTEN', 'VOICE']).default('WRITTEN'),
});

export type CreateBankInput = z.infer<typeof createBankSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type ImportQuestionsInput = z.infer<typeof importQuestionsSchema>;
export type StartPracticeInput = z.infer<typeof startPracticeSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
