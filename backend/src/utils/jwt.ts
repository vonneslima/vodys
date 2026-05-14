import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './response';

export interface TokenPayload {
  sub: string; // userId
  username: string;
  role: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'Vodys',
    audience: 'Vodys-client',
  });
};

export const generateRefreshToken = (userId: string, tokenId: string): string => {
  return jwt.sign({ sub: userId, tokenId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'Vodys',
    audience: 'Vodys-client',
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      issuer: 'Vodys',
      audience: 'Vodys-client',
    }) as TokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expired', 401);
    }
    throw new AppError('Invalid token', 401);
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'Vodys',
      audience: 'Vodys-client',
    }) as RefreshTokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Refresh token expired', 401);
    }
    throw new AppError('Invalid refresh token', 401);
  }
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};

// Extract expiry date from JWT claims
export const getTokenExpiry = (expiresIn: string): Date => {
  const units: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiresIn format: ${expiresIn}`);
  const [, value, unit] = match;
  return new Date(Date.now() + parseInt(value) * units[unit]);
};
