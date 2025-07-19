import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Story, Round, ApiCostLog } from '../src/models';
import { logger } from '../src/utils/logger';

async function initializeDatabase(): Promise<void> {
  try {
    // 檢查環境變數
    if (!process.env['MONGODB_URI']) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // 連接資料庫
    await mongoose.connect(process.env['MONGODB_URI']);
    logger.info('Connected to MongoDB for initialization');

    // 建立索引
    logger.info('Creating database indexes...');
    await Story.createIndexes();
    await Round.createIndexes();
    await ApiCostLog.createIndexes();
    
    logger.info('Database indexes created successfully');

    // 驗證連接和集合
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    logger.info('Available collections:', { 
      collections: collections.map(c => c.name) 
    });

    // 顯示集合統計
    await showCollectionStats();

    // 插入測試資料（僅在開發環境）
    if (process.env['NODE_ENV'] === 'development') {
      await insertTestData();
    }

    await mongoose.disconnect();
    logger.info('Database initialization completed successfully');
  } catch (error) {
    logger.error('Database initialization failed', error);
    process.exit(1);
  }
}

async function showCollectionStats(): Promise<void> {
  try {
    const storyCount = await Story.countDocuments();
    const roundCount = await Round.countDocuments();
    const logCount = await ApiCostLog.countDocuments();

    logger.info('Collection statistics:', {
      stories: storyCount,
      rounds: roundCount,
      apiCostLogs: logCount
    });

    // 顯示索引資訊
    const storyIndexes = await Story.collection.getIndexes();
    const roundIndexes = await Round.collection.getIndexes();
    const logIndexes = await ApiCostLog.collection.getIndexes();

    logger.info('Index information:', {
      storyIndexes: Object.keys(storyIndexes),
      roundIndexes: Object.keys(roundIndexes),
      logIndexes: Object.keys(logIndexes)
    });
  } catch (error) {
    logger.error('Failed to show collection stats', error);
  }
}

async function insertTestData(): Promise<void> {
  try {
    // 檢查是否已有資料
    const existingStories = await Story.countDocuments();
    if (existingStories > 0) {
      logger.info('Test data already exists, skipping insertion');
      return;
    }

    logger.info('Inserting test data...');

    // 建立測試故事
    const testStory = new Story({
      storyId: 'test-demo-001',
      chatId: 'demo-chat-001',
      theme: '在一個被魔法詛咒的古老圖書館中，探索失落的魔法書籍',
      characters: new Map([
        ['艾莉森', 'demo-user-001'],
        ['馬庫斯', 'demo-user-002'],
        ['神秘圖書管理員', 'demo-user-003']
      ]),
      totalRounds: 15,
      currentRound: 0,
      status: 'in_progress',
      genre: '奇幻',
      playMode: 'role_playing'
    });

    await testStory.save();

    // 建立測試回合
    const testRound = new Round({
      story: testStory._id,
      roundNumber: 1,
      storyContent: '你們站在古老圖書館的入口前，厚重的橡木門上刻滿了神秘的符文。空氣中瀰漫著古老書籍的味道，還有一絲魔法的氣息。艾莉森注意到門把上有微弱的藍光閃爍。',
      options: [
        '小心地轉動門把，嘗試進入圖書館',
        '先研究門上的符文，尋找線索',
        '召喚護身魔法後再進入'
      ],
      nextCharacterName: '艾莉森'
    });

    await testRound.save();

    // 建立測試 API 成本日誌
    const testApiLog = new ApiCostLog({
      storyId: testStory.storyId,
      requestType: 'story_generation',
      tokens: {
        prompt: 150,
        completion: 75,
        total: 225
      },
      cost: 0.00675,
      modelName: 'gpt-4'
    });

    await testApiLog.save();

    logger.info('Test data inserted successfully:', {
      storyId: testStory.storyId,
      roundId: testRound._id,
      logId: testApiLog._id
    });
  } catch (error) {
    logger.error('Failed to insert test data', error);
  }
}

// 執行初始化
if (require.main === module) {
  initializeDatabase();
}