# Claude Code 팀원 공통 가이드

이 문서는 ALL-I-PROJECT에서 Claude Code를 사용하는 **모든 팀원**이 지켜야 할 공통 규칙과 지시사항입니다.

## 📋 프로젝트 개요

**ALL-I-PROJECT**: 동물 입양 플랫폼 + AI 이미지 생성 기능을 가진 풀스택 웹 애플리케이션

**구조**:
- **Frontend** (`client/`): React 19 + Vite
- **Backend** (`server/`): Node.js + Express + MySQL
- **Database**: MySQL (스키마: `server/db/schema.sql`)

---

## 🤖 Git Hooks 자동화 시스템 (필수 준수!)

### ⚡ 현재 활성화된 자동화
프로젝트에 **Git Hooks 자동화 시스템**이 적용되어 있습니다. 모든 커밋이 자동 검증됩니다.

### 🚨 커밋 규칙 (강제 적용)
1. **gitemoji 필수**: 모든 커밋은 이모지로 시작해야 함 (hooks가 자동 검증)
2. **한글 권장**: 영어도 허용되지만 경고 메시지 표시
3. **보안 검사**: .env, API 키 등 민감한 파일 커밋 시 자동 차단

### 📝 자동 문서화
다음 조건의 커밋은 **자동으로 문서가 생성**됩니다:
- 🔐 보안 관련 + "시스템|인증|권한" 키워드
- ✨ 새 기능 + "API|시스템|구조|기능" 키워드
- 📦️ 구조 변경 + "아키텍처|폴더|스키마" 키워드
- 🔧 설정 변경 + "환경|빌드|배포|시스템" 키워드
- **5개 이상 파일 변경** 시
- **중요 파일 변경** 시 (package.json, vite.config.js, schema.sql 등)

---

## 🎯 커밋 컨벤션

### 자주 사용하는 gitemoji
| 이모지 | 의미 | 한글 예시 | 영어 예시 |
|--------|------|----------|-----------|
| 🎉 | 프로젝트 초기화 | 🎉 프로젝트 초기 커밋 | 🎉 Initial commit |
| 📦️ | 폴더/구조 추가 | 📦️ 컴포넌트 폴더 구조 생성 | 📦️ Add component structure |
| ✨ | 새로운 기능 추가 | ✨ 사용자 로그인 페이지 구현 | ✨ Add user login page |
| 🐛 | 버그 수정 | 🐛 로그인 폼 validation 오류 수정 | 🐛 Fix login form validation |
| ♻️ | 리팩터링 | ♻️ 중복 컴포넌트 로직 정리 | ♻️ Refactor duplicate components |
| 📝 | 문서 작업 | 📝 컴포넌트 사용법 문서 작성 | 📝 Add component documentation |
| 🔧 | 설정 변경 | 🔧 Vite 빌드 설정 수정 | 🔧 Update Vite build config |
| 🎨 | 코드 포맷/스타일 | 🎨 컴포넌트 스타일 개선 | 🎨 Improve component styling |
| 🔥 | 코드/파일 삭제 | 🔥 사용하지 않는 컴포넌트 삭제 | 🔥 Remove unused components |

### 커밋 메시지 작성법
```bash
# 좋은 예시
✨ 동물 카드 컴포넌트 추가
🐛 이미지 업로드 버튼 오류 수정
🔧 API 엔드포인트 URL 변경

# 나쁜 예시 (hooks가 거부)
Add animal card component  # gitemoji 없음
fix bug                    # 구체적이지 않음
```

---

## 📂 프로젝트 구조 및 설정 파일

### Frontend 주요 파일
- `client/vite.config.js` - Vite 설정 (프록시 포함)
- `client/src/axios.js` - API 통신 설정
- `client/package.json` - 프론트엔드 의존성

### Backend 주요 파일  
- `server/server.js` - Express 서버 엔트리포인트
- `server/db/schema.sql` - 데이터베이스 스키마
- `server/package.json` - 백엔드 의존성

