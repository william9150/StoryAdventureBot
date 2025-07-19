# MongoDB 資料庫設定指南

## 資料庫初始化

### 1. MongoDB Atlas 設定

#### 建立叢集
```bash
# 1. 前往 MongoDB Atlas (https://cloud.mongodb.com)
# 2. 建立新專案：StoryAdventureBot
# 3. 建立免費 M0 叢集
# 4. 選擇最近的區域（建議：Singapore 或 Tokyo）
# 5. 叢集名稱：StoryAdv
```

#### 設定網路存取
```bash
# 1. 點擊 "Network Access"
# 2. 點擊 "Add IP Address"
# 3. 選擇 "Allow access from anywhere" (0.0.0.0/0)
# 或指定特定 IP：點擊 "Add Current IP Address"
```

#### 建立資料庫使用者
```bash
# 1. 點擊 "Database Access"
# 2. 點擊 "Add New Database User"
# 3. 選擇 "Password" 驗證方式
# 4. 使用者名稱：william9150
# 5. 密碼：oSkSwo2T5kcS7wP2 (已設定)
# 6. 權限：Atlas admin 或 Read and write to any database
```

### 2. 資料庫結構初始化

#### 連接字串
```env
MONGODB_URI=mongodb+srv://william9150:oSkSwo2T5kcS7wP2@storyadv.rmsw61p.mongodb.net/?retryWrites=true&w=majority&appName=StoryAdv
```

#### 初始化腳本

建立資料庫和集合：

```javascript
// 連接到 MongoDB
use storyadventurebot;

// 建立 stories 集合並設定索引
db.createCollection("stories");
db.stories.createIndex({ "storyId": 1 }, { unique: true });
db.stories.createIndex({ "chatId": 1, "status": 1 });
db.stories.createIndex({ "createdAt": -1 });

// 建立 rounds 集合並設定索引
db.createCollection("rounds");
db.rounds.createIndex({ "story": 1, "roundNumber": 1 });
db.rounds.createIndex({ "story": 1 });
db.rounds.createIndex({ "createdAt": -1 });

// 建立 apicostlogs 集合並設定索引
db.createCollection("apicostlogs");
db.apicostlogs.createIndex({ "storyId": 1 });
db.apicostlogs.createIndex({ "createdAt": -1 });

// 顯示所有集合
show collections;

// 驗證索引建立
db.stories.getIndexes();
db.rounds.getIndexes();
db.apicostlogs.getIndexes();
```

### 3. 使用 Node.js 初始化

建立初始化腳本：

```typescript
// scripts/init-database.ts
import mongoose from 'mongoose';
import { Story, Round, ApiCostLog } from '../src/models';

async function initializeDatabase() {
  try {
    // 連接資料庫
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // 建立索引
    await Story.createIndexes();
    await Round.createIndexes();
    await ApiCostLog.createIndexes();
    
    console.log('Database indexes created successfully');

    // 驗證連接
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // 插入測試資料（可選）
    await insertTestData();

    await mongoose.disconnect();
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

async function insertTestData() {
  // 檢查是否已有資料
  const existingStories = await Story.countDocuments();
  if (existingStories > 0) {
    console.log('Test data already exists, skipping...');
    return;
  }

  // 插入測試故事資料
  const testStory = new Story({
    storyId: 'test-story-001',
    chatId: 'test-chat-001',
    theme: '測試故事：在神秘森林中的冒險',
    characters: new Map([
      ['測試角色1', 'user001'],
      ['測試角色2', 'user002']
    ]),
    totalRounds: 10,
    currentRound: 0,
    status: 'in_progress',
    genre: '奇幻',
    playMode: 'consensus'
  });

  await testStory.save();
  console.log('Test story created:', testStory.storyId);
}

// 執行初始化
initializeDatabase();
```

### 4. 資料庫腳本

#### 執行初始化
```bash
# 安裝 ts-node（如果尚未安裝）
npm install -g ts-node

# 執行初始化腳本
ts-node scripts/init-database.ts
```

