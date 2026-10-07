import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ErrorCode } from '@ismo/shared';

export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.') || 'body';
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });

        res.status(400).json({
          success: false,
          code: ErrorCode.VALIDATION_ERROR,
          message: error.errors[0]?.message || 'Validation failed',
          errors,
        });
        return;
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.') || 'query';
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });

        res.status(400).json({
          success: false,
          code: ErrorCode.VALIDATION_ERROR,
          message: error.errors[0]?.message || 'Invalid query parameters',
          errors,
        });
        return;
      }
      next(error);
    }
  };
};
