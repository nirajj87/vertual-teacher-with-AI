import { z } from 'zod';

const scoreField = z.coerce.number().min(0).max(10);
const stringList = z
  .array(z.union([z.string(), z.number()]))
  .transform((arr) => arr.map(String))
  .catch([]);

export const EvaluationSchema = z.object({
  score: scoreField,
  correctness: scoreField.catch(5),
  relevance: scoreField.catch(5),
  clarity: scoreField.catch(5),
  grammar: scoreField.optional().catch(undefined),
  technicalAccuracy: scoreField.optional().catch(undefined),
  communication: scoreField.optional().catch(undefined),
  strengths: stringList,
  improvements: stringList,
  correctAnswer: z.coerce.string().catch('See model answer'),
  explanation: z.coerce.string().catch('Evaluation completed'),
  shortModelAnswer: z.coerce.string().catch(''),
  confidence: z.coerce.number().min(0).max(1).catch(0.7),
});

export type EvaluationResult = z.infer<typeof EvaluationSchema>;

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  generateAnswer(context: Record<string, unknown>): Promise<string>;
  evaluateAnswer(context: Record<string, unknown>): Promise<EvaluationResult>;
  generateQuestion(context: Record<string, unknown>): Promise<{
    question: string;
    topic?: string;
    expectedAnswer?: string;
  }>;
  generateQuestionBatch?(context: Record<string, unknown>): Promise<
    Array<{ question: string; topic?: string; expectedAnswer?: string }>
  >;
  generateHint(context: Record<string, unknown>): Promise<string>;
  generateExplanation(context: Record<string, unknown>): Promise<string>;
  correctEnglish(context: Record<string, unknown>): Promise<{
    original: string;
    corrected: string;
    explanation: string;
    errors: string[];
  }>;
  generateInterviewFeedback(context: Record<string, unknown>): Promise<Record<string, unknown>>;
  generateLearningPlan(context: Record<string, unknown>): Promise<Record<string, unknown>>;
  summarizeAnswer(context: Record<string, unknown>): Promise<string>;
}
