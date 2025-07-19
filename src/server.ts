import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';

const PORT = process.env['PORT'] || 8080;

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Webhook endpoint: http://localhost:${PORT}/webhook`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer().catch(error => {
  logger.error('Unhandled error during server startup', error);
  process.exit(1);
});