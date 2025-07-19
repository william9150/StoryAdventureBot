import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30; // requests per window

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  // Clean expired entries
  Object.keys(store).forEach(key => {
    const entry = store[key];
    if (entry && entry.resetTime < now) {
      delete store[key];
    }
  });
  
  // Initialize or get current count
  if (!store[clientId]) {
    store[clientId] = {
      count: 0,
      resetTime: now + WINDOW_MS
    };
  }
  
  const clientData = store[clientId];
  
  // Reset if window expired
  if (clientData.resetTime < now) {
    clientData.count = 0;
    clientData.resetTime = now + WINDOW_MS;
  }
  
  // Increment count
  clientData.count++;
  
  // Check if limit exceeded
  if (clientData.count > MAX_REQUESTS) {
    logger.warn('Rate limit exceeded', { 
      clientId, 
      count: clientData.count,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
    return;
  }
  
  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': Math.max(0, MAX_REQUESTS - clientData.count).toString(),
    'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString()
  });
  
  next();
};