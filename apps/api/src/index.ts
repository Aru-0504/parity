import { createApp } from './app';
import { ENV } from './config/env';
import { logger } from './utils/logger';

const app = createApp();

const server = app.listen(ENV.PORT, () => {
  logger.info(`Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
  logger.info(`API Base URL: http://localhost:${ENV.PORT}/api`);
});

// Graceful shutdown
const shutdown = () => {
  logger.info('Shutting down server gracefully...');
  server.close(() => {
    logger.info('Server closed. Process terminating.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
