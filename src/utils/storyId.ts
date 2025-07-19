import { randomBytes } from 'crypto';

export const generateStoryId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = randomBytes(8).toString('hex');
  return `${timestamp}-${randomPart}`;
};

export const validateStoryId = (storyId: string): boolean => {
  const pattern = /^[a-z0-9]+-[a-f0-9]{16}$/;
  return pattern.test(storyId);
};