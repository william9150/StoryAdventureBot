# StoryAdventureBot 部署指南

## 🚀 完整部署流程

### 1. 前置準備

#### 必要帳號
- [MongoDB Atlas](https://cloud.mongodb.com) - 免費資料庫服務
- [LINE Developers](https://developers.line.biz) - LINE Bot 開發
- [OpenAI](https://openai.com/api/) - AI 服務
- [Zeabur](https://zeabur.com) 或 [Vercel](https://vercel.com) - 部署平台

#### 環境需求
- Node.js 18+
- npm 或 yarn
- Git

### 2. 資料庫設定

#### MongoDB Atlas 設定
```bash
# 1. 建立 MongoDB Atlas 帳號
# 2. 建立新專案: StoryAdventureBot
# 3. 建立免費 M0 叢集 (選擇最近的區域)
# 4. 設定網路存取: Allow access from anywhere (0.0.0.0/0)
# 5. 建立資料庫使用者並記住帳密
```

#### 取得連接字串
```env
# 格式: mongodb+srv://username:password@cluster.mongodb.net/database?params
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/storyadventurebot?retryWrites=true&w=majority
```

### 3. LINE Bot 設定

#### 建立 LINE Bot
```bash
# 1. 前往 LINE Developers Console
# 2. 建立新的 Provider (提供者)
# 3. 建立新的 Messaging API Channel
# 4. 取得 Channel Access Token 和 Channel Secret
```

#### Webhook 設定
```bash
# 部署完成後設定 Webhook URL:
# https://your-app-domain.com/webhook
```

### 4. OpenAI API 設定

#### 取得 API Key
```bash
# 1. 前往 OpenAI API Dashboard
# 2. 建立新的 API Key
# 3. 設定使用限制和預算 (建議設定月預算上限)
```

### 5. 本地開發設定

#### 專案設定
```bash
# 複製專案
git clone https://github.com/william9150/StoryAdventureBot.git
cd StoryAdventureBot

# 安裝依賴
npm install

# 複製環境變數檔案
cp .env.example .env
```

#### 環境變數設定
```env
# .env 檔案內容
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret
OPENAI_API_KEY=your_openai_api_key
MONGODB_URI=your_mongodb_connection_string
PORT=8080
NODE_ENV=development
```

#### 初始化資料庫
```bash
# 建立資料庫索引和測試資料
npm run db:init
```

#### 本地測試
```bash
# 開發模式啟動
npm run dev

# 檢查健康狀態
curl http://localhost:8080/health
```

### 6. Zeabur 部署

#### 自動部署 (推薦)
```bash
# 1. 推送程式碼到 GitHub
git push origin main

# 2. 前往 Zeabur Dashboard
# 3. 選擇 Import from GitHub
# 4. 選擇 StoryAdventureBot 儲存庫
# 5. Zeabur 會自動檢測並建置專案
```

#### 環境變數設定
```bash
# 在 Zeabur Dashboard 中設定以下環境變數:
LINE_CHANNEL_ACCESS_TOKEN=your_actual_token
LINE_CHANNEL_SECRET=your_actual_secret
OPENAI_API_KEY=your_actual_api_key
MONGODB_URI=your_actual_mongodb_uri
NODE_ENV=production
```

#### 網域設定
```bash
# 1. 在 Zeabur 中分配網域
# 2. 記錄網域名稱 (例如: your-app.zeabur.app)
# 3. 在 LINE Developer Console 設定 Webhook URL:
#    https://your-app.zeabur.app/webhook
```

### 7. Docker 部署

#### 建立 Docker 映像
```bash
# 本地建置
docker build -t story-adventure-bot .

# 執行容器
docker run -p 8080:8080 --env-file .env story-adventure-bot
```

#### Docker Compose (可選)
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - LINE_CHANNEL_ACCESS_TOKEN=${LINE_CHANNEL_ACCESS_TOKEN}
      - LINE_CHANNEL_SECRET=${LINE_CHANNEL_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MONGODB_URI=${MONGODB_URI}
      - NODE_ENV=production
    restart: unless-stopped
```

### 8. 部署後檢查

#### 健康檢查
```bash
# 檢查服務狀態
curl https://your-app-domain.com/health

# 預期回應:
{
  "service": "StoryAdventureBot",
  "status": "healthy",
  "checks": {
    "database": true,
    "models": true,
    "environment": true
  }
}
```

#### LINE Bot 測試
```bash
# 1. 加入 LINE Bot 為好友
# 2. 發送 "/開始說書" 測試
# 3. 檢查是否正常回應
```

#### 資料庫驗證
```bash
# 檢查資料庫連接
npm run db:report

# 預期看到資料庫統計資訊
```

### 9. 監控與維護

#### 日誌監控
```bash
# Zeabur 日誌
# 1. 前往 Zeabur Dashboard
# 2. 選擇專案 > 查看 Logs
# 3. 監控錯誤和效能指標
```

#### 資料庫維護
```bash
# 定期清理舊資料 (建議設定 cron job)
npm run db:cleanup

# 查看資料庫使用報告
npm run db:report
```

#### 效能監控
```bash
# 監控 API 使用量
# 檢查 OpenAI API 用量
# 監控 MongoDB Atlas 用量
# 設定用量警報
```

### 10. 故障排除

#### 常見問題

**部署失敗**
```bash
# 檢查建置日誌
# 確認所有環境變數設定正確
# 檢查 package.json 和 tsconfig.json
```

**LINE Bot 無回應**
```bash
# 檢查 Webhook URL 設定
# 確認 LINE Token 和 Secret 正確
# 檢查服務器日誌
```

**資料庫連接失敗**
```bash
# 檢查 MongoDB URI 格式
# 確認網路存取設定
# 檢查使用者權限
```

**OpenAI API 錯誤**
```bash
# 檢查 API Key 有效性
# 確認帳戶餘額充足
# 檢查請求頻率限制
```

#### 效能優化
```bash
# 1. 設定 MongoDB 連接池
# 2. 實作請求快取
# 3. 優化 OpenAI prompt
# 4. 設定 CDN (如需要)
```

### 11. 安全考量

#### 環境變數安全
```bash
# 不要將 .env 檔案提交到 Git
# 使用平台環境變數管理
# 定期輪換 API Keys
```

#### 網路安全
```bash
# 啟用 HTTPS (Zeabur 預設支援)
# 設定 Rate Limiting (已實作)
# 監控異常請求
```

#### 資料安全
```bash
# 定期備份資料庫
# 設定存取權限
# 監控資料使用量
```

---

## 快速部署檢查清單

- [ ] MongoDB Atlas 叢集建立並取得連接字串
- [ ] LINE Bot 建立並取得 Token 和 Secret
- [ ] OpenAI API Key 取得並設定預算
- [ ] 程式碼推送到 GitHub
- [ ] Zeabur 專案建立並連接 GitHub
- [ ] 環境變數在 Zeabur 中設定完成
- [ ] 資料庫初始化執行成功
- [ ] Webhook URL 在 LINE Console 設定
- [ ] 健康檢查通過
- [ ] LINE Bot 功能測試通過

部署完成後，您的 StoryAdventureBot 就可以為用戶提供精彩的互動式故事體驗了！🎉