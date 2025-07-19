import { Message, QuickReply, QuickReplyItem } from '@line/bot-sdk';
import { lineClient } from '../config/line';
import { logger } from '../utils/logger';
import { Story, Round } from '../models';
import { generateStoryId } from '../utils/storyId';
import { StoryCreationState, PlayMode, StoryGenre } from '../types/story.types';
import { generateStorySegment } from './openaiService';
import { metrics } from '../utils/metrics';

const creationStates = new Map<string, StoryCreationState>();

export const startStoryCreation = async (chatId: string, replyToken: string): Promise<void> => {
  logger.info('Starting story creation', { chatId });

  const isGroupChat = chatId.startsWith('C') || chatId.startsWith('R');
  
  if (isGroupChat) {
    await showModeSelection(chatId, replyToken);
  } else {
    creationStates.set(chatId, {
      step: 'theme_input',
      playMode: 'consensus'
    });
    await askForTheme(replyToken);
  }
};

const showModeSelection = async (chatId: string, replyToken: string): Promise<void> => {
  creationStates.set(chatId, {
    step: 'mode_selection'
  });

  const quickReply: QuickReply = {
    items: [
      {
        type: 'action',
        action: {
          type: 'postback',
          label: '[A] 共識模式 (預設)',
          data: 'mode_consensus'
        }
      },
      {
        type: 'action',
        action: {
          type: 'postback',
          label: '[B] 角色扮演模式',
          data: 'mode_role_playing'
        }
      }
    ]
  };

  const message: Message = {
    type: 'text',
    text: '請選擇遊玩模式：\n\n🤝 **共識模式**: 聊天室中任何人都可以選擇故事選項\n🎭 **角色扮演模式**: AI 會指定特定玩家輪流做選擇',
    quickReply
  };

  await lineClient.replyMessage(replyToken, message);
};

export const handleModeSelection = async (chatId: string, mode: PlayMode, replyToken: string): Promise<void> => {
  const state = creationStates.get(chatId);
  if (!state || state.step !== 'mode_selection') {
    logger.warn('Invalid state for mode selection', { chatId, state });
    return;
  }

  state.playMode = mode;
  state.step = 'theme_input';
  creationStates.set(chatId, state);

  await askForTheme(replyToken);
};

const askForTheme = async (replyToken: string): Promise<void> => {
  const message: Message = {
    type: 'text',
    text: '📚 **設定故事主軸**\n\n請輸入你想要的故事背景與主軸，例如：\n• 「在一個被魔法詛咒的古城中尋找解除詛咒的方法」\n• 「一群朋友在廢棄的遊樂園中遇到超自然現象」\n• 「太空船在未知星球墜毀後的生存冒險」'
  };

  await lineClient.replyMessage(replyToken, message);
};

export const handleThemeInput = async (chatId: string, theme: string, replyToken: string): Promise<void> => {
  const state = creationStates.get(chatId);
  if (!state || state.step !== 'theme_input') {
    logger.warn('Invalid state for theme input', { chatId, state });
    return;
  }

  state.theme = theme;
  state.step = 'character_input';
  creationStates.set(chatId, state);

  await askForCharacters(replyToken);
};

const askForCharacters = async (replyToken: string): Promise<void> => {
  const message: Message = {
    type: 'text',
    text: '👥 **設定角色**\n\n請輸入故事中的角色名稱，以逗號分隔，例如：\n• 「傑克, 艾拉, 神秘的老人」\n• 「艾莉絲, 瘋帽客, 柴郡貓」\n• 「船長, 工程師, 醫生, 探險家」'
  };

  await lineClient.replyMessage(replyToken, message);
};

export const handleCharacterInput = async (chatId: string, characterText: string, replyToken: string): Promise<void> => {
  const state = creationStates.get(chatId);
  if (!state || state.step !== 'character_input') {
    logger.warn('Invalid state for character input', { chatId, state });
    return;
  }

  const characters = characterText.split(',').map(char => char.trim()).filter(char => char.length > 0);
  
  if (characters.length === 0) {
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: '❌ 請至少輸入一個角色名稱。'
    });
    return;
  }

  state.characters = characters;
  
  if (state.playMode === 'role_playing') {
    state.step = 'character_assignment';
    state.characterAssignments = new Map();
    state.currentAssignmentIndex = 0;
    creationStates.set(chatId, state);
    
    await askForCharacterAssignment(chatId, replyToken);
  } else {
    state.step = 'genre_selection';
    creationStates.set(chatId, state);
    
    await showGenreSelection(replyToken);
  }
};

