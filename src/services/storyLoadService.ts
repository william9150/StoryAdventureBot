import { lineClient } from '../config/line';
import { logger } from '../utils/logger';
import { Story, Round } from '../models';
import { validateStoryId } from '../utils/storyId';

export const loadStory = async (storyId: string, replyToken: string): Promise<void> => {
  try {
    logger.info('Loading story', { storyId });

    // 驗證 Story ID 格式
    if (!validateStoryId(storyId)) {
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: '❌ 無效的 Story ID 格式。'
      });
      return;
    }

    // 查找故事
    const story = await Story.findOne({ storyId });
    if (!story) {
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: '❌ 找不到指定的故事。請檢查 Story ID 是否正確。'
      });
      return;
    }

    // 獲取所有回合
    const rounds = await Round.find({ story: story._id })
      .sort({ roundNumber: 1 })
      .select('roundNumber storyContent options userChoice chosenBy nextCharacterName');

    if (rounds.length === 0) {
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: '❌ 這個故事還沒有任何內容。'
      });
      return;
    }

    // 構建故事摘要
    const storyInfo = buildStoryInfo(story, rounds);
    
    // 發送故事摘要
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: storyInfo
    });

    // 如果故事很長，分批發送詳細內容
    if (rounds.length > 3) {
      await sendDetailedStoryContent(story.chatId, rounds);
    }

    logger.info('Story loaded successfully', { storyId, roundsCount: rounds.length });

  } catch (error) {
    logger.error('Failed to load story', { storyId, error });
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: '❌ 讀取故事時發生錯誤，請稍後再試。'
    });
  }
};

const buildStoryInfo = (story: any, rounds: any[]): string => {
  const statusEmoji: Record<string, string> = {
    'in_progress': '⏳',
    'completed': '✅',
    'cancelled': '❌'
  };

  const statusText: Record<string, string> = {
    'in_progress': '進行中',
    'completed': '已完成',
    'cancelled': '已取消'
  };

  let info = `📖 **故事資訊**\n\n`;
  info += `📝 **Story ID**: ${story.storyId}\n`;
  info += `🎭 **模式**: ${story.playMode === 'consensus' ? '共識模式' : '角色扮演模式'}\n`;
  info += `🎬 **風格**: ${story.genre}\n`;
  info += `${statusEmoji[story.status]} **狀態**: ${statusText[story.status]}\n`;
  info += `📊 **進度**: ${story.currentRound}/${story.totalRounds} 回合\n`;
  info += `📅 **創建時間**: ${story.createdAt.toLocaleString('zh-TW')}\n\n`;

  info += `📚 **故事主軸**:\n${story.theme}\n\n`;

  // 角色資訊
  if (story.characters && story.characters.size > 0) {
    info += `👥 **角色列表**:\n`;
    for (const [character, userId] of story.characters) {
      info += `   • ${character}`;
      if (userId && story.playMode === 'role_playing') {
        info += ` (由 <@${userId}> 扮演)`;
      }
      info += `\n`;
    }
    info += `\n`;
  }

  // 最近的故事發展
  const recentRounds = rounds.slice(-2);
  if (recentRounds.length > 0) {
    info += `📄 **最近發展** (最後 ${recentRounds.length} 回合):\n\n`;
    
    for (const round of recentRounds) {
      info += `**第 ${round.roundNumber} 回合**\n`;
      info += `${round.storyContent.substring(0, 100)}`;
      if (round.storyContent.length > 100) {
        info += '...';
      }
      info += `\n`;
      
      if (round.userChoice) {
        info += `選擇: ${round.userChoice}\n`;
      }
      info += `\n`;
    }
  }

  if (rounds.length > 2) {
    info += `\n💡 完整故事內容將在下方分段顯示...`;
  }

  return info;
};

const sendDetailedStoryContent = async (chatId: string, rounds: any[]): Promise<void> => {
  try {
    // 分批發送，每批3個回合
    const batchSize = 3;
    
    for (let i = 0; i < rounds.length; i += batchSize) {
      const batch = rounds.slice(i, i + batchSize);
      let batchContent = `📚 **故事內容 (第 ${i + 1}-${Math.min(i + batchSize, rounds.length)} 回合)**\n\n`;
      
      for (const round of batch) {
        batchContent += `**第 ${round.roundNumber} 回合**\n`;
        batchContent += `${round.storyContent}\n\n`;
        
        if (round.options && round.options.length > 0) {
          batchContent += `選項:\n`;
          for (let j = 0; j < round.options.length; j++) {
            batchContent += `${String.fromCharCode(65 + j)}. ${round.options[j]}\n`;
          }
          batchContent += `\n`;
        }
        
        if (round.userChoice) {
          batchContent += `✅ 選擇: ${round.userChoice}\n`;
          if (round.chosenBy) {
            batchContent += `👤 選擇者: <@${round.chosenBy}>\n`;
          }
        }
        
        batchContent += `\n---\n\n`;
      }
      
      await lineClient.pushMessage(chatId, {
        type: 'text',
        text: batchContent
      });
      
      // 避免發送過快
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
  } catch (error) {
    logger.error('Failed to send detailed story content', { chatId, error });
  }
};