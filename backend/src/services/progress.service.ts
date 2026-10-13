import { prisma } from '../config/database';
import { cacheService } from '../cache/cache.service';

export class ProgressService {
  async updateFromSession(userId: string, sessionId: string) {
    const session = await prisma.practiceSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        questions: {
          include: { answer: { include: { evaluation: true } } },
        },
      },
    });
    if (!session) return;

    const topicScores: Record<string, number[]> = {};
    const grammarScores: number[] = [];

    for (const q of session.questions) {
      const evalResult = q.answer?.evaluation;
      if (!evalResult) continue;
      const topic = q.topic || session.topic || session.mode || 'General';
      if (!topicScores[topic]) topicScores[topic] = [];
      topicScores[topic].push(evalResult.score);
      if (evalResult.grammar != null) grammarScores.push(evalResult.grammar);
    }

    for (const [topic, scores] of Object.entries(topicScores)) {
      const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      await prisma.userTopicProgress.upsert({
        where: { userId_topic: { userId, topic } },
        create: {
          userId,
          topic,
          totalAttempts: scores.length,
          averageScore,
          lastPracticed: new Date(),
        },
        update: {
          totalAttempts: { increment: scores.length },
          averageScore,
          lastPracticed: new Date(),
        },
      });

      if (averageScore < 6) {
        await this.upsertWeakArea(userId, 'topic', topic, 1 - averageScore / 10);
      }
    }

    if (grammarScores.length > 0) {
      const avgGrammar = grammarScores.reduce((a, b) => a + b, 0) / grammarScores.length;
      if (avgGrammar < 6) {
        await this.upsertWeakArea(userId, 'grammar', 'Grammar', 1 - avgGrammar / 10);
      }
    }

    await cacheService.del(`dashboard:stats:${userId}`);
  }

  private async upsertWeakArea(userId: string, category: string, topic: string, severity: number) {
    const existing = await prisma.weakArea.findFirst({ where: { userId, category, topic } });
    if (existing) {
      await prisma.weakArea.update({
        where: { id: existing.id },
        data: {
          count: { increment: 1 },
          severity: Math.min(1, (existing.severity + severity) / 2 + 0.1),
        },
      });
    } else {
      await prisma.weakArea.create({
        data: { userId, category, topic, severity, count: 1 },
      });
    }
  }

  async getOverview(userId: string) {
    const [topicProgress, weakAreas, sessions, interviewSessions] = await Promise.all([
      prisma.userTopicProgress.findMany({
        where: { userId },
        orderBy: { averageScore: 'asc' },
      }),
      prisma.weakArea.findMany({
        where: { userId },
        orderBy: [{ severity: 'desc' }, { count: 'desc' }],
        take: 20,
      }),
      prisma.practiceSession.findMany({
        where: { userId, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        take: 30,
        select: {
          id: true,
          mode: true,
          averageScore: true,
          totalQuestions: true,
          completedAt: true,
          topic: true,
          difficulty: true,
        },
      }),
      prisma.interviewSession.findMany({
        where: { userId, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        take: 20,
      }),
    ]);

    const byMode: Record<string, { count: number; avgScore: number }> = {};
    for (const s of sessions) {
      if (!byMode[s.mode]) byMode[s.mode] = { count: 0, avgScore: 0 };
      byMode[s.mode].count += 1;
      byMode[s.mode].avgScore += s.averageScore || 0;
    }
    for (const mode of Object.keys(byMode)) {
      byMode[mode].avgScore =
        byMode[mode].count > 0
          ? Math.round((byMode[mode].avgScore / byMode[mode].count) * 10) / 10
          : 0;
    }

    const scoreTrend = sessions
      .filter((s) => s.completedAt && s.averageScore != null)
      .slice(0, 14)
      .reverse()
      .map((s) => ({
        date: s.completedAt!.toISOString().slice(0, 10),
        score: s.averageScore!,
        mode: s.mode,
      }));

    const streak = this.calculateStreak(
      sessions.map((s) => s.completedAt).filter((d): d is Date => !!d)
    );

    return {
      streak,
      topicProgress,
      weakAreas,
      byMode,
      scoreTrend,
      totalSessions: sessions.length,
      interviewCount: interviewSessions.length,
      averageScore:
        sessions.length > 0
          ? Math.round(
              (sessions.reduce((a, s) => a + (s.averageScore || 0), 0) / sessions.length) * 10
            ) / 10
          : 0,
      recentSessions: sessions.slice(0, 10),
    };
  }

  async getWeakAreas(userId: string) {
    const [weakAreas, topicProgress, lowAnswers] = await Promise.all([
      prisma.weakArea.findMany({
        where: { userId },
        orderBy: [{ severity: 'desc' }, { count: 'desc' }],
      }),
      prisma.userTopicProgress.findMany({ where: { userId } }),
      prisma.practiceQuestion.findMany({
        where: {
          session: { userId },
          answer: { is: { evaluation: { is: { score: { lt: 7 } } } } },
        },
        include: {
          answer: { include: { evaluation: true } },
          session: { select: { mode: true, topic: true } },
        },
        orderBy: { orderIndex: 'desc' },
        take: 80,
      }),
    ]);

    const progressByTopic = new Map(topicProgress.map((t) => [t.topic.toLowerCase(), t]));

    const tipsByTopic = new Map<string, string[]>();
    const scoresByTopic = new Map<string, number[]>();
    for (const q of lowAnswers) {
      const topic = (q.topic || q.session.topic || 'General').trim();
      const key = topic.toLowerCase();
      const ev = q.answer?.evaluation;
      if (!ev) continue;
      if (!scoresByTopic.has(key)) scoresByTopic.set(key, []);
      scoresByTopic.get(key)!.push(ev.score);
      const tips = tipsByTopic.get(key) || [];
      const improvements = Array.isArray(ev.improvements)
        ? (ev.improvements as string[])
        : [];
      for (const tip of improvements) {
        const clean = String(tip).trim();
        if (clean && !tips.includes(clean) && tips.length < 4) tips.push(clean);
      }
      tipsByTopic.set(key, tips);
    }

    const enriched = weakAreas.map((w) => {
      const key = w.topic.toLowerCase();
      const progress = progressByTopic.get(key);
      const recentScores = scoresByTopic.get(key) || [];
      const avgFromRecent =
        recentScores.length > 0
          ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
          : progress?.averageScore;
      const rating = Math.round(((avgFromRecent ?? (1 - w.severity) * 10)) * 10) / 10;
      const whatToImprove =
        tipsByTopic.get(key)?.slice(0, 3) ||
        defaultImproveTips(w.topic, w.category);
      const focusPlan = buildFocusPlan(w.topic, w.category, rating);
      const suggestedMode = suggestMode(w.category, w.topic);

      return {
        ...w,
        rating: Math.min(10, Math.max(0, rating)),
        ratingLabel: ratingLabel(rating),
        whatToImprove,
        focusPlan,
        feedback: focusPlan.summary,
        suggestedMode,
        averageScore: progress?.averageScore ?? rating,
        totalAttempts: progress?.totalAttempts ?? w.count,
      };
    });

    const recommendations = enriched.slice(0, 5).map((w) => ({
      topic: w.topic,
      category: w.category,
      severity: w.severity,
      rating: w.rating,
      ratingLabel: w.ratingLabel,
      suggestedMode: w.suggestedMode,
      action: w.focusPlan.action,
      whatToImprove: w.whatToImprove,
      minutes: w.focusPlan.minutes,
    }));

    return { weakAreas: enriched, recommendations };
  }

  async getLearningPlan(userId: string) {
    const overview = await this.getOverview(userId);
    const topWeak = overview.weakAreas.slice(0, 3);

    return {
      plan: topWeak.length
        ? topWeak.map((w, i) => ({
            step: i + 1,
            focus: w.topic,
            reason: `Severity ${(w.severity * 10).toFixed(1)}/10 · ${w.count} mistakes`,
            suggestedMode:
              w.category === 'grammar'
                ? 'GRAMMAR'
                : w.category === 'vocabulary'
                  ? 'VOCABULARY'
                  : 'PRACTICE',
            minutes: 15 + i * 5,
          }))
        : [
            {
              step: 1,
              focus: 'General Practice',
              reason: 'No weak areas yet — keep building consistency',
              suggestedMode: 'PRACTICE',
              minutes: 20,
            },
            {
              step: 2,
              focus: 'English Conversation',
              reason: 'Improve fluency with English Teacher mode',
              suggestedMode: 'ENGLISH',
              minutes: 15,
            },
          ],
      streak: overview.streak,
      averageScore: overview.averageScore,
    };
  }

  private calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;
    const days = new Set(dates.map((d) => d.toISOString().slice(0, 10)));
    let streak = 0;
    const cursor = new Date();
    // Allow today or yesterday as start
    const today = cursor.toISOString().slice(0, 10);
    cursor.setDate(cursor.getDate() - 1);
    const yesterday = cursor.toISOString().slice(0, 10);
    if (!days.has(today) && !days.has(yesterday)) return 0;

    const check = new Date();
    if (!days.has(today)) check.setDate(check.getDate() - 1);

    while (days.has(check.toISOString().slice(0, 10))) {
      streak += 1;
      check.setDate(check.getDate() - 1);
    }
    return streak;
  }
}

