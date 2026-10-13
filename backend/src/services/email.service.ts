import { logger } from '../utils/logger';
import { env } from '../config/env';

export class EmailService {
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    logger.info('Email verification link generated', { email, verifyUrl });
    // In production: integrate SendGrid, AWS SES, etc.
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    logger.info('Password reset link generated', { email, resetUrl });
    // In production: integrate SendGrid, AWS SES, etc.
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    logger.info('Welcome email queued', { email, name });
  }
}

export const emailService = new EmailService();
