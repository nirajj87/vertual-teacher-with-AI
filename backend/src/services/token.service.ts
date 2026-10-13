import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../middleware/auth.middleware';

export class TokenService {
  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  generateRefreshToken(payload: { userId: string }): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
  }

  getRefreshTokenExpiry(): Date {
    const days = parseInt(env.JWT_REFRESH_EXPIRES_IN) || 7;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (env.JWT_REFRESH_EXPIRES_IN.includes('d') ? days : 1));
    return expiry;
  }
}

export const tokenService = new TokenService();
