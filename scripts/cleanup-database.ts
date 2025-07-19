import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Story, Round, ApiCostLog } from '../src/models';
import { logger } from '../src/utils/logger';

interface CleanupStats {
  expiredStories: number;
  orphanedRounds: number;
  oldApiLogs: number;
  totalSaved: number;
}

async function cleanupDatabase(): Promise<CleanupStats> {
  const stats: CleanupStats = {
    expiredStories: 0,
    orphanedRounds: 0,
    oldApiLogs: 0,
    totalSaved: 0
  };

  try {
    if (!process.env['MONGODB_URI']) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    await mongoose.connect(process.env['MONGODB_URI']);
    logger.info('Connected to MongoDB for cleanup');

    // 1. 清理已完成超過 30 天的故事
    await cleanupExpiredStories(stats);

    // 2. 清理孤立的回合資料
    await cleanupOrphanedRounds(stats);

    // 3. 清理舊的 API 成本日誌（保留 90 天）
    await cleanupOldApiLogs(stats);

    // 4. 清理已取消超過 7 天的故事
    await cleanupCancelledStories(stats);

    await mongoose.disconnect();
    
    logger.info('Database cleanup completed', stats);
    return stats;
  } catch (error) {
    logger.error('Database cleanup failed', error);
    throw error;
  }
}

async function cleanupExpiredStories(stats: CleanupStats): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const expiredStories = await Story.find({
    status: 'completed',
    updatedAt: { $lt: thirtyDaysAgo }
  });

  for (const story of expiredStories) {
    // 刪除相關的回合
    const deletedRounds = await Round.deleteMany({ story: story._id });
    
    // 保留 API 成本日誌用於分析，僅刪除故事
    await Story.deleteOne({ _id: story._id });
    
    stats.expiredStories++;
    stats.totalSaved += deletedRounds.deletedCount || 0;
    
    logger.info('Cleaned up expired story:', { 
      storyId: story.storyId, 
      rounds: deletedRounds.deletedCount 
    });
  }
}

async function cleanupOrphanedRounds(stats: CleanupStats): Promise<void> {
  // 查找沒有對應故事的回合
  const allRounds = await Round.find({});
  const validStoryIds = await Story.find({}).distinct('_id');
  const validStoryIdStrings = validStoryIds.map(id => id.toString());

  for (const round of allRounds) {
    if (!validStoryIdStrings.includes(round.story.toString())) {
      await Round.deleteOne({ _id: round._id });
      stats.orphanedRounds++;
      
      logger.info('Cleaned up orphaned round:', { 
        roundId: round._id, 
        storyId: round.story 
      });
    }
  }
}

async function cleanupOldApiLogs(stats: CleanupStats): Promise<void> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const deletedLogs = await ApiCostLog.deleteMany({
    createdAt: { $lt: ninetyDaysAgo }
  });

  stats.oldApiLogs = deletedLogs.deletedCount || 0;
  
  logger.info('Cleaned up old API logs:', { count: stats.oldApiLogs });
}

async function cleanupCancelledStories(stats: CleanupStats): Promise<void> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const cancelledStories = await Story.find({
    status: 'cancelled',
    updatedAt: { $lt: sevenDaysAgo }
  });

  for (const story of cancelledStories) {
    // 刪除相關的回合
    const deletedRounds = await Round.deleteMany({ story: story._id });
    
    // 刪除故事
    await Story.deleteOne({ _id: story._id });
    
    stats.totalSaved += deletedRounds.deletedCount || 0;
    
    logger.info('Cleaned up cancelled story:', { 
      storyId: story.storyId, 
      rounds: deletedRounds.deletedCount 
    });
  }
}

async function generateCleanupReport(): Promise<void> {
  try {
    await mongoose.connect(process.env['MONGODB_URI']!);
    
    const totalStories = await Story.countDocuments();
    const activeStories = await Story.countDocuments({ status: 'in_progress' });
    const completedStories = await Story.countDocuments({ status: 'completed' });
    const cancelledStories = await Story.countDocuments({ status: 'cancelled' });
    const totalRounds = await Round.countDocuments();
    const totalApiLogs = await ApiCostLog.countDocuments();

    // 計算今日、本週、本月的統計
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayStories = await Story.countDocuments({
      createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)) }
    });

    const weekStories = await Story.countDocuments({
      createdAt: { $gte: weekAgo }
    });

    const monthStories = await Story.countDocuments({
      createdAt: { $gte: monthAgo }
    });

    const report = {
      timestamp: new Date().toISOString(),
      totals: {
        stories: totalStories,
        rounds: totalRounds,
        apiLogs: totalApiLogs
      },
      storyStatus: {
        active: activeStories,
        completed: completedStories,
        cancelled: cancelledStories
      },
      recentActivity: {
        today: todayStories,
        thisWeek: weekStories,
        thisMonth: monthStories
      }
    };

    logger.info('Database cleanup report:', report);
    
    await mongoose.disconnect();
  } catch (error) {
    logger.error('Failed to generate cleanup report', error);
  }
}

// 執行清理
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--report-only')) {
    generateCleanupReport();
  } else {
    cleanupDatabase()
      .then(stats => {
        console.log('Cleanup completed successfully:', stats);
        process.exit(0);
      })
      .catch(error => {
        console.error('Cleanup failed:', error);
        process.exit(1);
      });
  }
}

export { cleanupDatabase, generateCleanupReport };