import express from 'express';
import cors from 'cors';
import { lineMiddleware } from './config/line';
import { webhookRouter } from './routes/webhook';
import { logger } from './utils/logger';
import { performHealthCheck } from './utils/healthCheck';
import { rateLimiter } from './middleware/rateLimiter';
import { securityHeaders, removeServerHeader } from './middleware/security';

const app = express();

// Security middleware
app.use(removeServerHeader);
app.use(securityHeaders);

// Rate limiting (only for webhook endpoints)
app.use('/webhook', rateLimiter);

// CORS and body parsing
app.use(cors({
  origin: process.env['NODE_ENV'] === 'production' ? false : true,
  credentials: false
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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