import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import { cacheService } from '../cache/cache.service';
import { NotFoundError, UnauthorizedError } from '../utils/errors';
import {
  UpdateProfileInput,
  ChangePasswordInput,
  UpdateSettingsInput,
} from '../validators/user.validator';
import {
  themeSettingsSchema,
  notificationSettingsSchema,
  practiceSettingsSchema,
  aiSettingsSchema,
  voiceSettingsSchema,
} from '../validators/user.validator';

export interface ParsedUserSettings {
  theme: ReturnType<typeof themeSettingsSchema.parse>;
  notifications: ReturnType<typeof notificationSettingsSchema.parse>;
  practice: ReturnType<typeof practiceSettingsSchema.parse>;
  ai: ReturnType<typeof aiSettingsSchema.parse>;
  voice: ReturnType<typeof voiceSettingsSchema.parse>;
}

export class UserService {
  async getMe(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const settings = await userRepository.getSettings(userId);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      profile: user.profile,
      settings: settings
        ? {
            theme: themeSettingsSchema.parse(settings.theme),
            notifications: notificationSettingsSchema.parse(settings.notifications),
            practice: practiceSettingsSchema.parse(settings.practice),
            ai: aiSettingsSchema.parse(settings.ai),
            voice: voiceSettingsSchema.parse(settings.voice),
          }
        : null,
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const profile = await userRepository.updateProfile(userId, input);
    await cacheService.del(`user:settings:${userId}`);
    await cacheService.del(`dashboard:stats:${userId}`);

    return profile;
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Current password is incorrect');

    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await userRepository.updatePassword(userId, passwordHash);

    return { message: 'Password changed successfully' };
  }

  async getSettings(userId: string): Promise<ParsedUserSettings> {
    const cached = await cacheService.get<ParsedUserSettings>(`user:settings:${userId}`);
    if (cached) return cached;

    const settings = await userRepository.getSettings(userId);
    if (!settings) throw new NotFoundError('Settings not found');

    const parsed = {
      theme: themeSettingsSchema.parse(settings.theme),
      notifications: notificationSettingsSchema.parse(settings.notifications),
      practice: practiceSettingsSchema.parse(settings.practice),
      ai: aiSettingsSchema.parse(settings.ai),
      voice: voiceSettingsSchema.parse(settings.voice),
    };

    await cacheService.set(`user:settings:${userId}`, parsed, 3600);
    return parsed;
  }

  async updateSettings(userId: string, input: UpdateSettingsInput) {
    const current = await this.getSettings(userId);

    const updated = {
      theme: { ...current.theme, ...input.theme },
      notifications: { ...current.notifications, ...input.notifications },
      practice: { ...current.practice, ...input.practice },
      ai: { ...current.ai, ...input.ai },
      voice: { ...current.voice, ...input.voice },
    };

    await userRepository.updateSettings(userId, updated);
    await cacheService.del(`user:settings:${userId}`);

    return updated;
  }
}

export class DashboardService {
  async getStats(userId: string) {
    const cached = await cacheService.get(`dashboard:stats:${userId}`);
    if (cached) return cached;

    const stats = await userRepository.getDashboardStats(userId);
    const streak = this.calculateStreak(stats.completedDates || []);

    const result = {
      greeting: this.getGreeting(),
      streak,
      practiceTime: this.formatMinutes(stats.totalPracticeMinutes),
      questionsAnswered: stats.totalSessions * 10,
      averageScore: stats.averageScore || 0,
      totalSessions: stats.totalSessions,
      weakAreas:
        stats.weakTopics.length > 0
          ? stats.weakTopics
          : stats.totalSessions === 0
            ? ['Start practicing to unlock insights']
            : ['Keep practicing — no major weak areas yet'],
      recommendedPractice:
        stats.weakTopics[0]
          ? `Focus on: ${stats.weakTopics[0]}`
          : 'Start a practice session to build your skills',
    };

    await cacheService.set(`dashboard:stats:${userId}`, result, 300);
    return result;
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  private calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;
    const days = new Set(dates.map((d) => d.toISOString().slice(0, 10)));
    const cursor = new Date();
    const today = cursor.toISOString().slice(0, 10);
    cursor.setDate(cursor.getDate() - 1);
    const yesterday = cursor.toISOString().slice(0, 10);
    if (!days.has(today) && !days.has(yesterday)) return 0;
    const check = new Date();
    if (!days.has(today)) check.setDate(check.getDate() - 1);
    let streak = 0;
    while (days.has(check.toISOString().slice(0, 10))) {
      streak += 1;
      check.setDate(check.getDate() - 1);
    }
    return streak;
  }

  private formatMinutes(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  }
}

export const userService = new UserService();
export const dashboardService = new DashboardService();
