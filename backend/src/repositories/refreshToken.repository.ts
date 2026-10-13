import { prisma } from '../config/database';

export class RefreshTokenRepository {
  async create(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async findByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { profile: true } } },
    });
  }

  async revoke(tokenHash: string) {
    await prisma.refreshToken.update({
      where: { tokenHash },
      data: { revoked: true },
    });
  }

  async revokeAllForUser(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  async deleteExpired() {
    await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}

export class TokenRepository {
  async createEmailVerification(email: string, token: string, expiresAt: Date) {
    await prisma.emailVerificationToken.deleteMany({ where: { email } });
    return prisma.emailVerificationToken.create({
      data: { email, token, expiresAt },
    });
  }

  async findEmailVerification(token: string) {
    return prisma.emailVerificationToken.findUnique({ where: { token } });
  }

  async deleteEmailVerification(token: string) {
    await prisma.emailVerificationToken.delete({ where: { token } });
  }

  async createPasswordReset(email: string, token: string, expiresAt: Date) {
    await prisma.passwordResetToken.deleteMany({ where: { email } });
    return prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });
  }

  async findPasswordReset(token: string) {
    return prisma.passwordResetToken.findUnique({ where: { token } });
  }

  async markPasswordResetUsed(token: string) {
    await prisma.passwordResetToken.update({
      where: { token },
      data: { used: true },
    });
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
export const tokenRepository = new TokenRepository();
