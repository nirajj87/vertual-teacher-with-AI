import { prisma } from '../config/database';
import { practiceService } from './practice.service';
import { progressService } from './progress.service';
import { getAIProvider } from '../ai/factory';
import { aiUsageService } from './aiUsage.service';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import { DifficultyLevel } from '@prisma/client';

export interface StartInterviewInput {
  interviewType: string;
  targetJob?: string;
  experience?: string;
  technology?: string;
  company?: string;
  difficulty?: DifficultyLevel;
  questionCount?: number;
}

export class InterviewService {
  async start(userId: string, input: StartInterviewInput) {
    const existing = await practiceService.getActiveSession(userId);
    if (existing) {
      throw new ConflictError('Finish or abandon your active session before starting an interview.');
    }

    const difficulty = input.difficulty || 'MEDIUM';
    const topic = [
      input.interviewType,
      input.targetJob,
      input.technology,
    ]
      .filter(Boolean)
      .join(' · ');

    const practiceSession = await practiceService.startSession(userId, {
      difficulty,
      questionCount: input.questionCount || 5,
      topic: topic || input.interviewType,
      source: 'ai',
      mode: 'INTERVIEW',
    });

    const interview = await prisma.interviewSession.create({
      data: {
        userId,
        interviewType: input.interviewType,
        targetJob: input.targetJob || input.technology || null,
        difficulty,
        status: 'ACTIVE',
      },
    });

    return {
      interviewId: interview.id,
      sessionId: practiceSession.id,
      interviewType: interview.interviewType,
      targetJob: interview.targetJob,
      difficulty,
      totalQuestions: practiceSession.totalQuestions,
    };
  }

  async listHistory(userId: string, page = 1) {
    const take = 20;
    const skip = (page - 1) * take;
    const [sessions, total] = await Promise.all([
      prisma.interviewSession.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        skip,
        take,
      }),
      prisma.interviewSession.count({ where: { userId } }),
    ]);

    // Also include completed practice sessions in INTERVIEW mode
    const practiceInterviews = await prisma.practiceSession.findMany({
      where: { userId, mode: 'INTERVIEW' },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });

    return { sessions, practiceInterviews, total };
  }

  async getAnalytics(userId: string) {
    const sessions = await prisma.interviewSession.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { completedAt: 'asc' },
    });

    const practice = await prisma.practiceSession.findMany({
      where: { userId, mode: 'INTERVIEW', status: 'COMPLETED' },
      include: {
        questions: { include: { answer: { include: { evaluation: true } } } },
      },
    });

    const byType: Record<string, { count: number; avg: number }> = {};
    for (const s of sessions) {
      if (!byType[s.interviewType]) byType[s.interviewType] = { count: 0, avg: 0 };
      byType[s.interviewType].count += 1;
      byType[s.interviewType].avg += s.overallScore || 0;
    }
    for (const t of Object.keys(byType)) {
      byType[t].avg =
        byType[t].count > 0 ? Math.round((byType[t].avg / byType[t].count) * 10) / 10 : 0;
    }

    let communication = 0;
    let technical = 0;
    let clarity = 0;
    let n = 0;
    for (const p of practice) {
      for (const q of p.questions) {
        const e = q.answer?.evaluation;
        if (!e) continue;
        communication += e.communication ?? e.clarity;
        technical += e.technicalAccuracy ?? e.correctness;
        clarity += e.clarity;
        n += 1;
      }
    }

    const trend = practice
      .filter((p) => p.completedAt && p.averageScore != null)
      .map((p) => ({
        date: p.completedAt!.toISOString().slice(0, 10),
        score: p.averageScore!,
      }));

    return {
      totalInterviews: sessions.length + practice.length,
      averageScore:
        practice.length > 0
          ? Math.round(
              (practice.reduce((a, p) => a + (p.averageScore || 0), 0) / practice.length) * 10
            ) / 10
          : 0,
      byType,
      skills:
        n > 0
          ? {
              communication: Math.round((communication / n) * 10) / 10,
              technical: Math.round((technical / n) * 10) / 10,
              clarity: Math.round((clarity / n) * 10) / 10,
            }
          : { communication: 0, technical: 0, clarity: 0 },
      trend,
      tips: [
        'Practice STAR answers for behavioral questions',
        'Keep introductions under 90 seconds',
        'End technical answers with business impact',
      ],
    };
  }

  async completeInterview(interviewId: string, userId: string, practiceSessionId: string) {
    const interview = await prisma.interviewSession.findFirst({
      where: { id: interviewId, userId },
    });
    if (!interview) throw new NotFoundError('Interview not found');

    const summary = await practiceService.completeSession(practiceSessionId, userId);

    await prisma.interviewSession.update({
      where: { id: interviewId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        overallScore: summary.averageScore,
      },
    });

    await progressService.updateFromSession(userId, practiceSessionId);

    const achievement = await prisma.achievement.findUnique({
      where: { code: 'INTERVIEW_COMPLETE' },
    });
    if (achievement) {
      await prisma.userAchievement.upsert({
        where: {
          userId_achievementId: { userId, achievementId: achievement.id },
        },
        create: { userId, achievementId: achievement.id },
        update: {},
      });
    }

    if (summary.averageScore < 6) {
      await prisma.weakArea.create({
        data: {
          userId,
          category: 'interview',
          topic: interview.interviewType,
          severity: Math.min(1, 1 - summary.averageScore / 10),
          count: 1,
        },
      }).catch(async () => {
        const existing = await prisma.weakArea.findFirst({
          where: { userId, category: 'interview', topic: interview.interviewType },
        });
        if (existing) {
          await prisma.weakArea.update({
            where: { id: existing.id },
            data: { count: { increment: 1 } },
          });
        }
      });
    }

    return { interviewId, ...summary };
  }

  async feedbackOnAnswer(userId: string, question: string, answer: string) {
    if (!answer.trim()) throw new ValidationError('Answer is required');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, settings: true },
    });
    const settings = user?.settings?.ai as { provider?: string } | null;
    const provider = getAIProvider(
      settings?.provider || user?.profile?.preferredAiProvider?.toLowerCase()
    );
    const start = Date.now();
    const feedback = await provider.generateInterviewFeedback({ question, answer });
    await aiUsageService.logUsage({
      userId,
      provider: provider.name,
      model: provider.model,
      requestType: 'interview_feedback',
      responseTimeMs: Date.now() - start,
    });
    return feedback;
  }
}

export const interviewService = new InterviewService();
