// server/index.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');
require('dotenv').config();

// Sequelize 초기화
const { initializeDatabase } = require('./models');

const { syncAnimalData } = require('./services/animalSync'); // services 파일의 함수를 불러옵니다.

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(bodyParser.json({ charset: 'utf-8' }));
app.use(bodyParser.urlencoded({ extended: true, charset: 'utf-8' }));

// 미들웨어 적용
const { apiLogger, errorHandler, notFoundHandler } = require('./middleware');
app.use(apiLogger);

// 테스트 라우트
app.get('/api/test', (req, res) => {
    console.log('🔍 /api/test 요청 받음');
    res.json({ message: 'Mock API 테스트 성공!' });
});

// Mock API 라우트 (프론트엔드 호환용) - 새로운 컨트롤러 사용  
const AuthController = require('./controllers/auth/AuthController');

app.post('/api/login', (req, res) => {
    console.log('🔍 /api/login 요청 받음 (실제 DB):', req.body);
    AuthController.login(req, res);
});

app.post('/api/register', (req, res) => {
    console.log('🔍 /api/register 요청 받음 (실제 DB):', req.body);
    AuthController.register(req, res);
});

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/animals', require('./routes/animalRoutes'));

// 404 및 에러 핸들러 (라우트 뒤에 배치)
app.use(notFoundHandler);
app.use(errorHandler);

// TODO: 추후 추가 예정
// app.use('/api/animals', require('./routes/animalRoutes'));
// app.use('/api/shelters', require('./routes/shelterRoutes'));

app.get('/', (req, res) => {
    res.json({ message: 'ALL-I-PROJECT Backend Server Running' });
});

// 전역 에러 핸들러
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

const server = app.listen(PORT, async () => {
    // Sequelize 데이터베이스 초기화
    try {
        await initializeDatabase();
        console.log('🎉 Sequelize 데이터베이스 초기화 완료');
    } catch (error) {
        console.error('💥 Sequelize 데이터베이스 초기화 실패:', error.message);
    }

    console.log(`Server is running on port ${PORT}`);
    console.log('📍 등록된 라우트:');
    console.log('   - GET  /api/test');
    console.log('   - POST /api/login');
    console.log('   - POST /api/register');
    console.log('   - /api/users/* (userRoutes)');
    console.log(`🌐 서버 주소: http://localhost:${PORT}`);
    console.log('✅ 서버가 정상적으로 시작되었습니다!');

    // 🚀 서버 시작과 동시에 데이터 동기화 함수를 호출합니다.
    try {
        await syncAnimalData();
    } catch (err) {
        console.error('💥 초기 데이터 동기화 실패:', err);
    }

    // 🕒 매일 자정(00:00)에 데이터 동기화 실행
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

    console.log('⏰ 정기 데이터 동기화 스케줄러 활성화 (매일 자정)');
});

server.on('error', (error) => {
    console.error('❌ 서버 오류:', error);
});
