// server/index.js (Sequelize 버전)

// ✅ 다른 어떤 코드보다도 이 라인이 가장 위에 있어야 합니다.
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

// Sequelize 초기화
const { initializeDatabase } = require('./models');

// services 파일의 함수를 불러옵니다.
const { syncAnimalData } = require('./services/animalSync');

const app = express();
const PORT = process.env.PORT || 3003; 

app.use(cors());
app.use(express.json());

// --- 라우트 설정 ---
app.get('/health', (_, res) => res.json({ ok: true }));
app.get('/api/test', (req, res) => res.json({ message: 'API 테스트 성공!' }));
app.use('/api/animals', require('./routes/animalRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/ai', require('./routes/aiRoutes'));
// app.use('/api/shelters', require('./routes/shelterRoutes')); // TODO: 구현 예정
// app.use('/api/auth', require('./routes/authRoutes'));

app.get('/', (req, res) => {
    res.json({ message: 'ALL-I-PROJECT Backend Server Running' });
});

// --- 서버 실행 및 초기 작업 ---
app.listen(PORT, async () => {
    console.log(`✅ 서버가 ${PORT}번 포트에서 정상적으로 시작되었습니다!`);
    console.log(`🌐 서버 주소: http://localhost:${PORT}`);

    // Sequelize 데이터베이스 초기화
    try {
        await initializeDatabase();
        console.log('🎉 Sequelize 데이터베이스 초기화 완료');
    } catch (error) {
        console.error('💥 Sequelize 데이터베이스 초기화 실패:', error.message);
        // 데이터베이스 초기화 실패는 치명적이므로 서버 종료
        process.exit(1);
    }

    // 데이터 동기화 (환경변수로 제어)
    if (process.env.SYNC_ON_STARTUP === 'true') {
        try {
            console.log('🚀 서버 시작과 함께 데이터 동기화를 시작합니다...');
            await syncAnimalData();
        } catch (err) {
            console.error('💥 동기화 중 오류 발생:', err.message);
            console.log('⚠️ 데이터베이스 연결 없이 서버 계속 실행');
        }
    } else {
        console.log('ℹ️ 시작시 데이터 동기화 비활성화됨 (SYNC_ON_STARTUP=false)');
    }

    // 정기 동기화 스케줄러 (환경변수로 제어)
    if (process.env.SYNC_SCHEDULE_ENABLED === 'true') {
        cron.schedule('0 0 * * *', async () => {
            console.log('🔄 정기 데이터 동기화 시작...');
            try {
                await syncAnimalData();
                console.log('✅ 정기 데이터 동기화 완료');
            } catch (error) {
                console.error('❌ 정기 데이터 동기화 실패:', error);
            }
        }, {
            timezone: 'Asia/Seoul'
        });
        console.log('⏰ 정기 데이터 동기화 스케줄러가 활성화되었습니다 (매일 자정).');
    } else {
        console.log('ℹ️ 정기 데이터 동기화 스케줄러가 비활성화됨 (SYNC_SCHEDULE_ENABLED=false)');
    }
});

// 전역 에러 핸들러
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});