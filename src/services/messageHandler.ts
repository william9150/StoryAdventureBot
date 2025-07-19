import { MessageEvent, TextMessage } from '@line/bot-sdk';
import { lineClient } from '../config/line';
import { logger } from '../utils/logger';
import { 
  startStoryCreation, 
  handleThemeInput, 
  handleCharacterInput, 
  handleRoundsInput,
  getCreationState
} from './storyCreationService';
import { loadStory } from './storyLoadService';
import { Story } from '../models';

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

const handleStartStory = async (chatId: string, userId: string, event: MessageEvent): Promise<void> => {
  try {
    // 檢查是否已有進行中的故事
    const existingStory = await Story.findOne({ chatId, status: 'in_progress' });
    if (existingStory) {
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: `⚠️ 此聊天室已有進行中的故事 (Story ID: ${existingStory.storyId})。\n\n如要開始新故事，請先使用 /重設故事 結束目前的故事。`
      });
      return;
    }

    await startStoryCreation(chatId, event.replyToken);
  } catch (error) {
    logger.error('Error starting story', { chatId, userId, error });
    await replyError(event);
  }
};

const handleResetStory = async (chatId: string, event: MessageEvent): Promise<void> => {
  try {
    const existingStory = await Story.findOne({ chatId, status: 'in_progress' });
    
    if (!existingStory) {
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: '❌ 此聊天室目前沒有進行中的故事。'
      });
      return;
    }

    await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: '⚠️ **確認重設故事**\n\n確定要重設目前正在進行的故事嗎？所有進度將會遺失。',
      quickReply: {
        items: [
          {
            type: 'action',
            action: {
              type: 'postback',
              label: '是，我確定',
              data: 'reset_confirm'
            }
          },
          {
            type: 'action',
            action: {
              type: 'postback',
              label: '否，取消',
              data: 'reset_cancel'
            }
          }
        ]
      }
    });
  } catch (error) {
    logger.error('Error resetting story', { chatId, error });
    await replyError(event);
  }
};

const handleLoadStory = async (text: string, event: MessageEvent): Promise<void> => {
  try {
    // 解析指令：/讀取故事 [故事ID]
    const parts = text.trim().split(/\s+/);
    
    if (parts.length < 2) {
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: '❌ 請提供 Story ID。\n\n使用方式：/讀取故事 [Story ID]\n\n例如：/讀取故事 abc123-def456'
      });
      return;
    }

    const storyId = parts[1] || '';
    await loadStory(storyId, event.replyToken);
    
  } catch (error) {
    logger.error('Error handling load story', { text, error });
    await replyError(event);
  }
};

const handleStoryInput = async (chatId: string, userId: string, text: string, event: MessageEvent): Promise<void> => {
  logger.debug('Story input received', { chatId, userId, text });
  
  try {
    const creationState = getCreationState(chatId);
    
    if (!creationState) {
      // 如果沒有創建狀態，檢查是否是故事互動
      const existingStory = await Story.findOne({ chatId, status: 'in_progress' });
      if (existingStory) {
        // TODO: 處理故事互動邏輯
        logger.debug('Story interaction detected', { chatId, text });
      }
      return;
    }

    // 處理故事創建流程中的輸入
    switch (creationState.step) {
      case 'theme_input':
        await handleThemeInput(chatId, text, event.replyToken);
        break;
      case 'character_input':
        await handleCharacterInput(chatId, text, event.replyToken);
        break;
      case 'character_assignment':
        // TODO: 處理角色指派中的 @ 訊息
        break;
      case 'rounds_setting':
        await handleRoundsInput(chatId, text, event.replyToken);
        break;
      default:
        logger.debug('Unhandled creation step', { chatId, step: creationState.step });
    }
  } catch (error) {
    logger.error('Error handling story input', { chatId, userId, text, error });
    await replyError(event);
  }
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