import { Schema, model, Document } from 'mongoose';
import { IStory, StoryStatus, PlayMode, StoryGenre } from '../types/story.types';

interface StoryDocument extends IStory, Document {}

const storySchema = new Schema<StoryDocument>({
  storyId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  chatId: {
    type: String,
    required: true,
    index: true
  },
  theme: {
    type: String,
    required: true
  },
  characters: {
    type: Map,
    of: String,
    default: new Map()
  },
  totalRounds: {
    type: Number,
    default: 50,
    min: 5,
    max: 100
  },
  currentRound: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'cancelled'] as StoryStatus[],
    default: 'in_progress'
  },
  genre: {
    type: String,
    enum: ['恐怖', '懸疑', '愛情', '喜劇', '奇幻', '科幻', '寫實'] as StoryGenre[],
    required: true
  },
  playMode: {
    type: String,
    enum: ['consensus', 'role_playing'] as PlayMode[],
    required: true
  }
}, {
  timestamps: true
});

storySchema.index({ chatId: 1, status: 1 });
storySchema.index({ storyId: 1 });

export const Story = model<StoryDocument>('Story', storySchema);