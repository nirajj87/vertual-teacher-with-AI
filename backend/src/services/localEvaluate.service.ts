import { EvaluationResult, EvaluationSchema } from '../ai/types';

/**
 * Cheap local scoring against a stored expected answer.
 * Used to avoid Gemini calls when we already have a model answer.
 */
export function localEvaluateAnswer(context: {
  question: string;
  expectedAnswer: string;
  userAnswer: string;
}): EvaluationResult {
  const userAnswer = context.userAnswer.toLowerCase().trim();
  const expected = context.expectedAnswer.toLowerCase().trim();
  const userTokens = tokenize(userAnswer);
  const expectedTokens = tokenize(expected);

  let score = 5;
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (userTokens.length < 4) {
    score = 3;
    improvements.push('Give a fuller answer with key points');
  } else if (expectedTokens.length > 0) {
    const expectedSet = new Set(expectedTokens.filter((t) => t.length > 2));
    const matches = userTokens.filter((t) => expectedSet.has(t)).length;
    const ratio = expectedSet.size > 0 ? matches / expectedSet.size : 0;
    score = Math.min(10, Math.max(3, Math.round(ratio * 10 * 10) / 10));

    if (ratio >= 0.65) strengths.push('Covers most key points');
    else if (ratio >= 0.4) strengths.push('Partially covers the idea');
    else improvements.push('Include more key terms from the model answer');

    if (userTokens.length >= 12) strengths.push('Answer has enough detail');
    else improvements.push('Expand with one short example');
  } else {
    score = userTokens.length > 20 ? 6.5 : 5;
    strengths.push('Answer provided');
  }

  // Clamp and round
  score = Math.min(10, Math.max(0, Math.round(score * 10) / 10));

  const confidence =
    expectedTokens.length >= 8
      ? userTokens.length < 4
        ? 0.85
        : score >= 8 || score <= 4
          ? 0.82
          : 0.68
      : 0.55;

  return EvaluationSchema.parse({
    score,
    correctness: score,
    relevance: Math.min(10, score + 0.5),
    clarity: Math.min(10, Math.max(4, score)),
    grammar: 7,
    technicalAccuracy: score,
    communication: Math.min(10, score + 0.5),
    strengths: strengths.slice(0, 2),
    improvements: (improvements.length ? improvements : ['Add one concrete example']).slice(0, 2),
    correctAnswer: context.expectedAnswer,
    explanation: 'Scored locally using the stored model answer (token-saving mode).',
    shortModelAnswer: context.expectedAnswer.slice(0, 280),
    confidence,
  });
}

function tokenize(text: string): string[] {
  return text
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}
