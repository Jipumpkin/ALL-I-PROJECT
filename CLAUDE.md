# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ALL-I-PROJECT is a full-stack web application for an animal adoption platform with AI-generated imagery capabilities. The system allows users to find adoptable animals, interact with AI for generating related content, and manage user accounts.

## Architecture

**Frontend (client/):**
- React 19 + Vite setup with React Router DOM for SPA routing
- Component-based architecture with Header/Footer layout
- Key pages: Main, Login, Register, Account Management, Password Recovery
- Axios configured for API communication with backend (localhost:3000)
- Vite proxy configuration for external API (apis.data.go.kr)

**Backend (server/):**
- Node.js + Express server
- MySQL database with comprehensive schema for users, animals, shelters, images, and AI interactions
- CORS and body-parser middleware for API handling

**Database Schema:**
- Users (authentication, profile data)
- Animals (shelter animals with adoption status)
- Shelters (animal care facilities)
- Images (user uploads and AI-generated content)
- Prompts & LLM logs (AI interaction tracking)

## Development Commands

### Frontend (client/)
```bash
cd client
npm run dev          # Development server (Vite)
npm run build        # Production build
npm run lint         # ESLint checking
npm run preview      # Preview production build
```

### Backend (server/)
```bash
cd server
npm run dev          # Development with nodemon
npm run start        # Production start
```

## Database Setup

Database schema is located in `server/db/schema.sql`. The schema includes tables for users, animals, shelters, user/generated images, prompts, and LLM API logging.

## Commit Conventions

This project uses gitemoji with Korean commit messages:
- 🎉 프로젝트 초기화
- 📦️ 폴더/구조 추가  
- ✨ 새로운 기능 추가
- 🐛 버그 수정
- ♻️ 리팩터링
- 📝 문서 작업

See `docs/commit-convention.md` for complete guidelines.

## Key Configuration Files

- `client/vite.config.js` - Vite configuration with proxy setup
- `client/axios.js` - Axios instance configured for localhost:3000
- `server/db/schema.sql` - Complete database schema