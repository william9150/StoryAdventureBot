import { WebhookEvent, MessageEvent, PostbackEvent } from '@line/bot-sdk';
import { logger } from '../utils/logger';
import { handleMessage } from './messageHandler';
import { handlePostback } from './postbackHandler';

export const handleWebhookEvent = async (event: WebhookEvent): Promise<void> => {
  logger.debug('Processing webhook event', { type: event.type, source: event.source });

  try {
    switch (event.type) {
      case 'message':
        await handleMessage(event as MessageEvent);
        break;
      case 'postback':
        await handlePostback(event as PostbackEvent);
        break;
      case 'follow':
        logger.info('User followed the bot', { userId: event.source.userId });
        break;
      case 'unfollow':
        logger.info('User unfollowed the bot', { userId: event.source.userId });
        break;
      default:
        logger.debug('Unhandled event type', { type: event.type });
    }
  } catch (error) {
    logger.error('Error in webhook event handler', { event, error });
    throw error;
  }
};