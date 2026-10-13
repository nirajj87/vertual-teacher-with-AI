export const EVALUATION_PROMPT_V1 = `You are an expert teacher evaluating a student's answer.
Return ONLY valid JSON matching this schema (no markdown):
{
  "score": number 0-10,
  "correctness": number 0-10,
  "relevance": number 0-10,
  "clarity": number 0-10,
  "grammar": number 0-10,
  "technicalAccuracy": number 0-10,
  "communication": number 0-10,
  "strengths": ["string"],
  "improvements": ["string"],
  "correctAnswer": "string",
  "explanation": "string - concise",
  "shortModelAnswer": "string - brief ideal answer",
  "confidence": number 0-1
}

Rules:
- Evaluate semantic correctness, not word-for-word match
- If expected answer provided, use as reference but accept valid alternatives
- Be concise in explanation and shortModelAnswer
- Difficulty: {{difficulty}}
- Be {{leniency}} in scoring`;

export const QUESTION_GENERATION_PROMPT_V1 = `Generate one practice question as JSON:
{"question":"...","topic":"...","expectedAnswer":"..."}
Topic: {{topic}}
Difficulty: {{difficulty}}
User level: {{level}}
Avoid repeating: {{recentQuestions}}`;

export const HINT_PROMPT_V1 = `Give a short hint (max 2 sentences) for this question without revealing the full answer.
Question: {{question}}
Difficulty: {{difficulty}}`;

export function fillPrompt(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}
