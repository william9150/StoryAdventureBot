# StoryAdventureBot 文件目錄

## 文件清單

### 📋 專案文件
- [專案總覽](../README.md) - 專案介紹與快速開始
- [需求規格](../REQUIREMENTS.md) - 詳細功能需求與技術規格
- [開發指南](../CLAUDE.md) - 開發環境設定與程式碼風格

### 🗄️ 資料庫設定
- [資料庫設定指南](./database-setup.md) - MongoDB 初始化與管理

### 🚀 部署文件
- [部署腳本](../scripts/) - 自動化部署與健康檢查腳本
- [Docker 配置](../Dockerfile) - 容器化部署設定
- [Zeabur 配置](../zeabur.json) - Zeabur 平台部署設定

### 🔧 開發工具
- [TypeScript 配置](../tsconfig.json) - TypeScript 編譯設定
- [ESLint 配置](../.eslintrc.js) - 程式碼檢查規則
- [Jest 配置](../jest.config.js) - 測試框架設定

### 📊 CI/CD
- [GitHub Actions](.github/workflows/ci.yml) - 持續整合管道

## 快速導航

### 🚀 快速開始
1. [環境設定](../README.md#環境需求)
2. [資料庫初始化](./database-setup.md#資料庫初始化)
3. [專案啟動](../README.md#安裝與設定)

### 🔧 開發相關
1. [程式碼結構](../README.md#專案結構)
2. [開發指令](../README.md#開發指令)
3. [Git 工作流程](../.claude/guidelines.md)

### 🚀 部署相關
1. [部署指南](../README.md#部署)
2. [環境變數設定](./database-setup.md#環境變數設定)
3. [健康檢查](../scripts/health-check.sh)

### 🗄️ 資料庫管理
1. [初始化資料庫](./database-setup.md#使用-nodejs-初始化)
2. [資料清理](./database-setup.md#資料庫腳本)
3. [備份還原](./database-setup.md#備份與還原)

## 常用指令

### 開發指令
```bash
npm run dev          # 開發模式啟動
npm run build        # 建置專案
npm run typecheck    # 型別檢查
npm run lint         # 程式碼檢查
npm test             # 執行測試
```

### 資料庫指令
```bash
npm run db:init      # 初始化資料庫
npm run db:cleanup   # 清理舊資料
npm run db:report    # 生成資料庫報告
```

### 部署指令
```bash
npm run deploy       # 自動化部署
npm run health-check # 健康檢查
npm start           # 生產環境啟動
```

## 貢獻指南

1. 閱讀 [開發指南](../CLAUDE.md)
2. 遵循 [Git 工作流程](../.claude/guidelines.md)
3. 確保通過所有檢查 (`npm run typecheck && npm run lint && npm test`)
4. 提交 Pull Request

## 支援

如有問題請參考：
1. [故障排除](./database-setup.md#故障排除)
2. [GitHub Issues](https://github.com/william9150/StoryAdventureBot/issues)
3. [開發團隊聯絡方式](../README.md#聯絡方式)