const askForCharacterAssignment = async (chatId: string, replyToken: string): Promise<void> => {
  const state = creationStates.get(chatId);
  if (!state || !state.characters || state.currentAssignmentIndex === undefined) {
    return;
  }

  const currentCharacter = state.characters[state.currentAssignmentIndex];
  
  const message: Message = {
    type: 'text',
    text: `🎭 **角色指派**\n\n第 ${state.currentAssignmentIndex + 1} 個角色是 **${currentCharacter}**。\n請 @ 一位玩家來扮演這個角色。`
  };

  await lineClient.replyMessage(replyToken, message);
};

export const handleCharacterAssignment = async (chatId: string, characterName: string, userId: string, replyToken: string): Promise<void> => {
  const state = creationStates.get(chatId);
  if (!state || state.step !== 'character_assignment' || !state.characterAssignments || !state.characters) {
    return;
  }

  state.characterAssignments.set(characterName, userId);
  state.currentAssignmentIndex = (state.currentAssignmentIndex || 0) + 1;

  if (state.currentAssignmentIndex >= state.characters.length) {
    state.step = 'genre_selection';
    creationStates.set(chatId, state);
    
    await showGenreSelection(replyToken);
  } else {
    creationStates.set(chatId, state);
    await askForCharacterAssignment(chatId, replyToken);
  }
};

const showGenreSelection = async (replyToken: string): Promise<void> => {
  const genres: StoryGenre[] = ['恐怖', '懸疑', '愛情', '喜劇', '奇幻', '科幻', '寫實'];
  
  const quickReplyItems: QuickReplyItem[] = genres.map(genre => ({
    type: 'action',
    action: {
      type: 'postback',
      label: genre,
      data: `genre_${genre}`
    }
  }));

  const quickReply: QuickReply = {
    items: quickReplyItems
  };

  const message: Message = {
    type: 'text',
    text: '🎬 **選擇故事風格**\n\n請選擇你想要的故事風格：',
    quickReply
  };

  await lineClient.replyMessage(replyToken, message);
};

export const handleGenreSelection = async (chatId: string, genre: StoryGenre, replyToken: string): Promise<void> => {
  const state = creationStates.get(chatId);
  if (!state || state.step !== 'genre_selection') {
    return;
  }

  state.genre = genre;
  state.step = 'rounds_setting';
  creationStates.set(chatId, state);

  await askForRounds(replyToken);
};

const askForRounds = async (replyToken: string): Promise<void> => {
  const message: Message = {
    type: 'text',
    text: '🔢 **設定故事長度**\n\n請設定故事的回合數 (5-100)：\n• 短篇故事：5-15 回合\n• 中篇故事：16-50 回合\n• 長篇故事：51-100 回合\n\n請輸入數字：'
  };

  await lineClient.replyMessage(replyToken, message);
};

export const handleRoundsInput = async (chatId: string, roundsText: string, replyToken: string): Promise<void> => {
  const state = creationStates.get(chatId);
  if (!state || state.step !== 'rounds_setting') {
    return;
  }

  const rounds = parseInt(roundsText.trim());
  
  if (isNaN(rounds) || rounds < 5 || rounds > 100) {
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: '❌ 請輸入 5-100 之間的有效數字。'
    });
    return;
  }

  state.totalRounds = rounds;
  state.step = 'confirmation';
  creationStates.set(chatId, state);

  await showConfirmation(chatId, replyToken);
};

const showConfirmation = async (chatId: string, replyToken: string): Promise<void> => {
  const state = creationStates.get(chatId);
  if (!state || !state.theme || !state.characters || !state.genre || !state.totalRounds) {
    return;
  }

  let confirmText = `📋 **故事設定確認**\n\n`;
  confirmText += `🎭 **模式**: ${state.playMode === 'consensus' ? '共識模式' : '角色扮演模式'}\n`;
  confirmText += `📚 **主軸**: ${state.theme}\n`;
  confirmText += `👥 **角色**: ${state.characters.join(', ')}\n`;
  
  if (state.characterAssignments && state.characterAssignments.size > 0) {
    confirmText += `🎯 **角色指派**:\n`;
    for (const [character, userId] of state.characterAssignments) {
      confirmText += `   • ${character}: <@${userId}>\n`;
    }
  }
  
  confirmText += `🎬 **風格**: ${state.genre}\n`;
  confirmText += `🔢 **回合數**: ${state.totalRounds}\n\n`;
  confirmText += `確認開始故事嗎？`;

  const quickReply: QuickReply = {
    items: [
      {
        type: 'action',
        action: {
          type: 'postback',
          label: '✅ 確認開始',
          data: 'confirm_start'
        }
      },
      {
        type: 'action',
        action: {
          type: 'postback',
          label: '❌ 重新設定',
          data: 'restart_setup'
        }
      }
    ]
  };

  const message: Message = {
    type: 'text',
    text: confirmText,
    quickReply
  };

  await lineClient.replyMessage(replyToken, message);
};

