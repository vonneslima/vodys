import jwt from 'jsonwebtoken';
import { env } from '../config/env';

type AccessPayload = {
  sub: string;
  username?: string;
  email?: string;
  role?: string;
  jti?: string;
};

type RefreshPayload = {
  sub: string;
  tokenId: string;
};

export function generateAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_SECRET as string, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function generateRefreshToken(
  userId: string,
  tokenId: string
): string {
  return jwt.sign(
    { sub: userId, tokenId },
    env.JWT_REFRESH_SECRET as string,
    {
      expiresIn:
        env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    }
  );
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(
    token,
    env.JWT_SECRET as string
  ) as AccessPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(
    token,
    env.JWT_REFRESH_SECRET as string
  ) as RefreshPayload;
}

export function getTokenExpiry(
  expiry: string = env.JWT_EXPIRES_IN
): string {
  return expiry;
}