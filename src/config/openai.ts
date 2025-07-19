import OpenAI from 'openai';

const apiKey = process.env['OPENAI_API_KEY'];

if (!apiKey) {
  throw new Error('OPENAI_API_KEY environment variable is not defined');
}

export const openai = new OpenAI({
  apiKey
});

export const OPENAI_CONFIG = {
  model: 'gpt-4',
  temperature: 0.8,
  maxTokens: 1000
} as const;