# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StoryAdventureBot is a LINE chatbot that creates interactive storytelling experiences. The bot generates dynamic stories based on user-defined themes, characters, genres, and play modes (consensus vs role-playing).

## Architecture

This is a Node.js/TypeScript project designed to be deployed on Zeabur platform with the following tech stack:

- **Backend Framework**: Node.js with TypeScript, using Express.js or Fastify
- **Database**: MongoDB (MongoDB Atlas recommended)
- **Key Dependencies**:
  - `@line/bot-sdk`: LINE Bot SDK for webhook handling and messaging
  - `openai`: OpenAI SDK for GPT-based story generation
  - `mongoose`: MongoDB ODM for database operations
  - `dotenv`: Environment variable management

## Key Components

### Database Models
- **Story Schema** (`story.model.ts`): Stores story metadata including storyId, chatId, theme, characters mapping, rounds, status, genre, and playMode
- **Round Schema** (`round.model.ts`): Stores individual story rounds with content, options, user choices, and player assignments
- **API Cost Log Schema** (`apiCostLog.model.ts`): Tracks OpenAI API usage costs

### Core Features
1. **Story Setup Flow**: Theme setting, character assignment, genre selection, round count configuration
2. **Interactive Gameplay**: 
   - Consensus mode: Any user can choose story options
   - Role-playing mode: AI-driven character turn system with player assignments
3. **Story Management**: Save/load stories via Story IDs, reset functionality
4. **AI Integration**: Structured prompts for consistent story generation with JSON output format

## Environment Variables

Required environment variables:
```
LINE_CHANNEL_ACCESS_TOKEN=...
LINE_CHANNEL_SECRET=...
OPENAI_API_KEY=...
MONGODB_URI=mongodb+srv://...
PORT=8080
```

## API Endpoints

- `POST /webhook`: Main endpoint for LINE webhook events, handles all user interactions and story flow

## Development Notes

- No build configuration files exist yet (package.json, tsconfig.json, etc.)
- Project uses structured prompts for OpenAI integration to ensure consistent JSON responses
- Implements LINE Quick Reply buttons for user interactions
- Supports both individual and group chat modes
- Stories are identified by randomly generated, non-guessable Story IDs for privacy

## Prompt Engineering

The project uses structured prompts for OpenAI that include:
- Identity and goal definition for the AI storyteller
- Genre-specific style guidelines
- Story context with character lists and history
- Required JSON output format with story_text, options, and next_character_name fields

This is an early-stage project focused on creating an engaging interactive storytelling experience through LINE messaging platform.

# Bash 指令
- npm run build：建置專案
- npm run typecheck：執行型別檢查

# 程式碼風格
- 使用 ES 模組（import/export）語法，而非 CommonJS（require）
- 盡可能解構匯入（例如：import { foo } from 'bar'）

# 工作流程
- 當您完成一系列程式碼變更後，請務必進行型別檢查
- 為求效能，請優先執行單一測試，而非整個測試套件

# Git 工作流程
- 保持git的好習慣，隨時git commit
- 依據開發階段與功能，創建相對應的git branch
- 已經穩定的程式碼要合併到main branch
- 隨時將進度push到github