export const progressService = new ProgressService();

function ratingLabel(score: number): string {
  if (score >= 8) return 'Strong';
  if (score >= 6.5) return 'Fair';
  if (score >= 5) return 'Needs work';
  return 'Priority';
}

function suggestMode(category: string, topic: string): string {
  const hay = `${category} ${topic}`.toLowerCase();
  if (/grammar|tense|voice|narration|article|preposition|translation|wh family|wh-family/.test(hay)) return 'GRAMMAR';
  if (/vocab|word|synonym/.test(hay)) return 'VOCABULARY';
  if (/interview|hr|behavioral|introduction/.test(hay)) return 'INTERVIEW';
  if (/english|conversation|speaking/.test(hay)) return 'ENGLISH';
  return 'PRACTICE';
}

function defaultImproveTips(topic: string, category: string): string[] {
  const hay = `${category} ${topic}`.toLowerCase();
  if (/laravel/.test(hay)) {
    return ['Explain with a route/controller example', 'Mention Eloquent or middleware clearly'];
  }
  if (/react/.test(hay)) {
    return ['Contrast props vs state with an example', 'Mention re-render trigger briefly'];
  }
  if (/mysql|sql|database|join/.test(hay)) {
    return ['Name the JOIN type and when to use it', 'Add a one-line SQL example'];
  }
  if (/oops|oop|polymorphism|inheritance|encapsulation/.test(hay)) {
    return ['Define the concept in one line', 'Add a tiny real-world example'];
  }
  if (/grammar|tense/.test(hay)) {
    return ['Fix tense consistency (for/since, have been)', 'Keep subject-verb agreement'];
  }
  if (/voice|passive|active/.test(hay)) {
    return ['Identify subject vs object first', 'Rewrite one active ↔ passive pair'];
  }
  if (/narration|speech/.test(hay)) {
    return ['Shift pronouns and tense correctly', 'Change time words (today → that day)'];
  }
  if (/interview|hr|introduction/.test(hay)) {
    return ['Use STAR: Situation → Action → Result', 'Keep intro under 60 seconds'];
  }
  if (/english|conversation/.test(hay)) {
    return ['Use complete sentences', 'Add one concrete example'];
  }
  return ['Cover the key definition first', 'Add one concrete example', 'Keep the answer structured'];
}

function buildFocusPlan(topic: string, category: string, rating: number) {
  const mode = suggestMode(category, topic);
  const minutes = rating < 5 ? 25 : rating < 6.5 ? 20 : 15;
  const action =
    mode === 'GRAMMAR'
      ? `Do a ${minutes}-min grammar drill on ${topic}`
      : mode === 'INTERVIEW'
        ? `Run a short mock interview focused on ${topic}`
        : mode === 'ENGLISH'
          ? `Practice ${topic} in conversation mode (${minutes} min)`
          : `Practice 5 questions on ${topic} (${minutes} min)`;

  const summary =
    rating < 5
      ? `${topic}: priority gap — rebuild basics with examples, then retest.`
      : rating < 6.5
        ? `${topic}: partially clear — tighten definitions and add examples.`
        : `${topic}: close to solid — polish edge cases and clarity.`;

  return { action, summary, minutes, mode };
}
