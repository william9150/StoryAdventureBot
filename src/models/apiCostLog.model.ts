import { Schema, model, Document } from 'mongoose';
import { IApiCostLog } from '../types/story.types';

interface ApiCostLogDocument extends IApiCostLog, Document {}

const apiCostLogSchema = new Schema<ApiCostLogDocument>({
  storyId: {
    type: String,
    required: true,
    index: true
  },
  requestType: {
    type: String,
    enum: ['story_generation', 'character_selection'],
    required: true
  },
  tokens: {
    prompt: {
      type: Number,
      required: true
    },
    completion: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    }
  },
  cost: {
    type: Number,
    required: true
  },
  modelName: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

apiCostLogSchema.index({ storyId: 1 });
apiCostLogSchema.index({ createdAt: -1 });

export const ApiCostLog = model<ApiCostLogDocument>('ApiCostLog', apiCostLogSchema);