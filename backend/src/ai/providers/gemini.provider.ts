import { env } from '../../config/env';
import { BaseAIProvider } from './base.provider';
import { EvaluationResult, EvaluationSchema } from '../types';

export class GeminiProvider extends BaseAIProvider {
  readonly name = 'gemini';
  readonly model = 'gemini-3.5-flash';

  protected async callLLM(prompt: string, maxTokens = 1024): Promise<string> {
    if (!env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    // Keep list short — each slow/503 model used to stack into multi-minute hangs
    const models = [this.model, 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let lastError = 'Unknown Gemini error';

    for (const model of models) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: Math.max(maxTokens, 1024),
              temperature: 0.3,
            },
          }),
        });

        if (!response.ok) {
          lastError = await response.text();
          if ([404, 400, 429, 503].includes(response.status)) continue;
          throw new Error(`Gemini API error: ${response.status} ${lastError}`);
        }

        const data = (await response.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = data.candidates?.[0]?.content?.parts
          ?.map((p) => p.text)
          .filter(Boolean)
          .join('\n')
          .trim();
        if (!text) {
          lastError = 'Empty Gemini response';
          continue;
        }
        return text;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          lastError = `Timeout calling ${model}`;
          continue;
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }
    }

    throw new Error(`Gemini API error: ${lastError}`);
  }
}

export class OpenAIProvider extends BaseAIProvider {
  readonly name = 'openai';
  readonly model = 'gpt-4o-mini';

  protected async callLLM(prompt: string, maxTokens = 1024): Promise<string> {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${err}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty OpenAI response');
    return text;
  }
}

/** Development fallback when AI_PROVIDER=mock */
export class MockAIProvider extends BaseAIProvider {
  readonly name = 'mock';
  readonly model = 'local-heuristic';

  protected async callLLM(prompt: string): Promise<string> {
    void prompt;
    return '{}';
  }

  async evaluateAnswer(context: Record<string, unknown>): Promise<EvaluationResult> {
    const question = String(context.question || '');
    const userAnswer = String(context.userAnswer || '').toLowerCase().trim();
    const expected = String(context.expectedAnswer || '').toLowerCase().trim();

    let score = 5;
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (userAnswer.length < 10) {
      score = 3;
      improvements.push('Provide a more detailed answer');
    } else if (expected) {
      const expectedWords = new Set(expected.split(/\s+/).filter((w) => w.length > 3));
      const userWords = userAnswer.split(/\s+/);
      const matches = userWords.filter((w) => expectedWords.has(w)).length;
      const ratio = expectedWords.size > 0 ? matches / expectedWords.size : 0;
      score = Math.min(10, Math.max(4, Math.round(ratio * 10)));
      if (ratio > 0.5) strengths.push('Good understanding of key concepts');
      else improvements.push('Cover more key points from the expected answer');
    } else {
      score = userAnswer.length > 50 ? 7 : 5;
      strengths.push('Answer provided');
    }

    if (userAnswer.split(/\s+/).length > 5) strengths.push('Answer was relevant');

    const result: EvaluationResult = {
      score,
      correctness: score,
      relevance: Math.min(10, score + 1),
      clarity: Math.min(10, score),
      grammar: 7,
      technicalAccuracy: score,
      communication: Math.min(10, score + 1),
      strengths: strengths.length ? strengths : ['Attempted the question'],
      improvements: improvements.length ? improvements : ['Add a concrete example'],
      correctAnswer: String(context.expectedAnswer || 'A complete answer covering the main concepts.'),
      explanation: 'This evaluation used the local mock provider. Configure GEMINI_API_KEY or OPENAI_API_KEY for AI evaluation.',
      shortModelAnswer: String(context.expectedAnswer || 'Provide a clear, structured answer with examples.'),
      confidence: expected ? 0.7 : 0.5,
    };

    return EvaluationSchema.parse(result);
  }

  async generateQuestionBatch(context: Record<string, unknown>) {
    const count = Math.min(Math.max(Number(context.count) || 1, 1), 15);
    return this.curatedFallback(
      String(context.mode || 'PRACTICE'),
      String(context.topic || 'general'),
      count
    );
  }

  async generateQuestion(context: Record<string, unknown>) {
    const items = await this.generateQuestionBatch({ ...context, count: 1 });
    return items[0];
  }

  async generateHint(context: Record<string, unknown>): Promise<string> {
    return `Think about the main ideas related to: ${String(context.question || '').slice(0, 80)}...`;
  }

  async correctEnglish(context: Record<string, unknown>) {
    const original = String(context.text || '').trim();
    const lower = original.toLowerCase();
    let corrected = original;
    const errors: string[] = [];

    if (/since \d+ years/.test(lower)) {
      corrected = original.replace(/since (\d+) years/i, 'for $1 years');
      if (/^i am working/i.test(original)) {
        corrected = corrected.replace(/^I am working/i, 'I have been working');
      }
      errors.push('Use present perfect continuous with "for" for duration');
    }
    if (/\bhe don't\b/i.test(original)) {
      corrected = corrected.replace(/\bdon't\b/i, "doesn't");
      errors.push('Third person singular needs does/doesn\'t');
    }
    if (/\bi has\b/i.test(original)) {
      corrected = corrected.replace(/\bi has\b/i, 'I have');
      errors.push('Subject-verb agreement: I + have');
    }
    if (corrected === original && original.length > 0) {
      corrected = original.endsWith('.') ? original : `${original}.`;
      errors.push('Minor polish — check punctuation and clarity');
    }

    return {
      original,
      corrected,
      explanation: errors[0] || 'Looks mostly fine. Keep sentences clear and natural.',
      errors,
    };
  }

  async generateInterviewFeedback(context: Record<string, unknown>) {
    const answer = String(context.answer || '');
    const score = answer.length < 40 ? 4 : answer.length < 120 ? 6.5 : 8;
    return {
      score,
      communication: Math.min(10, score + 0.5),
      technical: score,
      confidence: Math.min(10, score),
      problemSolving: score,
      clarity: Math.min(10, score + 0.5),
      grammar: 7,
      strengths:
        score >= 7
          ? ['Clear structure', 'Relevant content']
          : ['Attempted the question'],
      improvements:
        score < 7
          ? ['Add a concrete example', 'Use STAR format (Situation, Task, Action, Result)']
          : ['Slightly tighten the ending'],
      betterAnswer:
        'Start with a one-line summary, then give one example with result, and close with what you learned.',
      followUp: 'Can you quantify the impact of that work?',
      tips: ['Keep answers under 2 minutes', 'End with a measurable outcome'],
    };
  }

  async generateLearningPlan(context: Record<string, unknown>) {
    const weak = (context.weakAreas as Array<{ topic: string }> | undefined) || [];
    return {
      plan: (weak.length ? weak.slice(0, 3) : [{ topic: 'General Practice' }]).map((w, i) => ({
        step: i + 1,
        focus: w.topic,
        suggestedMode: 'PRACTICE',
        minutes: 15 + i * 5,
      })),
    };
  }
}
