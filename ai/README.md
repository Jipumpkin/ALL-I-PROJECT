# AI 케어 합성 서비스

프론트엔드와 연동된 유기동물 케어 시각화 AI 서비스입니다.

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
# AI 폴더로 이동
cd ai

# Node.js 의존성 설치
npm install

# Python 의존성 설치
pip install -r requirements.txt
```

### 2. 환경 변수 설정

```bash
# .env 파일 생성 (이미 존재하면 건너뛰기)
cp .env.example .env

# .env 파일에서 OpenAI API 키 확인/수정
```

### 3. 서버 실행

```bash
# AI 서버 실행 (포트 3001)
npm start

# 또는 개발 모드
npm run dev
```

## 📡 API 엔드포인트

### POST `/api/ai/care-synthesis-url`
URL 이미지를 사용한 AI 케어 합성

**요청 본문:**
```json
{
  "dogImageUrl": "https://example.com/dog.jpg",
  "spaceImageUrl": "https://example.com/space.jpg", 
  "activity": "food" // "food", "shower", "grooming"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "resultImage": "data:image/png;base64,iVBOR...",
    "activity": "food",
    "breedInfo": "견종: 골든 리트리버...",
    "prompt": "Create a heartwarming...",
    "processingTime": 15340
  }
}
```

### GET `/api/health`
서버 상태 확인

## 🛠 기술 스택

- **Node.js + Express**: API 서버
- **Python**: AI 이미지 처리
- **OpenAI API**: GPT-4V (견종 분석) + DALL-E 3 (이미지 생성)
- **PIL/Pillow**: 이미지 처리

## 🔄 작동 원리

1. **이미지 입력**: 유기견 이미지 + 케어 공간 이미지
2. **견종 분석**: GPT-4V로 정확한 견종 파악
3. **상황 분석**: 유기견 특징 + 공간 환경 분석
4. **프롬프트 생성**: 케어 활동별 맞춤 프롬프트
5. **이미지 생성**: DALL-E 3로 실사 품질 케어 이미지 생성

## 📁 파일 구조

```
ai/
├── ai-server.js              # Express API 서버
├── care-synthesis-url.py     # Python AI 합성 스크립트
├── package.json              # Node.js 의존성
├── requirements.txt          # Python 의존성
├── .env                      # 환경 변수 (OpenAI API 키)
└── temp/                     # 임시 파일 저장소
```

## 🔧 프론트엔드 연동

프론트엔드 Maker 컴포넌트에서 다음과 같이 호출:

```javascript
const response = await fetch('http://localhost:3001/api/ai/care-synthesis-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dogImageUrl: selectedAnimal.image_url,
    spaceImageUrl: userImage,
    activity: 'food' // 'shower', 'grooming'
  })
});
```

## 🐛 문제 해결

### API 키 오류
- `.env` 파일에 올바른 OpenAI API 키가 설정되어 있는지 확인
- API 키에 충분한 크레딧이 있는지 확인

### Python 실행 오류  
- Python이 시스템 PATH에 등록되어 있는지 확인
- requirements.txt의 모든 패키지가 설치되어 있는지 확인

### 포트 충돌
- 포트 3001이 사용 중이면 `ai-server.js`에서 포트 변경
- 프론트엔드에서도 동일한 포트로 호출하도록 수정

## 💡 개발 팁

- AI 서버는 프론트엔드(5173), 백엔드(3003)와 별도 포트(3001)에서 실행
- CORS가 설정되어 있어 프론트엔드에서 직접 호출 가능
- 처리 시간이 10-30초 소요되므로 적절한 로딩 UI 필요