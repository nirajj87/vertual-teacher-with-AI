import { DifficultyLevel, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { hashContent } from '../utils/hash';
import { questionBankRepository } from '../repositories/questionBank.repository';
import { logger } from '../utils/logger';

export type KnowledgeQuestion = {
  question: string;
  expectedAnswer?: string;
  topic?: string;
  difficulty?: DifficultyLevel;
  questionId?: string;
  contentHash?: string;
};

function normalizeQuestion(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function questionHash(text: string): string {
  return hashContent(normalizeQuestion(text));
}

export class AiKnowledgeService {
  /** Pull reusable Q&A from shared cache (no AI tokens). */
  async findPool(params: {
    topic?: string;
    mode?: string;
    difficulty?: DifficultyLevel;
    limit: number;
    excludeHashes?: Set<string>;
  }): Promise<KnowledgeQuestion[]> {
    const where: Prisma.AiKnowledgeItemWhereInput = {
      expectedAnswer: { not: '' },
    };

    const or: Prisma.AiKnowledgeItemWhereInput[] = [];
    if (params.topic) {
      // Prefer focus after "Grammar: Translation" / "Grammar · WH Family"
      const raw = params.topic.trim();
      const afterSep = raw.includes(':')
        ? raw.split(':').pop()!.trim()
        : raw.includes('·')
          ? raw.split('·').pop()!.trim()
          : raw.split(',')[0].trim();
      const topicKey = afterSep || raw;
      or.push({ topic: { contains: topicKey } });
      const firstToken = topicKey.split(/[·,\s]+/)[0].trim();
      if (firstToken && firstToken !== topicKey) {
        or.push({ topic: { contains: firstToken } });
      }
    }
    if (params.mode) {
      or.push({ mode: params.mode });
    }
    if (or.length) where.OR = or;
    if (params.difficulty) where.difficulty = params.difficulty;

    const rows = await prisma.aiKnowledgeItem.findMany({
      where,
      orderBy: [{ useCount: 'desc' }, { updatedAt: 'desc' }],
      take: Math.max(params.limit * 3, 20),
    });

    const exclude = params.excludeHashes || new Set<string>();
    const picked: KnowledgeQuestion[] = [];
    for (const row of rows) {
      if (exclude.has(row.contentHash)) continue;
      exclude.add(row.contentHash);
      picked.push({
        question: row.questionText,
        expectedAnswer: row.expectedAnswer,
        topic: row.topic || params.topic,
        difficulty: row.difficulty,
        contentHash: row.contentHash,
      });
      if (picked.length >= params.limit) break;
    }

    if (picked.length) {
      await prisma.aiKnowledgeItem.updateMany({
        where: { contentHash: { in: picked.map((p) => p.contentHash!).filter(Boolean) } },
        data: { useCount: { increment: 1 } },
      });
    }

    return picked;
  }

  /** Also reuse questions already saved in the user's AI Library bank. */
  async findFromUserAiBank(params: {
    userId: string;
    topic?: string;
    difficulty?: DifficultyLevel;
    limit: number;
    excludeTexts?: Set<string>;
  }): Promise<KnowledgeQuestion[]> {
    const bank = await prisma.questionBank.findFirst({
      where: { userId: params.userId, name: { startsWith: 'AI Library' } },
      orderBy: { updatedAt: 'desc' },
    });
    if (!bank) return [];

    const questions = await prisma.question.findMany({
      where: {
        bankId: bank.id,
        ...(params.topic
          ? { OR: [{ topic: { contains: params.topic.split(/[·,]/)[0].trim() } }, { topic: null }] }
          : {}),
        ...(params.difficulty ? { difficulty: params.difficulty } : {}),
        hasExpectedAnswer: true,
      },
      include: { answer: true },
      orderBy: { createdAt: 'desc' },
      take: params.limit * 2,
    });

    const exclude = params.excludeTexts || new Set<string>();
    const out: KnowledgeQuestion[] = [];
    for (const q of questions) {
      const norm = normalizeQuestion(q.text);
      if (exclude.has(norm)) continue;
      if (!q.answer?.text) continue;
      exclude.add(norm);
      out.push({
        question: q.text,
        expectedAnswer: q.answer.text,
        topic: q.topic || params.topic,
        difficulty: q.difficulty,
        questionId: q.id,
        contentHash: questionHash(q.text),
      });
      if (out.length >= params.limit) break;
    }
    return out;
  }

  async upsertMany(
    items: Array<{
      question: string;
      expectedAnswer?: string;
      topic?: string;
      mode?: string;
      difficulty?: DifficultyLevel;
      source?: string;
      createdById?: string;
    }>
  ) {
    for (const item of items) {
      const answer = (item.expectedAnswer || '').trim();
      const question = (item.question || '').trim();
      if (!question || question.length < 5 || !answer) continue;
      const contentHash = questionHash(question);
      try {
        await prisma.aiKnowledgeItem.upsert({
          where: { contentHash },
          create: {
            contentHash,
            questionText: question,
            expectedAnswer: answer,
            topic: item.topic || null,
            mode: item.mode || null,
            difficulty: item.difficulty || 'MEDIUM',
            source: item.source || 'ai',
            createdById: item.createdById || null,
            useCount: 1,
          },
          update: {
            expectedAnswer: answer,
            topic: item.topic || undefined,
            mode: item.mode || undefined,
            difficulty: item.difficulty || undefined,
            source: item.source || undefined,
            useCount: { increment: 1 },
          },
        });
      } catch (err) {
        logger.warn('AiKnowledge upsert failed', {
          error: err instanceof Error ? err.message : err,
        });
      }
    }
  }

  /**
   * Persist into the user's personal AI Library bank so Questions page grows
   * and future sessions can reuse without Gemini.
   */
  async saveToUserLibrary(
    userId: string,
    items: Array<{
      question: string;
      expectedAnswer?: string;
      topic?: string;
      difficulty?: DifficultyLevel;
    }>
  ) {
    const usable = items.filter((i) => i.question?.trim() && i.expectedAnswer?.trim());
    if (!usable.length) return;

    const topicLabel = usable[0].topic?.split(/[·,]/)[0]?.trim() || 'General';
    const bankName = `AI Library · ${topicLabel}`;

    let bank = await prisma.questionBank.findFirst({
      where: { userId, name: bankName },
    });
    if (!bank) {
      bank = await questionBankRepository.create(userId, {
        name: bankName,
        description: 'Auto-saved AI-generated questions with model answers (token-saving library)',
        topic: topicLabel,
      });
      await prisma.questionBank.update({
        where: { id: bank.id },
        data: { isPublic: false },
      });
    }

    const existing = await prisma.question.findMany({
      where: { bankId: bank.id },
      select: { text: true },
    });
    const existingHashes = new Set(existing.map((q) => questionHash(q.text)));

    const fresh = usable.filter((i) => !existingHashes.has(questionHash(i.question)));
    if (!fresh.length) return;

    await questionBankRepository.addQuestions(
      bank.id,
      fresh.map((i) => ({
        text: i.question.trim(),
        expectedAnswer: i.expectedAnswer!.trim(),
        topic: i.topic || topicLabel,
        difficulty: i.difficulty || 'MEDIUM',
      }))
    );
  }
}

export const aiKnowledgeService = new AiKnowledgeService();
