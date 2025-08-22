# 🔐 JWT 인증 시스템 개발

## 📋 개발 개요

**목표**: 안전하고 확장 가능한 사용자 인증 시스템 구축  
**진행률**: 40% 완료 (미들웨어 구현 완료, API 구현 대기)  
**기술 스택**: Node.js, Express, JWT, bcrypt  

## 🏗️ 시스템 아키텍처

### 전체 구조
```
클라이언트 → Express Router → 인증 미들웨어 → 컨트롤러 → 데이터베이스
```

### 핵심 컴포넌트
- **JWT 유틸리티** (`server/utils/jwt.js`): 토큰 생성/검증 로직
- **비밀번호 해싱** (`server/utils/hash.js`): bcrypt 기반 보안 처리
- **인증 미들웨어** (`server/middleware/auth.js`): Express 미들웨어 패턴
- **사용자 모델** (`server/models/User.js`): 데이터베이스 추상화

## 🔧 구현된 기능들

### 1. JWT 토큰 관리
- **토큰 생성**: 사용자 정보를 암호화하여 JWT 생성
- **토큰 검증**: 서명 확인 및 만료시간 체크
- **이중 토큰 시스템**: Access Token (15분) + Refresh Token (7일)

```javascript
// 토큰 생성 예시
const payload = { userId: 1, email: "user@example.com" };
const accessToken = jwt.sign(payload, SECRET, { expiresIn: "15m" });
```

### 2. 비밀번호 보안
- **bcrypt 해싱**: 단방향 암호화로 비밀번호 보호
- **Salt Rounds**: 12라운드 해싱으로 무차별 대입 공격 방지
- **비밀번호 검증**: 로그인 시 해시 비교

```javascript
// 비밀번호 해싱
const hashedPassword = await bcrypt.hash(password, 12);
```

### 3. 인증 미들웨어 시스템

#### authMiddleware (필수 인증)
- Authorization 헤더에서 Bearer 토큰 추출
- JWT 서명 및 만료시간 검증
- 데이터베이스에서 사용자 존재 확인
- req.user에 사용자 정보 설정

#### optionalAuthMiddleware (선택적 인증)
- 토큰이 있으면 인증 처리, 없어도 통과
- 공개 API에서 로그인 상태에 따른 개인화 제공
- UX 친화적 설계 (로그인 강요하지 않음)

## 🛡️ 보안 고려사항

### 1. 토큰 보안
- **Bearer 토큰 방식**: HTTP 표준 인증 헤더 사용
- **서명 검증**: 토큰 위변조 방지
- **만료시간 설정**: 토큰 탈취 시 피해 최소화

### 2. 데이터 보호
- **비밀번호 제외**: req.user에서 password_hash 자동 제거
- **입력 검증**: 모든 API 파라미터 유효성 검사
- **에러 정보 최소화**: 보안 취약점 노출 방지

### 3. 방어적 프로그래밍
- **이중 사용자 확인**: 토큰 검증 + DB 재확인
- **예외 처리**: try-catch로 예상치 못한 에러 대응
- **상태 코드 표준화**: 401, 403, 500 등 적절한 HTTP 응답

## 📊 API 엔드포인트

### 테스트용 API (개발 중)
- `POST /api/users/test/generate-token`: JWT 토큰 생성 테스트
- `GET /api/users/test/protected`: 필수 인증 테스트
- `GET /api/users/test/optional-auth`: 선택적 인증 테스트
- `GET /api/users/profile`: 사용자 프로필 조회

### 구현 예정 API
- `POST /api/users/register`: 회원가입
- `POST /api/users/login`: 로그인
- `POST /api/users/refresh`: 토큰 갱신
- `POST /api/users/logout`: 로그아웃

## 🧪 테스트 결과

### 성공 테스트
- ✅ JWT 토큰 생성 및 검증
- ✅ Bearer 토큰 형식 검증
- ✅ 사용자 정보 추출 및 설정
- ✅ 비밀번호 해싱 및 비교

### 에러 시나리오 테스트
- ✅ 토큰 없음 (401: NO_TOKEN)
- ✅ 잘못된 토큰 형식 (401: INVALID_TOKEN_FORMAT)
- ✅ 만료된 토큰 (401: TOKEN_EXPIRED)
- ✅ 존재하지 않는 사용자 (401: USER_NOT_FOUND)

## 🚀 다음 개발 계획

### 단기 목표 (1주 내)
1. User 모델 확장 (이메일 중복 확인 등)
2. 회원가입 API 구현
3. 로그인 API 구현
4. 토큰 갱신 API 구현

### 중기 목표 (2주 내)
1. 프론트엔드와 API 연동
2. 사용자 권한 관리 시스템
3. 세션 관리 및 로그아웃 기능
4. 비밀번호 찾기/변경 기능

## 💡 기술적 성과

### 확장성
- Express 미들웨어 패턴으로 재사용성 극대화
- MVC 패턴으로 코드 구조화
- 환경변수 기반 설정으로 배포 환경 대응

### 성능
- JWT 토큰으로 서버 세션 부담 제거
- 비동기 처리로 응답 속도 최적화
- 데이터베이스 쿼리 최소화

### 보안
- 업계 표준 보안 관행 준수
- 다층 방어 구조 구현
- 개인정보 보호 강화

## 📝 학습 성과

1. **JWT 인증 시스템** 전체 구조 이해
2. **Express 미들웨어 패턴** 마스터
3. **보안 프로그래밍** 실무 경험
4. **비동기 JavaScript** 활용 능력
5. **MVC 아키텍처** 실제 적용