#### 資料庫清理腳本
```typescript
// scripts/cleanup-database.ts
import mongoose from 'mongoose';
import { Story, Round, ApiCostLog } from '../src/models';

async function cleanupDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    
    // 刪除已完成超過 30 天的故事
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const expiredStories = await Story.find({
      status: 'completed',
      updatedAt: { $lt: thirtyDaysAgo }
    });
    
    for (const story of expiredStories) {
      // 刪除相關的回合
      await Round.deleteMany({ story: story._id });
      // 刪除故事
      await Story.deleteOne({ _id: story._id });
      console.log(`Cleaned up story: ${story.storyId}`);
    }
    
    // 清理舊的 API 成本日誌（保留 90 天）
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const deletedLogs = await ApiCostLog.deleteMany({
      createdAt: { $lt: ninetyDaysAgo }
    });
    
    console.log(`Cleaned up ${deletedLogs.deletedCount} API cost logs`);
    
    await mongoose.disconnect();
    console.log('Database cleanup completed');
  } catch (error) {
    console.error('Database cleanup failed:', error);
  }
}

cleanupDatabase();
```

### 5. 備份與還原

#### 備份資料庫
```bash
# 使用 mongodump 備份
mongodump --uri="mongodb+srv://william9150:oSkSwo2T5kcS7wP2@storyadv.rmsw61p.mongodb.net/storyadventurebot" --out=./backup

# 或使用 MongoDB Compass 匯出
# 1. 開啟 MongoDB Compass
# 2. 連接到資料庫
# 3. 選擇集合 > Export Collection
```

#### 還原資料庫
```bash
# 使用 mongorestore 還原
mongorestore --uri="mongodb+srv://william9150:oSkSwo2T5kcS7wP2@storyadv.rmsw61p.mongodb.net/storyadventurebot" ./backup/storyadventurebot
```

### 6. 監控與維護

#### 效能監控查詢
```javascript
// 檢查資料庫狀態
db.runCommand({ serverStatus: 1 });

// 檢查集合統計
db.stories.stats();
db.rounds.stats();
db.apicostlogs.stats();

// 檢查索引使用情況
db.stories.aggregate([{ $indexStats: {} }]);

// 查詢慢查詢
db.setProfilingLevel(2, { slowms: 100 });
db.system.profile.find().sort({ ts: -1 }).limit(5);
```

#### 資料清理維護
```javascript
// 查詢統計資訊
db.stories.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 }
    }
  }
]);

// 查詢活躍故事
db.stories.find({ status: "in_progress" }).count();

// 查詢今日新建故事
db.stories.find({
  createdAt: {
    $gte: new Date(new Date().setHours(0, 0, 0, 0))
  }
}).count();
```

### 7. 故障排除

#### 常見問題

**連接失敗**
```bash
# 檢查網路存取設定
# 確認 IP 地址已加入白名單
# 驗證使用者帳號密碼正確
```

**索引問題**
```javascript
// 重建索引
db.stories.dropIndexes();
db.stories.createIndex({ "storyId": 1 }, { unique: true });
```

**效能問題**
```javascript
// 分析查詢效能
db.stories.find({ chatId: "test" }).explain("executionStats");
```

## 環境變數設定

```env
# 生產環境
MONGODB_URI=mongodb+srv://william9150:oSkSwo2T5kcS7wP2@storyadv.rmsw61p.mongodb.net/storyadventurebot?retryWrites=true&w=majority&appName=StoryAdv

# 開發環境（可選）
MONGODB_URI_DEV=mongodb+srv://william9150:oSkSwo2T5kcS7wP2@storyadv.rmsw61p.mongodb.net/storyadventurebot-dev?retryWrites=true&w=majority&appName=StoryAdv

# 測試環境（可選）
MONGODB_URI_TEST=mongodb+srv://william9150:oSkSwo2T5kcS7wP2@storyadv.rmsw61p.mongodb.net/storyadventurebot-test?retryWrites=true&w=majority&appName=StoryAdv
```

---

**注意事項：**
- 生產環境密碼已設定，請妥善保管
- 建議定期備份重要資料
- 監控資料庫使用量，避免超出免費額度
- 考慮設定自動清理舊資料的排程作業