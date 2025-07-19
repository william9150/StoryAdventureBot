# StoryAdventureBot

一個運行於 LINE 平台的智慧說書機器人，能根據使用者設定動態生成互動式故事。

## 專案概述

StoryAdventureBot 是一個創新的互動式說書機器人，透過 OpenAI 的 GPT 模型，為使用者創造個人化的故事冒險體驗。使用者可以設定故事主軸、角色、風格和遊玩模式，機器人會即時生成引人入勝的故事內容與互動選項。

## 主要功能

- **多模式遊玩**：支援共識模式（個人或群組皆可參與）和角色扮演模式（群組專用）
- **智慧故事生成**：基於 OpenAI GPT 的動態故事創作
- **角色輪替機制**：AI 智慧建議下一回合行動角色，確保故事戲劇性
- **風格多樣化**：支援恐怖、懸疑、愛情、喜劇、奇幻、科幻、寫實等風格
- **故事儲存與分享**：自動儲存故事進度，可透過 Story ID 分享完整故事記錄
- **靈活回合設定**：可自訂故事回合數（5-100回）

## 技術架構

### 部署平台
- **Zeabur**：利用 CI/CD 自動部署，支援環境變數管理

### 後端技術
- **Node.js + TypeScript**：確保程式碼健壯性與可維護性
- **Express.js/Fastify**：高效能 Web 伺服器框架
- **MongoDB Atlas**：雲端資料庫服務（M0 免費叢集）

### 核心依賴
- `@line/bot-sdk`：LINE 官方 SDK
- `openai`：OpenAI 官方 SDK
- `mongoose`：MongoDB 物件模型工具
- `dotenv`：環境變數管理

## 快速開始

### 環境需求
- Node.js 16+
- MongoDB Atlas 帳號
- LINE Developers 帳號
- OpenAI API 帳號

### 安裝步驟
1. 複製專案
```bash
git clone <repository-url>
cd StoryAdventureBot
```

2. 安裝依賴
```bash
npm install
```

3. 設定環境變數
```bash
cp .env.example .env
# 編輯 .env 檔案，填入必要的 API 金鑰和設定
```

4. 啟動開發服務器
```bash
npm run dev
```

### 環境變數配置
```env
# LINE Bot
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Database
MONGODB_URI=mongodb+srv://your_mongodb_connection_string

# Application
PORT=8080
```

## 使用指南

### 基本指令
- `/開始說書`：啟動新的故事創作流程
- `/重設故事`：重設當前進行中的故事
- `/讀取故事 [故事ID]`：讀取指定故事的完整記錄

### 遊玩模式
1. **共識模式**：所有參與者皆可選擇行動選項，先選先贏
2. **角色扮演模式**：由 AI 決定角色輪替順序，對應玩家才能選擇行動

## 部署

本專案設計為可直接部署至 Zeabur 平台：

1. 將程式碼推送至 GitHub
2. 連接 Zeabur 服務
3. 設定環境變數
4. 自動部署完成

## 開發規範

- 使用 TypeScript 進行型別檢查
- 遵循 ESLint 程式碼規範
- 實作完善的錯誤處理機制
- 結構化日誌輸出

## 授權

本專案採用 MIT 授權條款。

## 貢獻

歡迎提交 Issue 和 Pull Request 來改善此專案。

## 支援

如有任何問題，請透過 GitHub Issues 回報。