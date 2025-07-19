import { lineClient } from '../config/line';
import { logger } from '../utils/logger';
import { Story, Round } from '../models';
import { generateStorySegment } from './openaiService';
import { PlayMode } from '../types/story.types';

export const handleStoryChoice = async (
  chatId: string,
  userId: string,
  roundNumber: number,
  choiceIndex: number,
  choiceText: string,
  replyToken: string
): Promise<void> => {
  try {
    logger.info('Handling story choice', { chatId, userId, roundNumber, choiceIndex });

    // 查找故事和對應回合
    const story = await Story.findOne({ chatId, status: 'in_progress' });
    if (!story) {
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: '❌ 找不到進行中的故事。'
      });
      return;
    }

    const round = await Round.findOne({ story: story._id, roundNumber });
    if (!round) {
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: '❌ 找不到對應的故事回合。'
      });
      return;
    }

    // 檢查回合是否已經有選擇
    if (round.userChoice) {
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: '⚠️ 這個回合已經有人做過選擇了。'
      });
      return;
    }

    // 驗證選擇索引
    if (choiceIndex < 0 || choiceIndex >= round.options.length) {
      await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: '❌ 無效的選擇。'
      });
      return;
    }

    // 角色扮演模式權限檢查
    if (story.playMode === 'role_playing' && round.nextCharacterName) {
      const assignedUserId = story.characters.get(round.nextCharacterName);
      if (assignedUserId && assignedUserId !== userId) {
        await lineClient.replyMessage(replyToken, {
          type: 'text',
          text: `⚠️ 現在是 **${round.nextCharacterName}** 的回合，請等待 <@${assignedUserId}> 做選擇。`
        });
        return;
      }
    }

    // 更新回合選擇
    round.userChoice = round.options[choiceIndex] || choiceText;
    round.chosenBy = userId;
    await round.save();

    // 回應選擇確認
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: `✅ **選擇已確認**\n\n你選擇了：${round.userChoice}\n\n🔄 正在生成下一個故事段落...`
    });

    // 檢查是否到達故事結尾
    if (story.currentRound >= story.totalRounds) {
      await handleStoryEnding(story, round);
      return;
    }

    // 生成下一個故事段落
    setTimeout(async () => {
      await generateNextStorySegment(story, round);
    }, 1000);

  } catch (error) {
    logger.error('Error handling story choice', { chatId, userId, roundNumber, error });
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: '❌ 處理選擇時發生錯誤，請稍後再試。'
    });
  }
};

const generateNextStorySegment = async (story: any, previousRound: any): Promise<void> => {
  try {
    const nextRoundNumber = story.currentRound + 1;
    
    logger.info('Generating next story segment', { 
      storyId: story.storyId, 
      nextRound: nextRoundNumber 
    });

    // 獲取最近的故事歷史
    const recentRounds = await Round.find({ story: story._id })
      .sort({ roundNumber: -1 })
      .limit(3)
      .select('storyContent userChoice');

    const recentHistory = recentRounds
      .reverse()
      .map(r => `${r.storyContent}\n選擇: ${r.userChoice || '無'}`)
      .join('\n\n');

    // 獲取角色列表
    const characters: string[] = Array.from(story.characters.keys());

    // 生成新的故事段落
    const storyResponse = await generateStorySegment({
      storyId: story.storyId,
      theme: story.theme,
      characters,
      genre: story.genre,
      recentHistory,
      userChoice: previousRound.userChoice,
      previousCharacterName: previousRound.nextCharacterName
    });

    // 創建新回合記錄
    const newRound = new Round({
      story: story._id,
      roundNumber: nextRoundNumber,
      storyContent: storyResponse.story_text,
      options: storyResponse.options,
      nextCharacterName: storyResponse.next_character_name
    });

    await newRound.save();

    // 更新故事當前回合
    story.currentRound = nextRoundNumber;
    await story.save();

    // 發送新的故事段落
    await sendStorySegment(
      story.chatId,
      storyResponse,
      nextRoundNumber,
      story.playMode,
      story.characters
    );

    logger.info('Next story segment generated and sent', { 
      storyId: story.storyId, 
      roundNumber: nextRoundNumber 
    });

  } catch (error) {
    logger.error('Failed to generate next story segment', { storyId: story.storyId, error });
    
    await lineClient.pushMessage(story.chatId, {
      type: 'text',
      text: '❌ 生成下一個故事段落時發生錯誤。請使用 /重設故事 重新開始。'
    });
  }
};

