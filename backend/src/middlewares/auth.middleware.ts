import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { cache, CACHE_KEYS } from '../config/redis';
import { UnauthorizedError } from '../utils/response';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authorization header missing or malformed');
  }

  const token = authHeader.slice(7);

  const payload = verifyAccessToken(token);

  // Check if token was explicitly revoked (logout)
  if (payload.jti) {
    const isBlacklisted = await cache.exists(CACHE_KEYS.tokenBlacklist(payload.jti));
    if (isBlacklisted) {
      throw new UnauthorizedError('Token has been revoked');
    }
  }

  req.user = {
    id: payload.sub,
    username: payload.username ?? '',
    role: payload.role as import('@prisma/client').Role,
  };

  next();
};

// Optional auth — sets req.user if token present, does not fail if absent
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  try {
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      username: payload.username ?? '',
      role: payload.role as import('@prisma/client').Role,
    };
  } catch {
    // Silently ignore invalid tokens for optional auth
  }

  next();
};
