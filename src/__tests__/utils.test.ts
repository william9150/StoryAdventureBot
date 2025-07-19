import { generateStoryId, validateStoryId } from '../utils/storyId';
import { logger } from '../utils/logger';

describe('Story ID Utils', () => {
  test('generateStoryId should create valid story ID', () => {
    const storyId = generateStoryId();
    expect(typeof storyId).toBe('string');
    expect(storyId.length).toBeGreaterThan(10);
    expect(storyId).toMatch(/^[a-z0-9]+-[a-f0-9]{16}$/);
  });

  test('validateStoryId should validate correct format', () => {
    const validId = 'abc123-1234567890abcdef';
    expect(validateStoryId(validId)).toBe(true);
    
    const invalidIds = [
      'invalid',
      'abc-123',
      '123-abc',
      '',
      'abc123-invalid'
    ];
    
    invalidIds.forEach(id => {
      expect(validateStoryId(id)).toBe(false);
    });
  });
});

describe('Logger', () => {
  test('logger should have required methods', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });
});