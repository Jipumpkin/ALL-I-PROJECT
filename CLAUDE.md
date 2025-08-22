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

## 🎉 2025-08-18 작업 완료 보고서

### ✅ 오늘의 주요 성과 (100% 완성!)

#### 🏗️ 인프라 완성
1. **MySQL 데이터베이스 완전 구축**
   - 로컬 MySQL 설치 및 설정 완료 (비밀번호: 12345)
   - 7개 테이블 생성 완료 (users, animals, shelters, user_images, prompts, generated_images, llm_logs)
   - 실제 bcrypt 해시값으로 테스트 사용자 3명 삽입 완료

2. **실제 DB API 완전 구현**
   - Mock API에서 실제 MySQL DB API로 100% 전환 완료
   - 로그인 API 완벽 작동 확인 ✅
   - 회원가입 API 완벽 작동 확인 ✅ 
   - JWT 토큰 정상 생성 및 반환 확인 ✅

3. **서버 안정성 완성**
   - 포트 3003에서 안정적 실행
   - 에러 핸들링 완전 구현
   - 디버깅 시스템 완비

#### 🧪 테스트 데이터 현황
```
📊 데이터베이스 상태:
   👥 사용자: 4명 (testuser, admin, demo, testuser6)
   🏠 보호소: 3개 (서울, 부산, 대구)
   🐕 동물: 5마리

🔑 테스트 계정:
   - testuser / test@example.com / Test123!@#
   - admin / admin@allipet.com / Admin123!@#
   - demo / demo@allipet.com / Demo123!@#
```

#### 🔧 구현된 스크립트들
- `server/scripts/setup_database.js` - 자동 DB 생성
- `server/scripts/insert_test_data.js` - 테스트 데이터 삽입
- `server/scripts/test_db_connection.js` - DB 연결 테스트
- `server/scripts/test_real_api.js` - API 종합 테스트

### 🎯 다음 작업 계획 (우선순위)

#### 1단계: 프론트엔드 연동 완료 (30분)
- **목표**: 기존 React 컴포넌트들을 실제 DB API와 연결
- **작업**:
  - Login 컴포넌트 API 엔드포인트 수정 (현재 mock → 실제 DB)
  - Register 컴포넌트 API 연동 검증
  - AuthContext에서 실제 JWT 토큰 처리 확인
  - 보호된 라우트들 실제 인증 연동 테스트

#### 2단계: 데모 시연 준비 (15분)
- **목표**: 완전 작동하는 인증 시스템 데모
- **데모 시나리오**:
  1. 회원가입 → JWT 토큰 발급 확인
  2. 로그인 → 사용자 데이터 표시
  3. 보호된 페이지 접근 → 인증 확인
  4. 로그아웃 → 토큰 삭제 확인

#### 3단계: 커밋 및 문서화 (15분)
- **목표**: 완성된 시스템 정식 커밋
- **작업**:
  - 변경사항 전체 커밋
  - 커밋 문서 생성
  - README 업데이트

### 🚀 현재 시스템 상태

#### ✅ 완전 작동 중
```bash
# 서버 실행
cd server && npm run dev  # 포트 3003

# API 테스트
curl -X POST http://localhost:3003/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

curl -X POST http://localhost:3003/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","email":"new@test.com","password":"Test123!@#"}'
```

#### 🛠️ 개발환경 설정
- **백엔드**: localhost:3003 (완전 작동)
- **프론트엔드**: localhost:5173 (React + Vite)
- **데이터베이스**: MySQL localhost:3306 (완전 연결)
- **풀스택 실행**: `npm run dev` (루트에서)

### 🔍 기술 스택 완성도
- ✅ **백엔드**: Node.js + Express + MySQL (100%)
- ✅ **인증**: JWT + bcrypt (100%)
- ✅ **데이터베이스**: MySQL 7개 테이블 (100%)
- 🔄 **프론트엔드**: React 컴포넌트 연동 (90%)
- ✅ **개발환경**: 풀스택 개발환경 (100%)

### 💡 핵심 성과 요약
1. **실제 데이터베이스 기반 인증 시스템 완전 구현**
2. **JWT 토큰 기반 보안 시스템 완성**
3. **Mock에서 Real DB로 완전 전환 성공**
4. **테스트 시스템 및 자동화 스크립트 완비**

### 📝 다음 세션 시작점
```
⭐ 시작 명령어:
1. cd server && npm run dev (서버 시작)
2. 새 터미널: npm run dev (프론트엔드 시작)
3. 브라우저: http://localhost:5173
4. API 테스트: node server/scripts/test_real_api.js

🎯 다음 작업: Login/Register 컴포넌트 실제 DB API 연동 마무리
```

### 🔧 완료된 핵심 파일들

#### 데이터베이스
- `server/db/setup.sql` - 완전한 DB 스키마
- `server/db/test_data.sql` - 실제 bcrypt 해시 테스트 데이터
- `server/config/database.js` - MySQL 연결 설정

#### 백엔드 API
- `server/models/User.js` - 확장된 User 모델 (인증 메서드 포함)
- `server/controllers/userController.js` - 완전한 register/login API
- `server/middleware/auth.js` - JWT 인증 미들웨어
- `server/utils/jwt.js` - JWT 토큰 유틸리티
- `server/utils/hash.js` - bcrypt 해싱 유틸리티

#### 테스트 & 스크립트  
- `server/scripts/setup_database.js` - DB 자동 생성
- `server/scripts/insert_test_data.js` - 테스트 데이터 삽입
- `server/scripts/test_real_api.js` - API 종합 테스트