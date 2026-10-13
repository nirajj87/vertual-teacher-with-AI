import { prisma } from '../config/database';
import { User, UserProfile, Prisma } from '@prisma/client';

export type UserWithProfile = User & { profile: UserProfile | null };

export class UserRepository {
  async findByEmail(email: string): Promise<UserWithProfile | null> {
    return prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }

  async findById(id: string): Promise<UserWithProfile | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    name: string;
  }): Promise<UserWithProfile> {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        profile: { create: { name: data.name } },
        settings: { create: {} },
      },
      include: { profile: true },
    });
  }

  async updateProfile(
    userId: string,
    data: Prisma.UserProfileUpdateInput
  ): Promise<UserProfile> {
    return prisma.userProfile.update({
      where: { userId },
      data,
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async verifyEmail(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  }

  async getSettings(userId: string) {
    return prisma.userSettings.findUnique({ where: { userId } });
  }

  async updateSettings(userId: string, data: Prisma.UserSettingsUpdateInput) {
    return prisma.userSettings.update({
      where: { userId },
      data,
    });
  }

  async getDashboardStats(userId: string) {
    const [sessions, topicProgress, weakAreas] = await Promise.all([
      prisma.practiceSession.findMany({
        where: { userId, status: 'COMPLETED' },
        select: { averageScore: true, startedAt: true, completedAt: true },
      }),
      prisma.userTopicProgress.findMany({
        where: { userId },
        orderBy: { averageScore: 'asc' },
        take: 5,
      }),
      prisma.weakArea.findMany({
        where: { userId },
        orderBy: { severity: 'desc' },
        take: 5,
      }),
    ]);

    const totalSessions = sessions.length;
    const avgScore =
      totalSessions > 0
        ? sessions.reduce((sum, s) => sum + (s.averageScore || 0), 0) / totalSessions
        : 0;

    const totalMinutes = sessions.reduce((sum, s) => {
      if (s.completedAt && s.startedAt) {
        return sum + (s.completedAt.getTime() - s.startedAt.getTime()) / 60000;
      }
      return sum;
    }, 0);

    const weakTopics =
      weakAreas.length > 0
        ? weakAreas.map((w) => w.topic)
        : topicProgress.filter((t) => t.averageScore < 6).map((t) => t.topic);

    return {
      totalSessions,
      averageScore: Math.round(avgScore * 10) / 10,
      totalPracticeMinutes: Math.round(totalMinutes),
      weakTopics,
      completedDates: sessions
        .map((s) => s.completedAt)
        .filter((d): d is Date => !!d),
    };
  }
}

export const userRepository = new UserRepository();
