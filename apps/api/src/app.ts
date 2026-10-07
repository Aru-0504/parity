import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { generalRateLimiter } from './middleware/rateLimiter';
import { ENV } from './config/env';
import { ErrorCode } from '@ismo/shared';

export const createApp = () => {
  const app = express();

  // Basic security & parsing middleware
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow mobile apps, curl, Postman (origin === undefined) or permitted web origins
        if (!origin || ENV.CORS_ORIGIN.includes('*') || ENV.CORS_ORIGIN.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked for origin: ${origin}`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging
  if (ENV.NODE_ENV !== 'test') {
    app.use(morgan(ENV.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // General rate limiter
  app.use(generalRateLimiter);

  // Mount API endpoints
  app.use('/api', routes);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      code: ErrorCode.NOT_FOUND,
      message: `Cannot ${req.method} ${req.originalUrl}`,
    });
  });

  // Central error handler
  app.use(errorHandler);

  return app;
};
