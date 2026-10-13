import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import {
  refreshTokenRepository,
  tokenRepository,
} from '../repositories/refreshToken.repository';
import { tokenService } from './token.service';
import { emailService } from './email.service';
import { hashToken, generateToken } from '../utils/hash';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../validators/auth.validator';

const SALT_ROUNDS = 12;

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await userRepository.create({
      email: input.email,
      passwordHash,
      name: input.name,
    });

    const verifyToken = generateToken();
    await tokenRepository.createEmailVerification(
      user.email,
      verifyToken,
      new Date(Date.now() + 24 * 60 * 60 * 1000)
    );
    await emailService.sendVerificationEmail(user.email, verifyToken);
    await emailService.sendWelcomeEmail(user.email, input.name);

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async refresh(refreshToken: string) {
    const decoded = tokenService.verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const stored = await refreshTokenRepository.findByHash(tokenHash);
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = stored.user;
    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    await refreshTokenRepository.revoke(tokenHash);

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    await refreshTokenRepository.revoke(tokenHash);
  }

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = generateToken();
    await tokenRepository.createPasswordReset(
      user.email,
      resetToken,
      new Date(Date.now() + 60 * 60 * 1000)
    );
    await emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(input: ResetPasswordInput) {
    const resetRecord = await tokenRepository.findPasswordReset(input.token);
    if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const user = await userRepository.findByEmail(resetRecord.email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    await userRepository.updatePassword(user.id, passwordHash);
    await tokenRepository.markPasswordResetUsed(input.token);
    await refreshTokenRepository.revokeAllForUser(user.id);

    return { message: 'Password reset successfully' };
  }

  async verifyEmail(token: string) {
    const record = await tokenRepository.findEmailVerification(token);
    if (!record || record.expiresAt < new Date()) {
      throw new ValidationError('Invalid or expired verification token');
    }

    const user = await userRepository.findByEmail(record.email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await userRepository.verifyEmail(user.id);
    await tokenRepository.deleteEmailVerification(token);

    return { message: 'Email verified successfully' };
  }

  async resendVerification(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    if (user.emailVerified) {
      throw new ValidationError('Email already verified');
    }

    const verifyToken = generateToken();
    await tokenRepository.createEmailVerification(
      user.email,
      verifyToken,
      new Date(Date.now() + 24 * 60 * 60 * 1000)
    );
    await emailService.sendVerificationEmail(user.email, verifyToken);

    return { message: 'Verification email sent' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const accessToken = tokenService.generateAccessToken({ userId, email, role });
    const refreshToken = tokenService.generateRefreshToken({ userId });
    const tokenHash = hashToken(refreshToken);

    await refreshTokenRepository.create(
      userId,
      tokenHash,
      tokenService.getRefreshTokenExpiry()
    );

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    role: string;
    emailVerified: boolean;
    profile: { name: string; profilePhoto: string | null } | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      name: user.profile?.name ?? '',
      profilePhoto: user.profile?.profilePhoto ?? null,
    };
  }
}

export const authService = new AuthService();
