import { prisma } from '../config/database';
import { DifficultyLevel, LearningModeType } from '@prisma/client';

export class PracticeRepository {
  async findActiveSession(userId: string) {
    return prisma.practiceSession.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'PAUSED'] } },
      include: {
        questions: {
          include: { answer: { include: { evaluation: true } } },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async createSession(data: {
    userId: string;
    bankId?: string;
    difficulty: DifficultyLevel;
    topic?: string;
    mode?: LearningModeType;
    questions: Array<{
      questionId?: string;
      questionText: string;
      expectedAnswer?: string;
      topic?: string;
      difficulty: DifficultyLevel;
      orderIndex: number;
    }>;
  }) {
    return prisma.practiceSession.create({
      data: {
        userId: data.userId,
        bankId: data.bankId,
        difficulty: data.difficulty,
        topic: data.topic,
        mode: data.mode || 'PRACTICE',
        totalQuestions: data.questions.length,
        currentIndex: 0,
        status: 'ACTIVE',
        questions: {
          create: data.questions,
        },
      },
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
      },
    });
  }

  async getSession(sessionId: string, userId: string) {
    return prisma.practiceSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        questions: {
          include: { answer: { include: { evaluation: true } } },
          orderBy: { orderIndex: 'asc' },
        },
        bank: true,
      },
    });
  }

  async getCurrentQuestion(sessionId: string, userId: string) {
    const session = await this.getSession(sessionId, userId);
    if (!session) return null;
    return session.questions[session.currentIndex] || null;
  }

  async submitAnswer(
    practiceQuestionId: string,
    answerText: string,
    answerType: 'WRITTEN' | 'VOICE' = 'WRITTEN'
  ) {
    return prisma.userAnswer.create({
      data: { practiceQuestionId, answerText, answerType },
    });
  }

  async saveEvaluation(userAnswerId: string, evaluation: {
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
  }) {
    return prisma.answerEvaluation.create({
      data: {
        userAnswerId,
        score: evaluation.score,
        correctness: evaluation.correctness,
        relevance: evaluation.relevance,
        clarity: evaluation.clarity,
        grammar: evaluation.grammar,
        technicalAccuracy: evaluation.technicalAccuracy,
        communication: evaluation.communication,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        correctAnswer: evaluation.correctAnswer,
        explanation: evaluation.explanation,
        shortModelAnswer: evaluation.shortModelAnswer,
        confidence: evaluation.confidence,
      },
    });
  }

  async advanceSession(sessionId: string, userId: string) {
    const session = await prisma.practiceSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) return null;

    const nextIndex = session.currentIndex + 1;
    const isComplete = nextIndex >= session.totalQuestions;

    return prisma.practiceSession.update({
      where: { id: sessionId },
      data: {
        currentIndex: isComplete ? session.currentIndex : nextIndex,
        status: isComplete ? 'COMPLETED' : 'ACTIVE',
        completedAt: isComplete ? new Date() : undefined,
      },
    });
  }

  async completeSession(sessionId: string, userId: string) {
    const session = await this.getSession(sessionId, userId);
    if (!session) return null;

    const scores = session.questions
      .map((q) => q.answer?.evaluation?.score)
      .filter((s): s is number => s !== undefined && s !== null);

    const averageScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    return prisma.practiceSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        averageScore: Math.round(averageScore * 10) / 10,
      },
      include: {
        questions: {
          include: { answer: { include: { evaluation: true } } },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async markHintUsed(practiceQuestionId: string) {
    await prisma.practiceQuestion.update({
      where: { id: practiceQuestionId },
      data: { hintUsed: true },
    });
  }

  async listSessions(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [sessions, total] = await Promise.all([
      prisma.practiceSession.findMany({
        where: { userId, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.practiceSession.count({ where: { userId, status: 'COMPLETED' } }),
    ]);
    return { sessions, total };
  }

  async abandonSession(sessionId: string, userId: string) {
    return prisma.practiceSession.updateMany({
      where: { id: sessionId, userId, status: { in: ['ACTIVE', 'PAUSED'] } },
      data: { status: 'ABANDONED' },
    });
  }
}

export const practiceRepository = new PracticeRepository();
