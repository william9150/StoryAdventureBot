import { Request, Response, Router } from 'express';
import { WebhookEvent } from '@line/bot-sdk';
// import { lineClient } from '../config/line';
import { logger } from '../utils/logger';
import { handleWebhookEvent } from '../services/webhookHandler';

const router = Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const events: WebhookEvent[] = req.body.events;
    
    if (!events || !Array.isArray(events)) {
      logger.warn('Invalid webhook payload', { body: req.body });
      res.status(400).json({ error: 'Invalid webhook payload' });
      return;
    }

    logger.info(`Received ${events.length} webhook events`);

    const promises = events.map(async (event) => {
      try {
        await handleWebhookEvent(event);
      } catch (error) {
        logger.error('Error handling webhook event', { event, error });
      }
    });

    await Promise.all(promises);
    
    res.status(200).json({ message: 'OK' });
  } catch (error) {
    logger.error('Webhook endpoint error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as webhookRouter };