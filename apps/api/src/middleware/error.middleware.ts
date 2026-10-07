import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ErrorCode } from '@ismo/shared';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  errors?: Record<string, string[]>;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || ErrorCode.INTERNAL_SERVER_ERROR;

  logger.error(`${req.method} ${req.url} - ${statusCode} - ${err.message}`, {
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    code: errorCode,
    message: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred'
      : err.message,
    ...(err.errors ? { errors: err.errors } : {}),
  });
};
