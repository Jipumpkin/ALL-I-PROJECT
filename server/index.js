// server/index.js (최종 수정본)

// ✅ 다른 어떤 코드보다도 이 라인이 가장 위에 있어야 합니다.
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');

// dotenv가 실행된 후에 db connection을 가져옵니다.
const { pool } = require('./db/connection'); 
const { syncAnimalData } = require('./services/animalSync');

const app = express();
const PORT = process.env.PORT || 3003; 

app.use(cors());
app.use(express.json());

// --- 라우트 설정 ---
app.get('/health', (_, res) => res.json({ ok: true }));
app.get('/api/test', (req, res) => res.json({ message: 'API 테스트 성공!' }));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/animals', require('./routes/animalRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
// app.use('/api/shelters', require('./routes/shelterRoutes')); // TODO: 구현 예정
app.use('/api/auth', require('./routes/authRoutes'));

app.get('/', (req, res) => {
    res.json({ message: 'ALL-I-PROJECT Backend Server Running' });
});

// --- 서버 실행 및 초기 작업 ---
app.listen(PORT, async () => {
    console.log(`✅ 서버가 ${PORT}번 포트에서 정상적으로 시작되었습니다!`);
    console.log(`🌐 서버 주소: http://localhost:${PORT}`);

    // 자동 데이터 동기화 비활성화 (필요시 주석 해제)
    // try {
    //     console.log('🚀 서버 시작과 함께 데이터 동기화를 시작합니다...');
    //     // pool 객체를 전달합니다.
    //     await syncAnimalData(pool); 
    // } catch (err) {
    //     console.error('💥 동기화 중 오류 발생:', err.message);
    //     console.log('⚠️ 데이터베이스 연결 없이 서버 계속 실행');
    // }

    cron.schedule('0 0 * * *', async () => {
        console.log('🔄 정기 데이터 동기화 시작...');
        try {
            await syncAnimalData(pool);
            console.log('✅ 정기 데이터 동기화 완료');
        } catch (error) {
            console.error('❌ 정기 데이터 동기화 실패:', error);
        }
    }, {
        timezone: 'Asia/Seoul'
    });
    console.log('⏰ 정기 데이터 동기화 스케줄러가 활성화되었습니다 (매일 자정).');
});