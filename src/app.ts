import express from 'express';
import cors from 'cors';
import { lineMiddleware } from './config/line';
import { webhookRouter } from './routes/webhook';
import { logger } from './utils/logger';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'StoryAdventureBot'
  });
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