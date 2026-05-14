import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/response';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, target: ValidationTarget = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const formatted = formatZodErrors(result.error);
      throw new ValidationError(formatted);
    }

    // Replace request data with parsed (coerced) values
    req[target] = result.data;
    next();
  };
};

const formatZodErrors = (error: ZodError): Array<{ field: string; message: string }> => {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'root',
    message: issue.message,
  }));
};
