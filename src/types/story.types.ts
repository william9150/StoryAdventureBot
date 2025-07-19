export type StoryStatus = 'in_progress' | 'completed' | 'cancelled';
export type PlayMode = 'consensus' | 'role_playing';
export type StoryGenre = '恐怖' | '懸疑' | '愛情' | '喜劇' | '奇幻' | '科幻' | '寫實';

export interface IStory {
  storyId: string;
  chatId: string;
  theme: string;
  characters: Map<string, string>; // { "角色名": "LINE User ID" }
  totalRounds: number;
  currentRound: number;
  status: StoryStatus;
  genre: StoryGenre;
  playMode: PlayMode;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRound {
  story: string; // Story ObjectId reference
  roundNumber: number;
  storyContent: string;
  options: string[];
  userChoice?: string;
  chosenBy?: string; // LINE User ID
  nextCharacterName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IApiCostLog {
  storyId: string;
  requestType: 'story_generation' | 'character_selection';
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
  modelName: string;
  createdAt: Date;
}

export interface StoryCreationState {
  step: 'mode_selection' | 'theme_input' | 'character_input' | 'character_assignment' | 'genre_selection' | 'rounds_setting' | 'confirmation' | 'completed';
  playMode?: PlayMode;
  theme?: string;
  characters?: string[];
  characterAssignments?: Map<string, string>;
  currentAssignmentIndex?: number;
  genre?: StoryGenre;
  totalRounds?: number;
}

export interface OpenAIStoryResponse {
  story_text: string;
  options: string[];
  next_character_name: string;
}