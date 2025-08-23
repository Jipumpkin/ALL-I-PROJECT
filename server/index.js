// server/index.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { syncAnimalData } = require('./services/animalSync'); // services 파일의 함수를 불러옵니다.

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 테스트 라우트
app.get('/api/test', (req, res) => {
    console.log('🔍 /api/test 요청 받음');
    res.json({ message: 'Mock API 테스트 성공!' });
});

// Mock API 라우트 (프론트엔드 호환용) - 먼저 정의  
const userController = require('./controllers/userController');
console.log('📋 userController 함수들:', Object.keys(userController));

app.post('/api/login', (req, res) => {
    console.log('🔍 /api/login 요청 받음 (실제 DB):', req.body);
    if (userController.login) {
        userController.login(req, res);
    } else {
        console.error('❌ login 함수를 찾을 수 없습니다.');
        res.status(500).json({ error: 'login 함수를 찾을 수 없습니다.' });
    }
});

app.post('/api/register', (req, res) => {
    console.log('🔍 /api/register 요청 받음 (실제 DB):', req.body);
    if (userController.register) {
        userController.register(req, res);
    } else {
        res.status(500).json({ error: 'register 함수를 찾을 수 없습니다.' });
    }
});

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/animals', require('./routes/animalRoutes'));

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
});

server.on('error', (error) => {
    console.error('❌ 서버 오류:', error);
});
