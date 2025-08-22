// 최상단에 공통으로 추가 (경로를 정확히 잡아주는 것이 좋습니다)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 서버 상태 확인을 위한 헬스 체크 엔드포인트
app.get('/health', (_, res) => res.json({ ok: true }));

// '/api/animals' 경로로 오는 모든 요청은 animalRoutes에서 처리
app.use('/api/animals', require('./routes/animalRoutes'));

// 주기적으로 데이터를 가져오는 크론잡 실행
require('./jobs/cron');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));