# 多階段建置 - 建置階段
FROM node:18-alpine AS builder

# 設定工作目錄
WORKDIR /app

# 複製 package 檔案
COPY package*.json ./

# 安裝所有依賴（包含 devDependencies）
RUN npm ci

# 複製源碼
COPY . .

# 建置應用程式
RUN npm run build

# 生產階段
FROM node:18-alpine AS production

# 設定工作目錄
WORKDIR /app

# 複製 package 檔案
COPY package*.json ./

# 僅安裝生產依賴
RUN npm ci --only=production && npm cache clean --force

# 從建置階段複製編譯後的檔案
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 8080

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# 啟動應用程式
CMD ["npm", "start"]