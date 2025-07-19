import { openai, OPENAI_CONFIG } from '../config/openai';
import { logger } from '../utils/logger';
import { ApiCostLog } from '../models';
import { OpenAIStoryResponse, StoryGenre } from '../types/story.types';

interface StoryGenerationParams {
  storyId: string;
  theme: string;
  characters: string[];
  genre: StoryGenre;
  recentHistory?: string;
  userChoice?: string;
  previousCharacterName?: string;
}

export const generateStorySegment = async (params: StoryGenerationParams): Promise<OpenAIStoryResponse> => {
  const {
    storyId,
    theme,
    characters,
    genre,
    recentHistory = '',
    userChoice = '',
    previousCharacterName = ''
  } = params;

  try {
    const prompt = buildStoryPrompt({
      theme,
      characters,
      genre,
      recentHistory,
      userChoice,
      previousCharacterName
    });

    logger.info('Generating story segment', { storyId, genre, charactersCount: characters.length });

    const response = await openai.chat.completions.create({
      model: OPENAI_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: prompt
        }
      ],
      temperature: OPENAI_CONFIG.temperature,
      max_tokens: OPENAI_CONFIG.maxTokens
    });

    const completion = response.choices[0]?.message?.content;
    if (!completion) {
      throw new Error('No completion received from OpenAI');
    }

    // 記錄 API 使用成本
    await logApiCost(storyId, response, 'story_generation');

    // 解析 JSON 回應
    const storyResponse = parseStoryResponse(completion);
    
    logger.info('Story segment generated successfully', { 
      storyId, 
      optionsCount: storyResponse.options.length,
      nextCharacter: storyResponse.next_character_name
    });

    return storyResponse;

  } catch (error) {
    logger.error('Failed to generate story segment', { storyId, error });
    throw error;
  }
};

const buildStoryPrompt = (params: {
  theme: string;
  characters: string[];
  genre: StoryGenre;
  recentHistory: string;
  userChoice: string;
  previousCharacterName: string;
}): string => {
  const {
    theme,
    characters,
    genre,
    recentHistory,
    userChoice,
    previousCharacterName
  } = params;

  const charactersText = characters.join(', ');
  const genreStyle = getGenreStyleGuide(genre);

  let prompt = `# Identity & Goal
You are a master storyteller and an expert Dungeon Master for an interactive fiction game. Your primary goal is to create a dramatic and coherent narrative. Your secondary goal is to ensure all players feel engaged by trying to involve different characters over time.

# Style Guide
The story's genre is ${genre}. ${genreStyle}

# Story Context
- Core Premise: ${theme}
- Player Characters: ${charactersText}`;

  if (recentHistory) {
    prompt += `\n- Story So Far (last 2-3 rounds): ${recentHistory}`;
  }

  if (userChoice && previousCharacterName) {
    prompt += `\n- Player's Last Action (taken by ${previousCharacterName}): ${userChoice}`;
  }

  prompt += `

# Your Task
1. Based on all the above information, decide which character is in the best position to act next to move the story forward in the most compelling way.
2. Write a captivating story segment (approx. 150-200 words) focusing on this character's perspective or situation.
3. Conclude by presenting exactly 3 distinct, actionable choices for that character.
4. Output your response strictly in the following JSON format. Do not include any text outside of the JSON structure.

{
  "story_text": "The narrative continues here...",
  "options": ["Actionable Choice 1", "Actionable Choice 2", "Actionable Choice 3"],
  "next_character_name": "The name of the character you decided should act next (must be one from the character list)"
}`;

  return prompt;
};

const getGenreStyleGuide = (genre: StoryGenre): string => {
  const styleGuides = {
    '恐怖': 'Your tone should be dark and ominous. Use atmospheric descriptions, building tension, and psychological horror elements. Focus on fear, suspense, and the unknown.',
    '懸疑': 'Create intrigue and mystery. Use plot twists, hidden clues, and psychological tension. Keep readers guessing about what will happen next.',
    '愛情': 'Focus on emotional connections, romantic tension, and relationship dynamics. Use warm, emotional language and explore character feelings deeply.',
    '喜劇': 'Use humor, wit, and lighthearted situations. Include funny dialogue, comedic timing, and absurd situations while maintaining story coherence.',
    '奇幻': 'Embrace magical elements, mythical creatures, and supernatural powers. Create a sense of wonder and adventure in a fantastical world.',
    '科幻': 'Incorporate futuristic technology, space exploration, or scientific concepts. Focus on how technology affects characters and society.',
    '寫實': 'Ground the story in realistic situations and believable character motivations. Focus on authentic human emotions and plausible scenarios.'
  };

  return styleGuides[genre] || styleGuides['寫實'];
};

const parseStoryResponse = (completion: string): OpenAIStoryResponse => {
  try {
    // 清理回應，移除可能的 markdown 格式
    const cleanedCompletion = completion
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleanedCompletion) as OpenAIStoryResponse;

    // 驗證回應格式
    if (!parsed.story_text || !parsed.options || !parsed.next_character_name) {
      throw new Error('Invalid story response format');
    }

    if (!Array.isArray(parsed.options) || parsed.options.length !== 3) {
      throw new Error('Story response must contain exactly 3 options');
    }

    return parsed;

  } catch (error) {
    logger.error('Failed to parse story response', { completion, error });
    
    // 回傳預設回應以防解析失敗
    return {
      story_text: '故事生成時發生錯誤，讓我們繼續冒險...',
      options: [
        '檢查周圍環境',
        '與同伴討論下一步',
        '謹慎地前進'
      ],
      next_character_name: '主角'
    };
  }
};

const logApiCost = async (
  storyId: string, 
  response: any,
  requestType: 'story_generation' | 'character_selection'
): Promise<void> => {
  try {
    const usage = response.usage;
    if (!usage) {
      return;
    }

    // OpenAI GPT-4 定價 (2024年價格，實際使用時請更新)
    const pricePerPromptToken = 0.03 / 1000; // $0.03 per 1K tokens
    const pricePerCompletionToken = 0.06 / 1000; // $0.06 per 1K tokens

    const cost = (usage.prompt_tokens * pricePerPromptToken) + 
                 (usage.completion_tokens * pricePerCompletionToken);

    const costLog = new ApiCostLog({
      storyId,
      requestType,
      tokens: {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens
      },
      cost,
      modelName: response.model
    });

    await costLog.save();

    logger.info('API cost logged', {
      storyId,
      requestType,
      tokens: usage.total_tokens,
      cost: cost.toFixed(4)
    });

  } catch (error) {
    logger.error('Failed to log API cost', { storyId, error });
  }
};