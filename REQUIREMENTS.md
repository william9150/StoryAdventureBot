# StoryAdventureBot 功能需求規格書

## 1. 功能需求

### 1.1 故事創建流程

#### 1.1.1 啟動流程
- **觸發指令**：`/開始說書`
- **適用範圍**：個人聊天室、群組聊天室

#### 1.1.2 模式選擇
- **群組聊天室**：
  - 顯示 Quick Reply 按鈕：`[A] 共識模式 (預設)`, `[B] 角色扮演模式`
  - 使用者點擊選擇遊玩模式
- **個人聊天室**：
  - 自動設定為「共識模式」
  - 跳過模式選擇，直接進入劇情主軸設定

#### 1.1.3 劇情主軸設定
- 機器人提示使用者輸入故事背景與主軸
- 使用者可自由輸入文字描述
- 系統儲存使用者輸入作為故事主軸

#### 1.1.4 角色設定與指派
- **角色輸入**：使用者輸入角色名稱，以逗號分隔（例：`傑克, 艾拉, 神秘的老人`）
- **角色扮演模式指派流程**：
  1. 機器人：「好的，第一個角色是 **傑克**。請 @ 一位玩家來扮演他。」
  2. 使用者 @ 某位玩家
  3. 機器人驗證成功：「好的，**傑克** 由 @玩家A 扮演。下一個角色是 **艾拉**。請 @ 一位玩家來扮演他。」
  4. 重複直到所有角色被指派
  5. 系統記錄角色與 LINE userId 的對應關係

#### 1.1.5 故事風格設定
- 提供 Quick Reply 按鈕選項：`[恐怖]`, `[懸疑]`, `[愛情]`, `[喜劇]`, `[奇幻]`, `[科幻]`, `[寫實]`
- 使用者選擇一個風格

#### 1.1.6 故事長度設定
- 機器人提示：「請設定故事的回合數 (5-100)。」
- **驗證規則**：
  - 必須為 5-100 之間的整數
  - 無效輸入時提示錯誤並要求重新輸入
  - 預設值：50

#### 1.1.7 設定確認與開始
- 機器人總結所有設定（模式、風格、角色指派等）
- 生成隨機且不易猜測的 **Story ID**
- 發布故事的第一個段落

### 1.2 故事互動流程

#### 1.2.1 故事段落生成
- 系統透過 OpenAI API 產生故事段落
- 每個段落包含：
  - 故事內容（約150-200字）
  - 3個行動選項

#### 1.2.2 使用者選擇機制

##### 共識模式
- 聊天室中任何人皆可點擊 Quick Reply 選項
- 第一個被點擊的選項決定故事走向
- 點擊生效後，機器人編輯原訊息：
  - 移除選擇按鈕
  - 顯示：「`@[選擇者名稱]` 選擇了：`[選項內容]`」

##### 角色扮演模式
- **AI 建議輪替機制**：
  - AI 根據劇情發展決定下一回合行動角色
  - 目標：最大化故事戲劇性與連貫性
- **權限控制**：
  - 機器人明確 `@mention` 該回合的指定玩家
  - 驗證點擊者的 userId 是否為指定玩家
  - 非指定玩家點擊時回應：「現在是 `@[當前回合玩家]` 的回合。」

#### 1.2.3 故事推進
- 根據玩家選擇生成下一回合內容
- 更新資料庫記錄
- 判斷是否達到結局條件

### 1.3 故事完結與重設

#### 1.3.1 故事結局
- 達到設定的最終回合時觸發
- 生成故事結局
- 更新資料庫狀態為 `completed`
- 提示使用者可輸入 `/開始說書` 創造新故事

#### 1.3.2 強制重設
- **觸發指令**：`/重設故事`
- **確認流程**：
  1. 發送 Quick Reply 確認按鈕：「確定要重設目前正在進行的故事嗎？所有進度將會遺失。」
  2. 選項：`[是, 我確定]` / `[否, 取消]`
  3. 確認後更新資料庫狀態為 `cancelled`
  4. 回應故事已重設

### 1.4 故事儲存與讀取

#### 1.4.1 自動儲存
- 每個回合發生後自動儲存至後端資料庫
- 包含故事內容、選項、玩家選擇等完整記錄

#### 1.4.2 故事讀取與分享
- **指令**：`/讀取故事 [故事ID]`
- **功能**：
  - 在任何加入此機器人的聊天室中皆可使用
  - 顯示指定故事的完整記錄
  - Story ID 為隨機、無序、不易猜測的字串
  - 保障故事基礎隱私性

## 2. 技術需求

### 2.1 系統架構

#### 2.1.1 部署平台
- **Zeabur**：
  - 原生支援 Node.js
  - 便捷環境變數管理
  - GitHub Repo 連接實現 CI/CD

#### 2.1.2 後端技術棧
- **Node.js + TypeScript**：確保程式碼健壯性
- **Express.js 或 Fastify**：Web 伺服器框架
- **MongoDB Atlas**：雲端資料庫（M0 免費叢集）

#### 2.1.3 核心函式庫
- `@line/bot-sdk`：LINE 官方 SDK
- `openai`：OpenAI 官方 SDK  
- `mongoose`：MongoDB 物件模型工具
- `dotenv`：環境變數管理

### 2.2 API 端點設計

#### 2.2.1 Webhook 端點
- **路徑**：`POST /webhook`
- **功能**：接收所有 LINE Platform Webhook 事件
- **處理流程**：
  1. 驗證請求來源（使用 Channel Secret）
  2. 解析 Webhook 事件陣列
  3. 根據事件類型調用對應服務邏輯
  4. 與 OpenAI、MongoDB 互動
  5. 組裝回應訊息並透過 LINE SDK 回傳

