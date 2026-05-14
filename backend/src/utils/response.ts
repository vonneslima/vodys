import { Response } from 'express';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: unknown[];

  constructor(
    message: string,
    statusCode: number = 500,
    errors?: unknown[],
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(errors: unknown[]) {
    super('Validation failed', 422, errors);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

interface SuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
}

interface ErrorResponse {
  success: false;
  message: string;
  errors?: unknown[];
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  options?: {
    message?: string;
    statusCode?: number;
    meta?: Record<string, unknown>;
  }
): void => {
  const { message, statusCode = 200, meta } = options ?? {};
  const body: SuccessResponse<T> = { success: true, data };
  if (message) body.message = message;
  if (meta) body.meta = meta;
  res.status(statusCode).json(body);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: unknown[]
): void => {
  const body: ErrorResponse = { success: false, message };
  if (errors) body.errors = errors;
  res.status(statusCode).json(body);
};

export const sendCreated = <T>(res: Response, data: T, message?: string): void => {
  sendSuccess(res, data, { statusCode: 201, message });
};

export const sendNoContent = (res: Response): void => {
  res.status(204).send();
};
