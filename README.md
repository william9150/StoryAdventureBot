# StoryAdventureBot

一個基於 LINE 平台的互動式故事機器人，使用 OpenAI GPT-4 生成動態故事內容。

## 功能特色

### 🎮 雙模式遊戲體驗
- **共識模式**: 群組中任何人都可以選擇故事走向
- **角色扮演模式**: AI 智能分配角色輪替，增強代入感

### 📚 智能故事生成
- 支援多種故事風格：恐怖、懸疑、愛情、喜劇、奇幻、科幻、寫實
- AI 根據劇情發展智能選擇下一位行動角色
- 結構化 Prompt 確保故事連貫性和戲劇性

### 🔧 完整管理功能
- 故事自動儲存與進度追踪
- Story ID 分享機制，可在任何聊天室讀取故事
- 重設功能，隨時開始新冒險
- API 使用成本監控

## 快速開始

### 環境需求
- Node.js 18+
- MongoDB
- LINE Developer Account
- OpenAI API Key

### 安裝與設定

1. **複製專案**
```bash
git clone https://github.com/your-username/StoryAdventureBot.git
cd StoryAdventureBot
```

2. **安裝依賴**
```bash
npm install
```

3. **環境變數設定**
```bash
cp .env.example .env
# 編輯 .env 檔案，填入必要的 API 金鑰
```

4. **建置專案**
```bash
npm run build
```

5. **啟動服務**
```bash
npm start
```

### 環境變數說明

```env
# LINE Bot 設定
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# OpenAI 設定
OPENAI_API_KEY=your_openai_api_key

# 資料庫設定
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# 應用程式設定
PORT=8080
NODE_ENV=production
```

## 使用說明

### 基本指令

- `/開始說書` - 開始創建新故事
- `/重設故事` - 重設當前進行中的故事
- `/讀取故事 [Story ID]` - 讀取指定故事內容

### 故事創建流程

1. **模式選擇** (僅群組聊天)
   - 選擇共識模式或角色扮演模式

2. **設定故事主軸**
   - 輸入故事背景與核心劇情

3. **角色設定**
   - 輸入角色名稱 (逗號分隔)
   - 角色扮演模式需指派真實玩家

4. **風格選擇**
   - 選擇故事的整體風格與氛圍

5. **設定長度**
   - 選擇故事回合數 (5-100 回合)

6. **確認開始**
   - 確認所有設定，AI 開始生成第一個故事段落

## 部署

### Zeabur 部署 (推薦)

1. 連接 GitHub 儲存庫到 Zeabur
2. 設定環境變數
3. 自動建置與部署

### Docker 部署

```bash
# 建置映像
docker build -t story-adventure-bot .

# 執行容器
docker run -p 8080:8080 --env-file .env story-adventure-bot
```

## 技術架構

### 後端技術
- **Node.js + TypeScript**: 核心開發語言
- **Express.js**: Web 框架
- **MongoDB + Mongoose**: 資料庫與 ODM
- **LINE Bot SDK**: LINE 平台整合
- **OpenAI SDK**: AI 故事生成

### 資料模型
- **Story**: 故事基本資訊與設定
- **Round**: 每回合的故事內容與選擇
- **ApiCostLog**: API 使用成本追踪

### 核心服務
- **Story Creation Service**: 故事創建流程管理
- **Story Interaction Service**: 故事互動與推進
- **OpenAI Service**: AI 故事生成與 Prompt 管理
- **Story Load Service**: 故事讀取與分享

## 開發

### 開發指令

```bash
# 開發模式啟動
npm run dev

# 型別檢查
npm run typecheck

# 程式碼檢查
npm run lint

# 建置專案
npm run build

# 執行測試
npm test
```

### 專案結構

```
src/
├── config/          # 配置檔案 (資料庫、LINE、OpenAI)
├── models/          # 資料庫模型定義
├── services/        # 業務邏輯服務
├── routes/          # API 路由定義
├── utils/           # 工具函數
├── types/           # TypeScript 型別定義
├── app.ts           # Express 應用程式設定
└── server.ts        # 伺服器啟動檔案
```

## API 文件

### Webhook 端點
- `POST /webhook` - LINE Platform Webhook 接收端點

### 健康檢查
- `GET /health` - 系統健康狀態檢查

## 貢獻指南

1. Fork 此專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權

此專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

## 聯絡方式

如有問題或建議，歡迎開啟 Issue 或聯絡開發團隊。

---

**享受你的互動故事冒險之旅！** 🎭📚✨