### 공통 파일
- `.env` - 환경 변수 (⚠️ **절대 커밋 금지**)
- `.gitignore` - Git 제외 설정
- `docs/` - 프로젝트 문서화

---

## ⚙️ 개발 명령어

### Frontend (client/ 폴더에서)
```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 코드 검사
npm run preview      # 빌드 결과 미리보기
```

### Backend (server/ 폴더에서)
```bash
npm run dev          # nodemon으로 개발 서버
npm run start        # 프로덕션 실행
```

---

## 🔒 보안 규칙

### 절대 커밋하면 안 되는 파일들
- `.env` - 환경 변수 파일
- `*.key` - 개인 키 파일  
- `*.secret` - 시크릿 파일
- API 키나 비밀번호가 포함된 파일

**Git hooks가 자동으로 차단하지만, 사전에 주의하세요!**

### 안전한 환경 변수 관리
```bash
# .env 파일 예시 (커밋 금지!)
DB_HOST=localhost
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret

# 코드에서 사용
const dbHost = process.env.DB_HOST;
```

---

## 📚 문서화 시스템

### 1. 자동 문서화 (권장)
중요한 커밋은 hooks가 자동으로 문서를 생성합니다.
- 생성 위치: `docs/commits/날짜-기능명.md`
- **[TODO] 항목을 반드시 수동으로 작성하세요!**

### 2. 수동 문서화
자동화되지 않은 중요 커밋은 수동 생성:
```bash
# 사용법
./docs/tools/generate-commit-doc.sh <커밋해시> <기능명>

# 예시
./docs/tools/generate-commit-doc.sh abc1234 login-component
```

---

## 🌊 Git 워크플로우

### 브랜치 전략
- `feature/*` - 개별 기능 개발 (Frontend/Backend 구분 없음)
- `dev` - 개발 통합 브랜치 (**hooks 활성화**)
- `main` - 배포용 안정 브랜치

### 작업 순서
1. **브랜치 생성**: `git checkout -b feature/your-feature-name`
2. **개발 작업**: 기능 구현
3. **커밋**: gitemoji 규칙 준수 (hooks 자동 검증)
4. **Push**: `git push origin feature/your-feature-name`
5. **PR 생성**: GitHub에서 Pull Request

### dev 브랜치 최신화
```bash
# 정기적으로 dev 브랜치 변경사항을 가져오기
git checkout dev
git pull origin dev
git checkout feature/your-branch
git merge dev
```

---

## ⚡ Claude Code 사용 시 주의사항

### 🚨 필수 확인사항
1. **Git hooks 메시지 확인**: 커밋 시 나타나는 검증/경고 메시지 주의
2. **린트 실행**: 코드 작성 후 `npm run lint` 실행
3. **빌드 확인**: 중요한 변경 후 `npm run build` 성공 여부 확인

### 💡 권장사항
- **한글 커밋**: 팀 내 소통 향상을 위해 한글 사용 권장
- **의미있는 단위**: 하나의 커밋으로 설명 가능한 변경사항만 포함
- **자주 커밋**: 작은 단위로 자주 커밋하여 작업 기록 남기기

### 🛠️ 문제 해결
- **Hook 실패**: 에러 메시지를 자세히 읽고 수정 후 다시 커밋
- **Merge 충돌**: 충돌 해결 후 gitemoji 규칙에 맞춰 커밋
- **문서화**: 자동 생성된 문서의 [TODO] 항목 작성 잊지 말기

---

## 📞 도움이 필요할 때

1. **GitHub Issues**: 프로젝트 관련 문제나 제안 사항
2. **팀 채널**: 실시간 소통 및 질문
3. **문서 참조**: 
   - `docs/commit-convention.md` - 상세한 커밋 규칙
   - `docs/tools/README.md` - 문서화 도구 사용법

---

**🎯 핵심 포인트**: Git hooks가 활성화되어 있으므로, 커밋 시 나타나는 메시지를 반드시 확인하고 규칙을 준수하세요!