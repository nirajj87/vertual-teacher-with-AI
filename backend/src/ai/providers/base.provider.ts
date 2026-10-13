import { AIProvider, EvaluationResult, EvaluationSchema } from '../types';
import { MODE_QUESTION_BANK } from '../modeQuestions';
import { logger } from '../../utils/logger';

export abstract class BaseAIProvider implements AIProvider {
  abstract readonly name: string;
  abstract readonly model: string;

  protected abstract callLLM(prompt: string, maxTokens?: number): Promise<string>;

  protected parseJSON<T>(text: string): T {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON in AI response');
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  }

  protected async evaluateWithRetry(context: Record<string, unknown>): Promise<EvaluationResult> {
    const difficulty = (context.difficulty as string) || 'MEDIUM';
    const leniency = difficulty === 'BEGINNER' ? 'forgiving' : difficulty === 'ADVANCED' ? 'strict' : 'balanced';

    const prompt = `Evaluate this answer. Return JSON only.

Question: ${context.question}
Expected Answer: ${context.expectedAnswer || 'Not provided - use your knowledge'}
Student Answer: ${context.userAnswer}
Difficulty: ${difficulty}
Be ${leniency} in scoring.

IMPORTANT rules:
- score,correctness,relevance,clarity,grammar,technicalAccuracy,communication must be NUMBERS from 0 to 10 (not percentages, not words like High/Low)
- confidence must be a number from 0 to 1
- strengths: max 2 items, each under 12 words
- improvements: max 2 items, each under 12 words — concrete "what to fix"
- explanation: 1 short sentence only
- shortModelAnswer: 1–2 short sentences (ideal answer)
- correctAnswer: concise model answer

JSON keys: score,correctness,relevance,clarity,grammar,technicalAccuracy,communication,strengths,improvements,correctAnswer,explanation,shortModelAnswer,confidence`;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await this.callLLM(prompt, 1024);
        const parsed = this.parseJSON<Record<string, unknown>>(raw);
        const toScore = (value: unknown, fallback = 5): number => {
          if (typeof value === 'number' && Number.isFinite(value)) {
            // Gemini sometimes returns 0–100 instead of 0–10
            const n = value > 10 ? value / 10 : value;
            return Math.min(10, Math.max(0, Math.round(n * 10) / 10));
          }
          if (typeof value === 'string') {
            const lower = value.trim().toLowerCase();
            const map: Record<string, number> = {
              excellent: 9.5,
              high: 8.5,
              good: 7.5,
              medium: 6,
              moderate: 6,
              average: 5.5,
              acceptable: 6.5,
              fair: 5,
              low: 3.5,
              poor: 2.5,
              weak: 3,
              concise: 7.5,
            };
            if (lower in map) return map[lower];
            const num = Number(lower.replace(/[^0-9.]/g, ''));
            if (Number.isFinite(num)) return toScore(num, fallback);
          }
          return fallback;
        };

        const baseScore = toScore(parsed.score, 5);
        const normalized = {
          ...parsed,
          score: baseScore,
          correctness: toScore(parsed.correctness, baseScore),
          relevance: toScore(parsed.relevance, baseScore),
          clarity: toScore(parsed.clarity, baseScore),
          grammar: parsed.grammar != null ? toScore(parsed.grammar, baseScore) : undefined,
          technicalAccuracy:
            parsed.technicalAccuracy != null
              ? toScore(parsed.technicalAccuracy, baseScore)
              : undefined,
          communication:
            parsed.communication != null ? toScore(parsed.communication, baseScore) : undefined,
          strengths: (Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [])
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 2)
            .map((s) => (s.length > 90 ? `${s.slice(0, 87)}…` : s)),
          improvements: (Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : [])
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 2)
            .map((s) => (s.length > 90 ? `${s.slice(0, 87)}…` : s)),
          correctAnswer: String(parsed.correctAnswer || parsed.shortModelAnswer || '').slice(0, 400),
          explanation: String(parsed.explanation || '').slice(0, 180),
          shortModelAnswer: String(parsed.shortModelAnswer || parsed.correctAnswer || '').slice(0, 280),
          confidence: (() => {
            const c = Number(parsed.confidence ?? 0.7);
            if (!Number.isFinite(c)) return 0.7;
            return c > 1 ? Math.min(1, c / 100) : Math.min(1, Math.max(0, c));
          })(),
        };
        return EvaluationSchema.parse(normalized);
      } catch (error) {
        logger.warn('Evaluation parse failed', { attempt, error });
        if (attempt === 1) throw error;
      }
    }
    throw new Error('Evaluation failed after retries');
  }

  async evaluateAnswer(context: Record<string, unknown>): Promise<EvaluationResult> {
    return this.evaluateWithRetry(context);
  }

  async generateQuestion(context: Record<string, unknown>): Promise<{
    question: string;
    topic?: string;
    expectedAnswer?: string;
  }> {
    const batch = await this.generateQuestionBatch({ ...context, count: 1 });
    return batch[0];
  }

  /** One API call for multiple questions — avoids N sequential Gemini round-trips */
  async generateQuestionBatch(context: Record<string, unknown>): Promise<
    Array<{ question: string; topic?: string; expectedAnswer?: string }>
  > {
    const count = Math.min(Math.max(Number(context.count) || 1, 1), 15);
    const mode = String(context.mode || 'PRACTICE');
    const topic = String(context.topic || 'general knowledge');
    const difficulty = String(context.difficulty || 'MEDIUM');

    const prompt = `Generate ${count} distinct ${difficulty} practice questions about "${topic}".
Mode: ${mode}
Return JSON only:
{"questions":[{"question":"...","topic":"...","expectedAnswer":"..."}]}
Rules: each question must be different; expectedAnswer 1-3 sentences.`;

    const fallback = this.curatedFallback(mode, topic, count);

    try {
      // Hard-cap wait so practice setup never hangs on overloaded Gemini
      const raw = await Promise.race([
        this.callLLM(prompt, Math.min(300 + count * 180, 2048)),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('generateQuestionBatch timeout')), 7_000)
        ),
      ]);
      const parsed = this.parseJSON<{
        questions?: Array<{ question?: string; topic?: string; expectedAnswer?: string }>;
      }>(raw);
      const items = (parsed.questions || [])
        .filter((q) => q.question && String(q.question).trim().length > 5)
        .map((q) => ({
          question: String(q.question),
          topic: q.topic || topic,
          expectedAnswer: q.expectedAnswer,
        }));
      if (items.length === 0) throw new Error('Empty question batch');
      return items.slice(0, count);
    } catch (error) {
      logger.warn('generateQuestionBatch failed, using curated fallback', {
        error: error instanceof Error ? error.message : error,
      });
      return fallback;
    }
  }

  protected curatedFallback(
    mode: string,
    topic: string,
    count: number
  ): Array<{ question: string; topic?: string; expectedAnswer?: string }> {
    const primary = MODE_QUESTION_BANK[mode] || MODE_QUESTION_BANK.PRACTICE;
    const all = [...primary, ...Object.values(MODE_QUESTION_BANK).flat()];
    const tokens = topic
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2);

    let pool = tokens.length
      ? all.filter((q) => {
          const hay = `${q.topic || ''} ${q.question}`.toLowerCase();
          return tokens.some((t) => hay.includes(t));
        })
      : [...primary];

    if (pool.length < count) pool = [...pool, ...primary, ...MODE_QUESTION_BANK.PRACTICE];

    const seen = new Set<string>();
    const unique = pool.filter((q) => {
      if (seen.has(q.question)) return false;
      seen.add(q.question);
      return true;
    });

    if (unique.length === 0) {
      return Array.from({ length: count }, (_, i) => ({
        question: `Explain a key concept related to ${topic || mode} (question ${i + 1}).`,
        topic: topic || mode,
        expectedAnswer: `A clear explanation of an important ${topic || mode} concept with one example.`,
      }));
    }

    const result: Array<{ question: string; topic?: string; expectedAnswer?: string }> = [];
    for (let i = 0; i < count; i++) {
      const item = unique[i % unique.length];
      result.push({
        question: item.question,
        topic: item.topic || topic || mode,
        expectedAnswer: item.expectedAnswer,
      });
    }
    return result;
  }

  async generateHint(context: Record<string, unknown>): Promise<string> {
    const prompt = `Give a short hint (max 2 sentences) without revealing the answer.
Question: ${context.question}`;
    return this.callLLM(prompt, 150);
  }

  async generateExplanation(context: Record<string, unknown>): Promise<string> {
    return this.callLLM(`Explain briefly: ${context.question}\nAnswer: ${context.answer}`, 300);
  }

  async generateAnswer(context: Record<string, unknown>): Promise<string> {
    return this.callLLM(`Answer this question concisely: ${context.question}`, 300);
  }

  async correctEnglish(context: Record<string, unknown>): Promise<{
    original: string;
    corrected: string;
    explanation: string;
    errors: string[];
  }> {
    const text = String(context.text || '');
    const prompt = `Correct this English sentence. Return JSON only:
{"original":"...","corrected":"...","explanation":"...","errors":["..."]}
Text: ${text}`;
    const raw = await this.callLLM(prompt, 400);
    return this.parseJSON(raw);
  }

  async generateInterviewFeedback(context: Record<string, unknown>): Promise<Record<string, unknown>> {
    const prompt = `Give interview feedback as JSON for this answer.
Question: ${context.question}
Answer: ${context.answer}
Return: {"score":0-10,"communication":0-10,"technical":0-10,"confidence":0-10,"strengths":[],"improvements":[],"betterAnswer":"...","followUp":"..."}`;
    const raw = await this.callLLM(prompt, 600);
    return this.parseJSON(raw);
  }

  async generateLearningPlan(context: Record<string, unknown>): Promise<Record<string, unknown>> {
    const prompt = `Create a short learning plan JSON for weak areas: ${JSON.stringify(context.weakAreas || [])}
Return: {"plan":[{"step":1,"focus":"...","suggestedMode":"PRACTICE","minutes":15}]}`;
    const raw = await this.callLLM(prompt, 400);
    return this.parseJSON(raw);
  }

  async summarizeAnswer(context: Record<string, unknown>): Promise<string> {
    return this.callLLM(`Summarize in one sentence: ${context.answer}`, 100);
  }
}