const sendStorySegment = async (
  chatId: string,
  storyResponse: { story_text: string; options: string[]; next_character_name: string },
  roundNumber: number,
  playMode: PlayMode,
  characterAssignments: Map<string, string>
): Promise<void> => {
  let messageText = `📖 **第 ${roundNumber} 回合**\n\n${storyResponse.story_text}\n\n`;

  // 根據遊玩模式添加不同的提示
  if (playMode === 'role_playing' && characterAssignments) {
    const assignedUserId = characterAssignments.get(storyResponse.next_character_name);
    if (assignedUserId) {
      messageText += `🎭 **${storyResponse.next_character_name}** 的回合！<@${assignedUserId}> 請選擇你的行動：\n\n`;
    } else {
      messageText += `🎭 **${storyResponse.next_character_name}** 的回合！請選擇行動：\n\n`;
    }
  } else {
    messageText += `🤝 請選擇下一步行動：\n\n`;
  }

  // 創建選項按鈕
  const quickReplyItems = storyResponse.options.map((option, index) => ({
    type: 'action' as const,
    action: {
      type: 'postback' as const,
      label: `${String.fromCharCode(65 + index)}. ${option.length > 20 ? option.substring(0, 17) + '...' : option}`,
      data: `choice_${roundNumber}_${index}_${option}`
    }
  }));

  const message = {
    type: 'text' as const,
    text: messageText,
    quickReply: {
      items: quickReplyItems
    }
  };

  await lineClient.pushMessage(chatId, message);
};

const handleStoryEnding = async (story: any, finalRound: any): Promise<void> => {
  try {
    logger.info('Handling story ending', { storyId: story.storyId });

    // 生成故事結局
    const characters: string[] = Array.from(story.characters.keys());
    const recentRounds = await Round.find({ story: story._id })
      .sort({ roundNumber: -1 })
      .limit(5)
      .select('storyContent userChoice');

    const recentHistory = recentRounds
      .reverse()
      .map(r => `${r.storyContent}\n選擇: ${r.userChoice || '無'}`)
      .join('\n\n');

    // 特殊的結局生成 prompt
    const endingResponse = await generateStorySegment({
      storyId: story.storyId,
      theme: story.theme + ' (這是故事的最終回合，請提供一個完整的結局)',
      characters,
      genre: story.genre,
      recentHistory,
      userChoice: finalRound.userChoice,
      previousCharacterName: finalRound.nextCharacterName
    });

    // 更新故事狀態
    story.status = 'completed';
    await story.save();

    // 發送結局
    const endingMessage = {
      type: 'text' as const,
      text: `🎬 **故事結局**\n\n${endingResponse.story_text}\n\n🎉 **故事完結！**\n\n📖 **Story ID**: ${story.storyId}\n回合數: ${story.currentRound}/${story.totalRounds}\n\n感謝你的參與！可以使用 /開始說書 創造新的冒險故事。`
    };

    await lineClient.pushMessage(story.chatId, endingMessage);

    logger.info('Story ending sent', { storyId: story.storyId });

  } catch (error) {
    logger.error('Failed to handle story ending', { storyId: story.storyId, error });
    
    await lineClient.pushMessage(story.chatId, {
      type: 'text',
      text: `🎉 **故事完結！**\n\n📖 **Story ID**: ${story.storyId}\n\n感謝你的參與！雖然結局生成時遇到了一些問題，但你們的冒險已經圓滿結束。\n\n可以使用 /開始說書 創造新的故事。`
    });
  }
};