### 2.3 資料庫模型設計

#### 2.3.1 Story Schema
```typescript
const storySchema = new Schema({
  storyId: { type: String, required: true, unique: true, index: true },
  chatId: { type: String, required: true, index: true },
  theme: { type: String, required: true },
  characters: { type: Map, of: String }, // { "傑克": "U123...", "艾拉": "U456..." }
  totalRounds: { type: Number, default: 50 },
  status: { type: String, enum: ['in_progress', 'completed', 'cancelled'], default: 'in_progress' },
  genre: { type: String, required: true },
  playMode: { type: String, enum: ['consensus', 'role_playing'], required: true },
}, { timestamps: true });
```

#### 2.3.2 Round Schema
```typescript
const roundSchema = new Schema({
  story: { type: Schema.Types.ObjectId, ref: 'Story', required: true, index: true },
  roundNumber: { type: Number, required: true },
  storyContent: { type: String, required: true },
  options: [{ type: String }],
  userChoice: { type: String },
  chosenBy: { type: String }, // LINE User ID
}, { timestamps: true });
```

#### 2.3.3 API Cost Log Schema
```typescript
const apiCostLogSchema = new Schema({
  // 成本追蹤相關欄位
}, { timestamps: true });
```

### 2.4 環境變數配置

```env
# LINE Bot
LINE_CHANNEL_ACCESS_TOKEN=...
LINE_CHANNEL_SECRET=...

# OpenAI
OPENAI_API_KEY=...

# Database
MONGODB_URI=mongodb+srv://...

# Application
PORT=8080
```

### 2.5 Prompt Engineering

#### 2.5.1 結構化 Prompt 範本
```
# Identity & Goal
You are a master storyteller and an expert Dungeon Master for an interactive fiction game. Your primary goal is to create a dramatic and coherent narrative. Your secondary goal is to ensure all players feel engaged by trying to involve different characters over time.

# Style Guide
The story's genre is {genre}. Your tone, vocabulary, and plot developments must reflect this style.

# Story Context
- Core Premise: {theme}
- Player Characters: {characters_list}
- Story So Far (last 2-3 rounds): {recent_story_history}
- Player's Last Action (taken by {previous_character_name}): {user_choice}

# Your Task
1. Based on all the above information, decide which character is in the best position to act next to move the story forward in the most compelling way.
2. Write a captivating story segment (approx. 150-200 words) focusing on this character's perspective or situation.
3. Conclude by presenting exactly 3 distinct, actionable choices for that character.
4. Output your response strictly in the following JSON format. Do not include any text outside of the JSON structure.

{
  "story_text": "The narrative continues here...",
  "options": ["Actionable Choice 1", "Actionable Choice 2", "Actionable Choice 3"],
  "next_character_name": "The name of the character you decided should act next (must be one from the character list)"
}
```

## 3. 非功能性需求

### 3.1 效能需求
- **回應時間**：從接收使用者選擇到發出下一回合故事應控制在 10 秒以內
- **併發處理**：支援多個故事同時進行，互不影響

### 3.2 可用性需求
- **穩定性**：系統應保持穩定運行
- **錯誤隔離**：單一故事錯誤不應影響其他正在進行的故事

### 3.3 成本控制
- 監控 Zeabur 與 MongoDB Atlas 用量
- 確保維持在免費額度內或符合預算
- 追蹤 OpenAI API 使用成本

### 3.4 日誌與監控
- **結構化日誌**：便於追蹤錯誤與除錯
- **監控指標**：利用 Zeabur 平台日誌功能
- **錯誤追蹤**：完善的錯誤處理機制

### 3.5 錯誤處理
- OpenAI API 通訊失敗時的優雅降級
- LINE API 通訊失敗時的重試機制
- 資料庫連線失敗時的錯誤回報
- 避免系統崩潰，向使用者回報友善的錯誤訊息

### 3.6 安全性需求
- **API 金鑰保護**：透過環境變數管理敏感資訊
- **請求驗證**：驗證 LINE Webhook 請求的合法性
- **資料隱私**：Story ID 採用隨機生成，保護故事隱私

## 4. 使用者介面需求

### 4.1 LINE 訊息介面
- **Quick Reply 按鈕**：提供直覺的選擇介面
- **訊息格式化**：使用 Markdown 格式美化訊息顯示
- **互動反饋**：及時回應使用者操作

### 4.2 訊息內容規範
- **故事段落**：150-200 字左右，保持適當長度
- **選項描述**：簡潔明確，具有行動性
- **系統訊息**：友善且資訊豐富的提示文字

## 5. 驗收標準

### 5.1 功能驗收
- [ ] 能正確處理故事創建的完整流程
- [ ] 共識模式與角色扮演模式運作正常
- [ ] AI 能生成連貫且符合風格的故事內容
- [ ] 故事儲存與讀取功能正常
- [ ] 錯誤處理機制有效運作

### 5.2 效能驗收
- [ ] 回應時間符合 10 秒內的要求
- [ ] 系統能穩定處理多個並發故事
- [ ] 資料庫操作效能良好

### 5.3 整合驗收
- [ ] LINE Bot 與 Webhook 整合正常
- [ ] OpenAI API 整合穩定
- [ ] MongoDB 資料儲存正確
- [ ] Zeabur 部署與 CI/CD 流程順暢