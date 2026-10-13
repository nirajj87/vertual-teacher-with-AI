import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  preferredLanguage: z.string().min(2).max(10).optional(),
  englishLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
  learningGoal: z.string().max(500).optional(),
  experienceLevel: z.enum(['FRESHER', 'JUNIOR', 'MID', 'SENIOR', 'LEAD']).optional(),
  targetRole: z.string().max(200).optional(),
  preferredAiProvider: z.enum(['GEMINI', 'OPENAI', 'OLLAMA']).optional(),
  voicePreference: z.enum(['MALE', 'FEMALE', 'NEUTRAL']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number'),
});

export const themeSettingsSchema = z.object({
  mode: z.enum(['light', 'dark', 'system']).default('system'),
  accentColor: z.string().default('blue'),
});

export const notificationSettingsSchema = z.object({
  email: z.boolean().default(true),
  practiceReminders: z.boolean().default(true),
  weeklyReport: z.boolean().default(true),
});

export const practiceSettingsSchema = z.object({
  defaultDifficulty: z.enum(['BEGINNER', 'MEDIUM', 'ADVANCED']).default('MEDIUM'),
  questionsPerSession: z.number().min(5).max(50).default(20),
  showHints: z.boolean().default(true),
  autoAdvance: z.boolean().default(false),
});

export const aiSettingsSchema = z.object({
  provider: z.enum(['gemini', 'openai', 'ollama']).default('gemini'),
  maxTokens: z.number().min(256).max(4096).default(1024),
  temperature: z.number().min(0).max(2).default(0.7),
});

export const voiceSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  speed: z.number().min(0.5).max(2).default(1.0),
  autoPlayQuestions: z.boolean().default(false),
  sttProvider: z.enum(['browser', 'openai', 'whisper', 'mock']).optional(),
  ttsProvider: z.enum(['browser', 'openai', 'mock']).optional(),
});

export const updateSettingsSchema = z.object({
  theme: themeSettingsSchema.partial().optional(),
  notifications: notificationSettingsSchema.partial().optional(),
  practice: practiceSettingsSchema.partial().optional(),
  ai: aiSettingsSchema.partial().optional(),
  voice: voiceSettingsSchema.partial().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
