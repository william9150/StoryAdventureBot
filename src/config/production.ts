export const PRODUCTION_CONFIG = {
  // Rate limiting
  rateLimiting: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    skipSuccessfulRequests: true
  },
  
  // Database connection
  database: {
    maxConnections: 10,
    bufferMaxEntries: 0,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
  
  // OpenAI configuration
  openai: {
    timeout: 30000, // 30 seconds
    maxRetries: 3,
    temperature: 0.8,
    maxTokens: 1000
  },
  
  // Logging
  logging: {
    level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
    format: 'json'
  },
  
  // Health check intervals
  healthCheck: {
    interval: 30000, // 30 seconds
    timeout: 5000    // 5 seconds
  }
} as const;