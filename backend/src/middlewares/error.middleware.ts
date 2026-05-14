import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/response';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  });

  // Our custom operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Prisma-specific error handling
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const field = (err.meta?.target as string[])?.join(', ') ?? 'field';
        res.status(409).json({
          success: false,
          message: `A record with this ${field} already exists`,
        });
        return;
      }
      case 'P2025':
        res.status(404).json({
          success: false,
          message: 'Record not found',
        });
        return;
      case 'P2003':
        res.status(422).json({
          success: false,
          message: 'Referenced record does not exist',
        });
        return;
      default:
        res.status(500).json({
          success: false,
          message: 'Database error',
          ...(env.NODE_ENV === 'development' && { code: err.code }),
        });
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(422).json({
      success: false,
      message: 'Invalid data provided',
    });
    return;
  }

  // CORS errors
  if (err.message.startsWith('CORS:')) {
    res.status(403).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // JWT errors (should already be handled in middleware, but safety net)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
    return;
  }

  // Multer file size error
  if (err.name === 'MulterError') {
    res.status(413).json({
      success: false,
      message: 'File too large',
    });
    return;
  }

  // Unknown / programming errors — don't leak details in prod
  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
