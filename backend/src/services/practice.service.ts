import { getAIProvider } from '../ai/factory';
import { cacheService } from '../cache/cache.service';
import { hashContent } from '../utils/hash';
import { practiceRepository } from '../repositories/practice.repository';
import { questionBankRepository } from '../repositories/questionBank.repository';
import { aiUsageService } from './aiUsage.service';
import { progressService } from './progress.service';
import { aiKnowledgeService, questionHash } from './aiKnowledge.service';
import { localEvaluateAnswer } from './localEvaluate.service';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import { StartPracticeInput, SubmitAnswerInput } from '../validators/question.validator';
import { DifficultyLevel, LearningModeType } from '@prisma/client';
import { prisma } from '../config/database';
import { MODE_QUESTION_BANK } from '../ai/modeQuestions';

export class PracticeService {
  async getActiveSession(userId: string) {
    return practiceRepository.findActiveSession(userId);
  }

  async startSession(userId: string, input: StartPracticeInput) {
    const existing = await practiceRepository.findActiveSession(userId);
    if (existing) {
      throw new ConflictError('You have an active practice session. Continue or abandon it first.');
    }

    let questionItems: Array<{
      questionId?: string;
      questionText: string;
      expectedAnswer?: string;
      topic?: string;
      difficulty: DifficultyLevel;
      orderIndex: number;
    }> = [];

    if (input.source === 'bank' || input.source === 'mixed') {
      if (!input.bankId) {
        throw new ValidationError('bankId is required for bank source');
      }
      let questions = await questionBankRepository.getQuestions(
        input.bankId,
        userId,
        input.questionCount
      );

      if (input.questionIds?.length) {
        questions = questions.filter((q) => input.questionIds!.includes(q.id));
      }

      if (questions.length === 0) {
        throw new ValidationError('No questions found in the selected bank');
      }

      const selected = questions.slice(0, input.questionCount);
      questionItems = selected.map((q, i) => ({
        questionId: q.id,
        questionText: q.text,
        expectedAnswer: q.answer?.text,
        topic: q.topic || undefined,
        difficulty: (q.difficulty as DifficultyLevel) || input.difficulty,
        orderIndex: i,
      }));
    }

    if (input.source === 'ai' || (input.source === 'mixed' && questionItems.length < input.questionCount)) {
      const needed = input.questionCount - questionItems.length;
      const topic = input.topic || defaultTopicForMode(input.mode);
      const mode = input.mode || 'PRACTICE';
      const seenHashes = new Set<string>(
        questionItems.map((q) => questionHash(q.questionText))
      );
      const seenTexts = new Set<string>(
        questionItems.map((q) => q.questionText.toLowerCase().replace(/\s+/g, ' ').trim())
      );

      // 1) Reuse stored AI knowledge (no tokens)
      const fromKnowledge = await aiKnowledgeService.findPool({
        topic,
        mode,
        difficulty: input.difficulty,
        limit: needed,
        excludeHashes: seenHashes,
      });
      for (const item of fromKnowledge) {
        if (questionItems.length >= input.questionCount) break;
        const text = item.question.trim();
        const norm = text.toLowerCase().replace(/\s+/g, ' ').trim();
        if (seenTexts.has(norm)) continue;
        seenTexts.add(norm);
        if (item.contentHash) seenHashes.add(item.contentHash);
        questionItems.push({
          questionText: text,
          topic: item.topic || topic,
          difficulty: input.difficulty,
          orderIndex: questionItems.length,
          expectedAnswer: item.expectedAnswer,
          questionId: item.questionId,
        });
      }

      // 2) Reuse user's personal AI Library bank
      const stillNeed = input.questionCount - questionItems.length;
      if (stillNeed > 0) {
        const fromBank = await aiKnowledgeService.findFromUserAiBank({
          userId,
          topic,
          difficulty: input.difficulty,
          limit: stillNeed,
          excludeTexts: seenTexts,
        });
        for (const item of fromBank) {
          if (questionItems.length >= input.questionCount) break;
          const text = item.question.trim();
          const norm = text.toLowerCase().replace(/\s+/g, ' ').trim();
          if (seenTexts.has(norm)) continue;
          seenTexts.add(norm);
          questionItems.push({
            questionText: text,
            topic: item.topic || topic,
            difficulty: input.difficulty,
            orderIndex: questionItems.length,
            expectedAnswer: item.expectedAnswer,
            questionId: item.questionId,
          });
        }
      }

      // 3) Curated fallbacks (still free)
      const afterCache = input.questionCount - questionItems.length;
      if (afterCache > 0) {
        const curatedPool = pickCuratedQuestions(mode, topic, afterCache);
        for (const item of curatedPool) {
          if (questionItems.length >= input.questionCount) break;
          const text = item.question.trim();
          const norm = text.toLowerCase().replace(/\s+/g, ' ').trim();
          if (seenTexts.has(norm)) continue;
          seenTexts.add(norm);
          questionItems.push({
            questionText: text,
            topic: item.topic || topic,
            difficulty: input.difficulty,
            orderIndex: questionItems.length,
            expectedAnswer: item.expectedAnswer,
          });
        }
        // Persist curated into knowledge so next time they're found as stored
        await aiKnowledgeService.upsertMany(
          curatedPool.map((c) => ({
            question: c.question,
            expectedAnswer: c.expectedAnswer,
            topic: c.topic || topic,
            mode,
            difficulty: input.difficulty,
            source: 'curated',
            createdById: userId,
          }))
        );
      }

      // 4) Only call Gemini for what's still missing
      const needAi = input.questionCount - questionItems.length;
      if (needAi > 0) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true, settings: true },
        });
        const settings = user?.settings?.ai as { provider?: string } | null;
        const provider = getAIProvider(
          settings?.provider || user?.profile?.preferredAiProvider?.toLowerCase()
        );

        let generatedList: Array<{ question: string; topic?: string; expectedAnswer?: string }> = [];
        const start = Date.now();
        try {
          const batchFn = provider.generateQuestionBatch?.bind(provider);
          const batchPromise = batchFn
            ? batchFn({
                topic,
                difficulty: input.difficulty,
                level: user?.profile?.englishLevel || 'B1',
                mode,
                count: needAi,
              })
            : Promise.all(
                Array.from({ length: Math.min(needAi, 3) }, (_, i) =>
                  provider.generateQuestion({
                    topic,
                    difficulty: input.difficulty,
                    mode,
                    index: i,
                  })
                )
              );

          generatedList = await Promise.race([
            batchPromise,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('AI question generation timed out')), 8_000)
            ),
          ]);
        } catch {
          generatedList = [];
        }

        try {
          await aiUsageService.logUsage({
            userId,
            provider: generatedList.length ? provider.name : 'curated',
            model: generatedList.length ? provider.model : 'local-bank',
            requestType: 'generate_question',
            responseTimeMs: Date.now() - start,
          });
        } catch {
          // ignore
        }

        const freshAi: Array<{
          question: string;
          expectedAnswer?: string;
          topic?: string;
          difficulty?: DifficultyLevel;
        }> = [];

        for (const generated of generatedList) {
          if (questionItems.length >= input.questionCount) break;
          const text = generated.question?.trim();
          if (!text) continue;
          const norm = text.toLowerCase().replace(/\s+/g, ' ').trim();
          if (seenTexts.has(norm)) continue;
          seenTexts.add(norm);
          questionItems.push({
            questionText: text,
            topic: generated.topic || topic,
            difficulty: input.difficulty,
            orderIndex: questionItems.length,
            expectedAnswer: generated.expectedAnswer,
          });
          if (generated.expectedAnswer) {
            freshAi.push({
              question: text,
              expectedAnswer: generated.expectedAnswer,
              topic: generated.topic || topic,
              difficulty: input.difficulty,
            });
          }
        }

        // Store for next time (shared cache + user library)
        if (freshAi.length) {
          await aiKnowledgeService.upsertMany(
            freshAi.map((i) => ({
              ...i,
              mode,
              source: 'ai',
              createdById: userId,
            }))
          );
          await aiKnowledgeService.saveToUserLibrary(userId, freshAi);
        }
      }
    }

    // Final safety net
    if (questionItems.length === 0) {
      const curated = pickCuratedQuestions(
        input.mode || 'PRACTICE',
        input.topic || defaultTopicForMode(input.mode),
        input.questionCount
      );
      questionItems = curated.map((q, i) => ({
        questionText: q.question,
        expectedAnswer: q.expectedAnswer,
        topic: q.topic || input.topic || defaultTopicForMode(input.mode),
        difficulty: input.difficulty,
        orderIndex: i,
      }));
    }

    const session = await practiceRepository.createSession({
      userId,
      bankId: input.bankId,
      difficulty: input.difficulty,
      topic: input.topic || defaultTopicForMode(input.mode),
      mode: input.mode as LearningModeType,
      questions: questionItems,
    });

    await cacheService.set(`session:${userId}`, {
      sessionId: session.id,
      currentIndex: 0,
      totalQuestions: session.totalQuestions,
    }, 86400);

    return session;
  }

  async getSession(sessionId: string, userId: string) {
    const session = await practiceRepository.getSession(sessionId, userId);
    if (!session) throw new NotFoundError('Session not found');
    return session;
  }

  async getCurrentQuestion(sessionId: string, userId: string) {
    const session = await this.getSession(sessionId, userId);
    if (session.status === 'COMPLETED') {
      throw new ValidationError('Session already completed');
    }

    const question = session.questions[session.currentIndex];
    if (!question) throw new NotFoundError('No more questions');

    return {
      sessionId: session.id,
      currentIndex: session.currentIndex,
      totalQuestions: session.totalQuestions,
      difficulty: session.difficulty,
      mode: session.mode,
      topic: session.topic,
      bankId: session.bankId,
      question: {
        id: question.id,
        text: question.questionText,
        topic: question.topic,
        difficulty: question.difficulty,
        hasAnswer: !!question.answer,
      },
    };
  }

  async submitAnswer(sessionId: string, userId: string, input: SubmitAnswerInput) {
    const session = await this.getSession(sessionId, userId);
    if (session.status !== 'ACTIVE') {
      throw new ValidationError('Session is not active');
    }

    const practiceQuestion = session.questions[session.currentIndex];
    if (!practiceQuestion) throw new NotFoundError('Question not found');

    // Allow re-eval if answer exists but evaluation failed previously
    if (practiceQuestion.answer?.evaluation) {
      throw new ValidationError('Question already answered');
    }

    let userAnswer: { id: string };
    if (!practiceQuestion.answer) {
      userAnswer = await practiceRepository.submitAnswer(
        practiceQuestion.id,
        input.answerText,
        input.answerType
      );
    } else {
      userAnswer = await prisma.userAnswer.update({
        where: { id: practiceQuestion.answer.id },
        data: { answerText: input.answerText, answerType: input.answerType },
        select: { id: true },
      });
    }

    const cacheKey = `eval:${hashContent(practiceQuestion.questionText)}:${hashContent(input.answerText)}`;
    const cachedEval = await cacheService.get<{
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
    }>(cacheKey);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, settings: true },
    });
    const settings = user?.settings?.ai as { provider?: string } | null;
    let provider = getAIProvider(
      settings?.provider || user?.profile?.preferredAiProvider?.toLowerCase()
    );

    let evaluation;
    let evalResult:
      | {
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
      | undefined;
    let usedProvider = provider.name;
    let usedModel = provider.model;

    if (cachedEval) {
      evalResult = cachedEval;
      evaluation = await practiceRepository.saveEvaluation(userAnswer.id, cachedEval);
      usedProvider = 'cache';
      usedModel = 'eval-cache';
    } else {
      const start = Date.now();
      const storedAnswer = (practiceQuestion.expectedAnswer || '').trim();

      // Token-saving path: local validate against stored model answer
      if (storedAnswer.length >= 20) {
        const local = localEvaluateAnswer({
          question: practiceQuestion.questionText,
          expectedAnswer: storedAnswer,
          userAnswer: input.answerText,
        });
        // Skip Gemini when local confidence is solid (clear match or clear miss)
        if (local.confidence >= 0.75) {
          evalResult = local;
          usedProvider = 'local';
          usedModel = 'stored-answer';
        }
      }

      if (!evalResult) {
        try {
          evalResult = await provider.evaluateAnswer({
            question: practiceQuestion.questionText,
            expectedAnswer: storedAnswer || practiceQuestion.expectedAnswer || '',
            userAnswer: input.answerText,
            difficulty: session.difficulty,
            topic: practiceQuestion.topic,
          });
          usedProvider = provider.name;
          usedModel = provider.model;
        } catch (err) {
          const { MockAIProvider } = await import('../ai/providers/gemini.provider');
          const mock = new MockAIProvider();
          provider = mock;
          evalResult = storedAnswer
            ? localEvaluateAnswer({
                question: practiceQuestion.questionText,
                expectedAnswer: storedAnswer,
                userAnswer: input.answerText,
              })
            : await mock.evaluateAnswer({
                question: practiceQuestion.questionText,
                expectedAnswer: practiceQuestion.expectedAnswer || '',
                userAnswer: input.answerText,
                difficulty: session.difficulty,
                topic: practiceQuestion.topic,
              });
          usedProvider = storedAnswer ? 'local' : mock.name;
          usedModel = storedAnswer ? 'stored-answer-fallback' : mock.model;
          if (!storedAnswer) {
            evalResult = {
              ...evalResult,
              explanation: `${evalResult.explanation} (AI fallback: ${err instanceof Error ? err.message : 'provider error'})`,
            };
          }
        }
      }

      try {
        await aiUsageService.logUsage({
          userId,
          provider: usedProvider,
          model: usedModel,
          requestType: 'evaluate_answer',
          responseTimeMs: Date.now() - start,
        });
      } catch {
        // ignore
      }

      evaluation = await practiceRepository.saveEvaluation(userAnswer.id, evalResult);
      if (evalResult.confidence >= 0.75) {
        await cacheService.set(cacheKey, evalResult, 604800);
      }

      // Persist / refresh model answer for next time (avoid regenerating)
      const modelAnswer = (evalResult.correctAnswer || evalResult.shortModelAnswer || storedAnswer).trim();
      if (modelAnswer.length >= 20) {
        await aiKnowledgeService.upsertMany([
          {
            question: practiceQuestion.questionText,
            expectedAnswer: modelAnswer,
            topic: practiceQuestion.topic || session.topic || undefined,
            mode: session.mode,
            difficulty: practiceQuestion.difficulty || session.difficulty,
            source: usedProvider === 'local' ? 'local' : 'evaluation',
            createdById: userId,
          },
        ]);
        // Backfill practice question expected answer if it was empty
        if (!storedAnswer) {
          await prisma.practiceQuestion.update({
            where: { id: practiceQuestion.id },
            data: { expectedAnswer: modelAnswer },
          });
        }
        await aiKnowledgeService.saveToUserLibrary(userId, [
          {
            question: practiceQuestion.questionText,
            expectedAnswer: modelAnswer,
            topic: practiceQuestion.topic || session.topic || undefined,
            difficulty: practiceQuestion.difficulty || session.difficulty,
          },
        ]);
      }
    }

    await practiceRepository.advanceSession(sessionId, userId);

    return {
      answerId: userAnswer.id,
      evaluation,
      nextIndex: session.currentIndex + 1,
      isLast: session.currentIndex + 1 >= session.totalQuestions,
      questionIndex: session.currentIndex,
      questionText: practiceQuestion.questionText,
      provider: usedProvider,
      model: usedModel,
    };
  }

  async getHint(sessionId: string, userId: string) {
    const session = await this.getSession(sessionId, userId);
    const question = session.questions[session.currentIndex];
    if (!question) throw new NotFoundError('Question not found');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, settings: true },
    });
    const settings = user?.settings?.ai as { provider?: string } | null;
    const provider = getAIProvider(
      settings?.provider || user?.profile?.preferredAiProvider?.toLowerCase()
    );

    const hint = await provider.generateHint({
      question: question.questionText,
      difficulty: session.difficulty,
    });

    await practiceRepository.markHintUsed(question.id);
    return { hint };
  }

  async getSummary(sessionId: string, userId: string) {
    const session = await practiceRepository.getSession(sessionId, userId);
    if (!session) throw new NotFoundError('Session not found');

    const answered = session.questions.filter((q) => q.answer);
    const scored = answered.filter((q) => q.answer?.evaluation);
    const scores = scored.map((q) => q.answer!.evaluation!.score);
    const avgScore = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0;

    const strongTopics: string[] = [];
    const weakTopics: string[] = [];
    const topicScores: Record<string, number[]> = {};

    for (const q of scored) {
      const topic = q.topic || 'General';
      if (!topicScores[topic]) topicScores[topic] = [];
      topicScores[topic].push(q.answer!.evaluation!.score);
    }

    for (const [topic, topicScoreList] of Object.entries(topicScores)) {
      const avg = topicScoreList.reduce((a, b) => a + b, 0) / topicScoreList.length;
      if (avg >= 7) strongTopics.push(topic);
      else if (avg < 6) weakTopics.push(topic);
    }

    const durationMs = session.completedAt
      ? session.completedAt.getTime() - session.startedAt.getTime()
      : Date.now() - session.startedAt.getTime();

    const asStringList = (value: unknown): string[] => {
      if (Array.isArray(value)) return value.map(String);
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed.map(String) : [value];
        } catch {
          return value ? [value] : [];
        }
      }
      return [];
    };

    return {
      sessionId: session.id,
      status: session.status,
      totalQuestions: session.totalQuestions,
      answered: answered.length,
      averageScore: session.averageScore ?? avgScore,
      durationMinutes: Math.round(durationMs / 60000),
      strongTopics,
      weakTopics,
      questions: answered.map((q) => {
        const ev = q.answer!.evaluation;
        return {
          question: q.questionText,
          yourAnswer: q.answer!.answerText,
          score: ev?.score ?? 0,
          correctness: ev?.correctness ?? undefined,
          relevance: ev?.relevance ?? undefined,
          clarity: ev?.clarity ?? undefined,
          grammar: ev?.grammar ?? undefined,
          technicalAccuracy: ev?.technicalAccuracy ?? undefined,
          communication: ev?.communication ?? undefined,
          strengths: asStringList(ev?.strengths).slice(0, 2),
          improvements: asStringList(ev?.improvements).slice(0, 2),
          correctAnswer: ev?.correctAnswer || q.expectedAnswer || 'No model answer available',
          shortModelAnswer: ev?.shortModelAnswer || ev?.correctAnswer || '',
          explanation: ev?.explanation || 'Evaluation was not saved for this answer.',
        };
      }),
    };
  }

  async completeSession(sessionId: string, userId: string) {
    const session = await practiceRepository.completeSession(sessionId, userId);
    if (!session) throw new NotFoundError('Session not found');
    await progressService.updateFromSession(userId, sessionId);
    await cacheService.del(`session:${userId}`);
    return this.getSummary(sessionId, userId);
  }

  async abandonSession(sessionId: string, userId: string) {
    await practiceRepository.abandonSession(sessionId, userId);
    await cacheService.del(`session:${userId}`);
  }

  async listHistory(userId: string, page = 1) {
    return practiceRepository.listSessions(userId, page);
  }
}

export const practiceService = new PracticeService();

function pickCuratedQuestions(
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

  if (pool.length < count) {
    pool = [...pool, ...primary, ...MODE_QUESTION_BANK.PRACTICE];
  }

  const seen = new Set<string>();
  const unique = pool.filter((q) => {
    if (seen.has(q.question)) return false;
    seen.add(q.question);
    return true;
  });

  // Mild shuffle so sessions aren't identical
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }

  const result: Array<{ question: string; topic?: string; expectedAnswer?: string }> = [];
  for (let i = 0; i < count; i++) {
    const item = unique[i % Math.max(unique.length, 1)];
    if (!item) break;
    result.push({
      question: item.question,
      topic: item.topic || topic || mode,
      expectedAnswer: item.expectedAnswer,
    });
  }
  return result;
}

function defaultTopicForMode(mode: string): string {
  switch (mode) {
    case 'GRAMMAR':
      return 'Grammar';
    case 'VOCABULARY':
      return 'Vocabulary';
    case 'ENGLISH':
      return 'English Conversation';
    case 'INTERVIEW':
      return 'Interview';
    default:
      return 'General Practice';
  }
}
