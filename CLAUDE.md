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
- `docs/claude-code-guide.md` - 팀원 공통 가이드 (Git hooks, 컨벤션)

## 현재 작업 상황 (2025-08-12)

### 🎯 주요 작업: 인증 시스템 구현 (feature/backend-auth-system)

#### ✅ 완료된 부분 (40%)
1. **기반 인프라** (100% 완료)
   - `server/utils/jwt.js` - JWT 토큰 생성/검증/디코딩
   - `server/utils/hash.js` - bcrypt 해싱/비교, 비밀번호 검증
   - 의존성: bcryptjs, jsonwebtoken 설치 완료

2. **기본 MVC 구조** (100% 완료)  
   - `server/models/User.js` - 기본 CRUD 메서드
   - `server/controllers/userController.js` - 기본 REST API
   - `server/routes/userRoutes.js` - 기본 라우트

#### ❌ 미완성 부분 (60%)
1. **인증 미들웨어** (0%) - `server/middleware/auth.js` 파일 없음
2. **회원가입 API** (0%) - register 함수 없음
3. **로그인 API** (0%) - login 함수 없음
4. **User 모델 확장** (20%) - findByEmail 등 인증 메서드 없음

### 🚀 다음 작업 순서 (우선순위)

#### 1단계: 인증 미들웨어 구현 (필수 기반)
- **목표**: JWT 토큰 검증 미들웨어 생성
- **파일**: `server/middleware/auth.js`
- **기능**: 
  - Authorization 헤더에서 토큰 추출
  - JWT 토큰 검증 (jwtUtils.verifyToken 사용)
  - req.user에 사용자 정보 추가
  - 에러 처리 (401, 403)

#### 2단계: User 모델 확장 (인증 특화)
- **목표**: 인증 관련 메서드 추가
- **파일**: `server/models/User.js`
- **추가 메서드**:
  - `findByEmail(email)` - 로그인용 이메일 검색
  - `checkEmailExists(email)` - 이메일 중복 체크
  - `createWithValidation(userData)` - 검증 포함 회원가입

#### 3단계: 회원가입 API 구현
- **목표**: 안전한 사용자 등록 기능
- **파일**: `server/controllers/userController.js`
- **register 함수 구현**:
  - 입력 데이터 검증 (이메일, 비밀번호)
  - 이메일 중복 체크
  - 비밀번호 해싱 (hashUtils 사용)
  - 사용자 생성 및 토큰 발급

#### 4단계: 로그인 API 구현  
- **목표**: 인증 후 토큰 발급
- **파일**: `server/controllers/userController.js`
- **login 함수 구현**:
  - 이메일로 사용자 검색
  - 비밀번호 비교 (hashUtils 사용)
  - JWT 토큰 발급 (jwtUtils 사용)
  - 로그인 실패 처리

#### 5단계: 라우트 및 보안 적용
- **목표**: 인증 라우트 추가 및 보호된 라우트 설정
- **파일**: `server/routes/userRoutes.js`
- **작업**:
  - POST `/auth/register` 라우트 추가
  - POST `/auth/login` 라우트 추가
  - 기존 사용자 정보 라우트에 auth 미들웨어 적용

### 🔍 현재 세션 목표
**1단계 완료**: ✅ 인증 미들웨어 구현 → JWT 토큰 검증 기능 활성화

### 📋 1단계 체크리스트 (완료)
- [x] `server/middleware/auth.js` 파일 생성
- [x] JWT 토큰 추출 로직 구현  
- [x] 토큰 검증 및 사용자 정보 추가
- [x] 에러 처리 (토큰 없음, 만료, 유효하지 않음)
- [x] 미들웨어 테스트 준비 (테스트 라우트 추가)

### 🧪 테스트 가능한 엔드포인트
**서버 실행**: `cd server && npm run dev`

1. **토큰 생성**: `POST /api/users/test/generate-token`
   ```json
   { "userId": 1 }
   ```

2. **보호된 라우트**: `GET /api/users/test/protected`
   ```
   Headers: Authorization: Bearer <token>
   ```

3. **옵셔널 인증**: `GET /api/users/test/optional-auth`
   ```
   Headers: Authorization: Bearer <token> (선택사항)
   ```

4. **사용자 프로필**: `GET /api/users/profile`
   ```
   Headers: Authorization: Bearer <token>
   ```

### 🎯 다음 세션 목표
**2단계 시작**: User 모델 확장 → 인증 특화 메서드 추가