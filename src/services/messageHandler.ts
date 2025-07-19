import { MessageEvent, TextMessage } from '@line/bot-sdk';
import { lineClient } from '../config/line';
import { logger } from '../utils/logger';

export const handleMessage = async (event: MessageEvent): Promise<void> => {
  if (event.message.type !== 'text') {
    logger.debug('Non-text message received', { messageType: event.message.type });
    return;
  }

  const message = event.message as TextMessage;
  const chatId = getChatId(event);
  const userId = event.source.userId;

  if (!userId) {
    logger.warn('No user ID found in message event');
    return;
  }

  logger.info('Text message received', {
    chatId,
    userId,
    text: message.text
  });

  try {
    switch (message.text.trim()) {
      case '/開始說書':
        await handleStartStory(chatId, userId, event);
        break;
      case '/重設故事':
        await handleResetStory(chatId, event);
        break;
      default:
        if (message.text.startsWith('/讀取故事')) {
          await handleLoadStory(message.text, event);
        } else {
          await handleStoryInput(chatId, userId, message.text, event);
        }
        break;
    }
  } catch (error) {
    logger.error('Error handling message', { chatId, userId, text: message.text, error });
    await replyError(event);
  }
};

const getChatId = (event: MessageEvent): string => {
  switch (event.source.type) {
    case 'user':
      return event.source.userId;
    case 'group':
      return event.source.groupId;
    case 'room':
      return event.source.roomId;
    default:
      return 'unknown';
  }
};

const handleStartStory = async (_chatId: string, _userId: string, event: MessageEvent): Promise<void> => {
  await lineClient.replyMessage(event.replyToken, {
    type: 'text',
    text: '開始故事功能開發中...'
  });
};

const handleResetStory = async (_chatId: string, event: MessageEvent): Promise<void> => {
  await lineClient.replyMessage(event.replyToken, {
    type: 'text',
    text: '重設故事功能開發中...'
  });
};

const handleLoadStory = async (_text: string, event: MessageEvent): Promise<void> => {
  await lineClient.replyMessage(event.replyToken, {
    type: 'text',
    text: '讀取故事功能開發中...'
  });
};

const handleStoryInput = async (chatId: string, userId: string, text: string, _event: MessageEvent): Promise<void> => {
  logger.debug('Story input received', { chatId, userId, text });
};

const replyError = async (event: MessageEvent): Promise<void> => {
  try {
    await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: '抱歉，處理您的訊息時發生錯誤，請稍後再試。'
    });
  } catch (error) {
    logger.error('Failed to send error reply', error);
  }
};