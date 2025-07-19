import { PostbackEvent } from '@line/bot-sdk';
import { lineClient } from '../config/line';
import { logger } from '../utils/logger';
import {
  handleModeSelection,
  handleGenreSelection,
  handleConfirmation,
  resetStoryCreation
} from './storyCreationService';
import { handleStoryChoice } from './storyInteractionService';
import { Story } from '../models';
import { StoryGenre } from '../types/story.types';

export const handlePostback = async (event: PostbackEvent): Promise<void> => {
  const data = event.postback.data;
  const userId = event.source.userId;
  const chatId = getChatId(event);

  if (!userId) {
    logger.warn('No user ID found in postback event');
    return;
  }

  logger.info('Postback received', {
    userId,
    chatId,
    data
  });

  try {
    // 模式選擇
    if (data === 'mode_consensus') {
      await handleModeSelection(chatId, 'consensus', event.replyToken);
    } else if (data === 'mode_role_playing') {
      await handleModeSelection(chatId, 'role_playing', event.replyToken);
    }
    // 風格選擇
    else if (data.startsWith('genre_')) {
      const genre = data.replace('genre_', '') as StoryGenre;
      await handleGenreSelection(chatId, genre, event.replyToken);
    }
    // 確認開始
    else if (data === 'confirm_start') {
      await handleConfirmation(chatId, true, event.replyToken);
    } else if (data === 'restart_setup') {
      await handleConfirmation(chatId, false, event.replyToken);
    }
    // 重設故事確認
    else if (data === 'reset_confirm') {
      await handleStoryReset(chatId, event.replyToken);
    } else if (data === 'reset_cancel') {
      await lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: '✅ 已取消重設，故事繼續進行。'
      });
    }
    // 故事選擇
    else if (data.startsWith('choice_')) {
      await handleStoryChoicePostback(chatId, userId, data, event.replyToken);
    }
    // 未知的 postback
    else {
      logger.warn('Unknown postback data', { data, userId, chatId });
    }
  } catch (error) {
    logger.error('Error handling postback', { userId, chatId, data, error });
    await replyError(event);
  }
};

const getChatId = (event: PostbackEvent): string => {
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

const handleStoryReset = async (chatId: string, replyToken: string): Promise<void> => {
  try {
    const existingStory = await Story.findOne({ chatId, status: 'in_progress' });
    
    if (existingStory) {
      existingStory.status = 'cancelled';
      await existingStory.save();
      
      resetStoryCreation(chatId);
      
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: `✅ 故事已重設完成 (Story ID: ${existingStory.storyId})。\n\n現在可以使用 /開始說書 創建新的故事。`
      });
    } else {
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: '❌ 找不到要重設的故事。'
      });
    }
  } catch (error) {
    logger.error('Error resetting story', { chatId, error });
    throw error;
  }
};

const handleStoryChoicePostback = async (
  chatId: string,
  userId: string,
  data: string,
  replyToken: string
): Promise<void> => {
  try {
    // 解析選擇數據：choice_roundNumber_choiceIndex_choiceText
    const parts = data.split('_');
    if (parts.length < 4) {
      logger.warn('Invalid choice data format', { data });
      return;
    }

    const roundNumber = parseInt(parts[1] || '0');
    const choiceIndex = parseInt(parts[2] || '0');
    const choiceText = parts.slice(3).join('_'); // 重組選擇文字

    if (isNaN(roundNumber) || isNaN(choiceIndex)) {
      logger.warn('Invalid choice numbers', { data, roundNumber, choiceIndex });
      return;
    }

    await handleStoryChoice(chatId, userId, roundNumber, choiceIndex, choiceText, replyToken);

  } catch (error) {
    logger.error('Error handling story choice postback', { chatId, userId, data, error });
    await replyError({ replyToken } as PostbackEvent);
  }
};

const replyError = async (event: PostbackEvent): Promise<void> => {
  try {
    await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: '抱歉，處理您的操作時發生錯誤，請稍後再試。'
    });
  } catch (error) {
    logger.error('Failed to send error reply', error);
  }
};