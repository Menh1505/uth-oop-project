import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const OPENAI_CONFIG = {
  model: 'gpt-4-turbo-preview',
  maxTokens: 1500,
  temperature: 0.7,
  timeout: 30000,
} as const;