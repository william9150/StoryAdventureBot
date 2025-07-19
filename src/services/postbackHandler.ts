import { PostbackEvent } from '@line/bot-sdk';
import { lineClient } from '../config/line';
import { logger } from '../utils/logger';

export const handlePostback = async (event: PostbackEvent): Promise<void> => {
  const data = event.postback.data;
  const userId = event.source.userId;

  if (!userId) {
    logger.warn('No user ID found in postback event');
    return;
  }

  logger.info('Postback received', {
    userId,
    data
  });

  try {
    await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: 'Postback 處理功能開發中...'
    });
  } catch (error) {
    logger.error('Error handling postback', { userId, data, error });
  }
};