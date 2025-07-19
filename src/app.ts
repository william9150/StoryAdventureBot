import express from 'express';
import cors from 'cors';
import { lineMiddleware } from './config/line';
import { webhookRouter } from './routes/webhook';
import { logger } from './utils/logger';
import { performHealthCheck } from './utils/healthCheck';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', async (_req, res) => {
  try {
    const healthStatus = await performHealthCheck();
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      service: 'StoryAdventureBot',
      timestamp: new Date().toISOString(),
      ...healthStatus
    });
  } catch (error) {
    logger.error('Health check endpoint error', error);
    res.status(503).json({
      service: 'StoryAdventureBot',
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

app.use('/webhook', lineMiddleware, webhookRouter);

app.use((req, res) => {
  logger.warn('Route not found', { path: req.path, method: req.method });
  res.status(404).json({ error: 'Not Found' });
});

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', error);
  res.status(500).json({ error: 'Internal Server Error' });
});

export { app };