export const handleConfirmation = async (chatId: string, confirmed: boolean, replyToken: string): Promise<void> => {
  const state = creationStates.get(chatId);
  if (!state || state.step !== 'confirmation') {
    return;
  }

  if (!confirmed) {
    creationStates.delete(chatId);
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: '設定已重新開始，請重新輸入 /開始說書 來建立新故事。'
    });
    return;
  }

  await createStory(chatId, state, replyToken);
};

const createStory = async (chatId: string, state: StoryCreationState, replyToken: string): Promise<void> => {
  if (!state.theme || !state.characters || !state.genre || !state.playMode || !state.totalRounds) {
    logger.error('Invalid story creation state', { chatId, state });
    return;
  }

  try {
    const storyId = generateStoryId();
    const characterMap = new Map<string, string>();
    
    if (state.characterAssignments) {
      for (const [character, userId] of state.characterAssignments) {
        characterMap.set(character, userId);
      }
    }

    const story = new Story({
      storyId,
      chatId,
      theme: state.theme,
      characters: characterMap,
      totalRounds: state.totalRounds,
      genre: state.genre,
      playMode: state.playMode
    });

    await story.save();
    creationStates.delete(chatId);

    // Update metrics
    metrics.incrementStories();
    metrics.incrementActiveStories();

    logger.info('Story created successfully', { storyId, chatId });

    const message: Message = {
      type: 'text',
      text: `🎉 **故事創建成功！**\n\n📖 **Story ID**: ${storyId}\n\n故事即將開始，準備好迎接你的冒險了嗎？\n\n🔄 正在生成第一個故事段落...`
    };

    await lineClient.replyMessage(replyToken, message);

    // 生成第一個故事段落
    setTimeout(async () => {
      await generateFirstStorySegment(storyId, chatId, state);
    }, 1000); // 延遲1秒讓用戶看到創建成功訊息
    
  } catch (error) {
    logger.error('Failed to create story', { chatId, error });
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: '❌ 創建故事時發生錯誤，請稍後再試。'
    });
  }
};

export const resetStoryCreation = async (chatId: string): Promise<void> => {
  creationStates.delete(chatId);
  logger.info('Story creation state reset', { chatId });
};

export const getCreationState = (chatId: string): StoryCreationState | undefined => {
  return creationStates.get(chatId);
};

const generateFirstStorySegment = async (storyId: string, chatId: string, state: StoryCreationState): Promise<void> => {
  try {
    if (!state.theme || !state.characters || !state.genre) {
      logger.error('Invalid state for story generation', { storyId, state });
      return;
    }

    logger.info('Generating first story segment', { storyId, chatId });

    const storyResponse = await generateStorySegment({
      storyId,
      theme: state.theme,
      characters: state.characters,
      genre: state.genre
    });

    // 創建第一個回合記錄
    const story = await Story.findOne({ storyId });
    if (!story) {
      logger.error('Story not found for first segment generation', { storyId });
      return;
    }

    const round = new Round({
      story: story._id,
      roundNumber: 1,
      storyContent: storyResponse.story_text,
      options: storyResponse.options,
      nextCharacterName: storyResponse.next_character_name
    });

    await round.save();

    // 更新故事的當前回合
    story.currentRound = 1;
    await story.save();

    // 發送故事段落給用戶
    await sendStorySegment(chatId, storyResponse, 1, state.playMode || 'consensus', state.characterAssignments);

    logger.info('First story segment generated and sent', { storyId, chatId });

  } catch (error) {
    logger.error('Failed to generate first story segment', { storyId, chatId, error });
    
    // 發送錯誤訊息
    await lineClient.pushMessage(chatId, {
      type: 'text',
      text: '❌ 生成故事時發生錯誤，請使用 /重設故事 重新開始。'
    });
  }
};

const sendStorySegment = async (
  chatId: string, 
  storyResponse: { story_text: string; options: string[]; next_character_name: string },
  roundNumber: number,
  playMode: PlayMode,
  characterAssignments?: Map<string, string>
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
  const quickReplyItems: QuickReplyItem[] = storyResponse.options.map((option, index) => ({
    type: 'action',
    action: {
      type: 'postback',
      label: `${String.fromCharCode(65 + index)}. ${option.length > 20 ? option.substring(0, 17) + '...' : option}`,
      data: `choice_${roundNumber}_${index}_${option}`
    }
  }));

  const message: Message = {
    type: 'text',
    text: messageText,
    quickReply: {
      items: quickReplyItems
    }
  };

  await lineClient.pushMessage(chatId, message);
};