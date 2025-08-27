# 🐕💝 DALL-E 케어 이미지 합성 시스템

Node.js 백엔드와 연동 가능한 Python 기반 이미지 합성 도구

## 🎯 개요

유기동물 사진과 커스텀 공간 이미지를 조합하여, 동물이 새로운 환경에서 케어받는 모습을 DALL-E로 합성하는 시스템입니다.

### ✨ 주요 기능

- **3가지 케어 활동**: 밥주기, 씻기기, 미용하기
- **GPT-4V 이미지 분석**: 동물과 공간의 특징을 정확히 파악
- **DALL-E 3 고품질 합성**: HD 품질의 실사 이미지 생성
- **Node.js 친화적**: CLI 인터페이스로 subprocess 호출 지원

## 📋 사전 요구사항

### Python 환경
```bash
Python 3.8 이상
```

### 필수 패키지 설치
```bash
cd dalle
pip install -r requirements.txt
```

### OpenAI API 키 설정
```bash
cp .env.example .env
# .env 파일에 OpenAI API 키 입력
OPENAI_API_KEY=your_api_key_here
```

## 🚀 사용법

### 1. CLI 직접 사용

```bash
# 기본 사용법
python care_synthesizer_cli.py \
  --animal ./data/animal.jpg \
  --space ./data/room.jpg \
  --activity 밥주기

# 출력 디렉토리 지정
python care_synthesizer_cli.py \
  --animal ./data/animal.jpg \
  --space ./data/room.jpg \
  --activity 씻기기 \
  --output ./custom_results/

# JSON 형태로 조용히 실행 (Node.js 연동시 권장)
python care_synthesizer_cli.py \
  --animal ./data/animal.jpg \
  --space ./data/room.jpg \
  --activity 미용하기 \
  --quiet \
  --format json
```

### 2. 지원 활동 목록 확인

```bash
python care_synthesizer_cli.py --list-activities
```

### 3. Node.js에서 사용

```javascript
const { CareImageSynthesizer } = require('./nodejs_integration_example');

const synthesizer = new CareImageSynthesizer();

// 이미지 합성
const result = await synthesizer.synthesizeImage(
  './uploads/dog.jpg',      // 동물 이미지
  './uploads/kitchen.jpg',  // 공간 이미지
  '밥주기'                   // 케어 활동
);

console.log('생성된 파일:', result.filename);
```

## 📁 파일 구조

```
dalle/
├── api_synthesizer.py           # 핵심 합성 로직
├── care_synthesizer_cli.py      # CLI 인터페이스
├── nodejs_integration_example.js # Node.js 연동 예제
├── requirements.txt             # Python 의존성
├── .env.example                # 환경변수 예제
├── README.md                   # 이 파일
├── data/                       # 입력 이미지 저장소
│   ├── animal.jpg             # 동물 이미지 (예제)
│   └── custom_space.jpg       # 공간 이미지 (예제)
└── results/                   # 출력 결과
    ├── care_밥주기_20241227_143025.png
    └── meta_밥주기_20241227_143025.json
```

## 🎨 지원되는 케어 활동

| 활동 | 설명 | 생성되는 장면 |
|------|------|---------------|
| **밥주기** | 음식을 먹거나 음식 그릇 근처에서 행복해하는 모습 | 식사 시간, 음식 그릇, 신선한 음식 |
| **씻기기** | 목욕하거나 목욕 후 깔끔한 상태의 행복한 모습 | 목욕 장면, 수건, 목욕 용품 |
| **미용하기** | 그루밍을 받거나 그루밍 후 아름다운 모습 | 그루밍 도구, 브러시, 깔끔한 외모 |

## 🔧 Node.js 백엔드 연동

### Express.js 예제

```javascript
const express = require('express');
const { CareImageSynthesizer, createExpressRoutes } = require('./dalle/nodejs_integration_example');

const app = express();
app.use(express.json());

// 라우트 자동 생성
createExpressRoutes(app);

// 또는 수동 구성
const synthesizer = new CareImageSynthesizer();

app.post('/api/synthesize', async (req, res) => {
  try {
    const result = await synthesizer.synthesizeImage(
      req.body.animalImage,
      req.body.spaceImage, 
      req.body.activity
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### API 응답 형식

#### 성공 시:
```json
{
  "success": true,
  "activity": "밥주기",
  "image_path": "/path/to/results/care_밥주기_20241227_143025.png",
  "filename": "care_밥주기_20241227_143025.png",
  "timestamp": "20241227_143025"
}
```

#### 실패 시:
```json
{
  "success": false,
  "error": "동물 이미지를 찾을 수 없습니다: /path/to/missing.jpg"
}
```

## 🎯 프로덕션 배포 시 고려사항

### 1. 환경 변수 설정
```bash
export OPENAI_API_KEY="your-production-key"
export RESULTS_DIR="/app/results"
export LOG_LEVEL="ERROR"
```

### 2. Python 경로 설정
```javascript
const synthesizer = new CareImageSynthesizer(
  '/usr/bin/python3',  // 프로덕션 Python 경로
  '/app/dalle'         // 스크립트 디렉토리
);
```

### 3. 파일 권한 설정
```bash
chmod +x care_synthesizer_cli.py
chown -R app:app results/
```

### 4. 에러 처리 및 로깅
```javascript
app.post('/api/synthesize', async (req, res) => {
  try {
    // 파일 크기 제한
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    
    // 타임아웃 설정  
    const timeout = 120000; // 2분
    
    const result = await Promise.race([
      synthesizer.synthesizeImage(...args),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('타임아웃')), timeout)
      )
    ]);
    
    res.json(result);
  } catch (error) {
    console.error('합성 오류:', error);
    res.status(500).json({ 
      success: false,
      error: process.env.NODE_ENV === 'production' 
        ? '서버 오류가 발생했습니다' 
        : error.message 
    });
  }
});
```

## 🐛 문제 해결

### 일반적인 오류들

1. **OpenAI API 키 오류**
   ```
   해결: .env 파일의 OPENAI_API_KEY 확인
   ```

2. **Python 경로 오류**
   ```
   해결: Node.js에서 정확한 Python 경로 지정
   ```

3. **이미지 파일 접근 오류**
   ```
   해결: 파일 경로와 권한 확인
   ```

4. **메모리 부족**
   ```
   해결: 이미지 크기 제한, 동시 요청 수 제한
   ```

## 📞 지원

- 이슈 제보: GitHub Issues
- 문의: 개발팀 연락처
- 문서: 프로젝트 Wiki

---

## 🎉 사용 예제

완전한 사용 예제는 `nodejs_integration_example.js` 파일을 참고하세요.

이 시스템을 통해 유기동물들이 새로운 가정에서 사랑받는 모습을 미리 시각화할 수 있습니다! 🐾💕