import { Schema, model, Document } from 'mongoose';
import { IRound } from '../types/story.types';

interface RoundDocument extends IRound, Document {}

const roundSchema = new Schema<RoundDocument>({
  story: {
    type: String,
    ref: 'Story',
    required: true,
    index: true
  },
  roundNumber: {
    type: Number,
    required: true
  },
  storyContent: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  userChoice: {
    type: String
  },
  chosenBy: {
    type: String // LINE User ID
  },
  nextCharacterName: {
    type: String
  }
}, {
  timestamps: true
});

roundSchema.index({ story: 1, roundNumber: 1 });
roundSchema.index({ story: 1 });

export const Round = model<RoundDocument>('Round', roundSchema);