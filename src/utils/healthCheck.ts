import { connectDatabase, disconnectDatabase } from '../config/database';
import { logger } from './logger';
import { Story, Round, ApiCostLog } from '../models';

export const performHealthCheck = async (): Promise<{ status: string; checks: Record<string, boolean> }> => {
  const checks: Record<string, boolean> = {};
  
  try {
    // 檢查資料庫連接
    await connectDatabase();
    checks['database'] = true;
    logger.info('Database connection: OK');
    
    // 檢查模型創建
    try {
      await Story.createIndexes();
      await Round.createIndexes();
      await ApiCostLog.createIndexes();
      checks['models'] = true;
      logger.info('Database models: OK');
    } catch (error) {
      checks['models'] = false;
      logger.error('Database models: FAILED', error);
    }
    
    // 檢查環境變數
    const requiredEnvVars = [
      'LINE_CHANNEL_ACCESS_TOKEN',
      'LINE_CHANNEL_SECRET',
      'OPENAI_API_KEY',
      'MONGODB_URI'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    checks['environment'] = missingEnvVars.length === 0;
    
    if (checks['environment']) {
      logger.info('Environment variables: OK');
    } else {
      logger.error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
    }
    
    await disconnectDatabase();
    
    const allChecksPass = Object.values(checks).every(check => check);
    
    return {
      status: allChecksPass ? 'healthy' : 'unhealthy',
      checks
    };
    
  } catch (error) {
    logger.error('Health check failed', error);
    checks['database'] = false;
    
    return {
      status: 'unhealthy',
      checks
    };
  }
};