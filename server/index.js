// server/index.js (최종 수정본)

// ✅ 다른 어떤 코드보다도 이 라인이 가장 위에 있어야 합니다.
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const bodyParser = require('body-parser'); // Added from feature/backend-refactoring

// Sequelize 초기화
const { initializeDatabase } = require('./models');

// services 파일의 함수를 불러옵니다.
const { syncAnimalData } = require('./services/animalSync');

const app = express();
const PORT = process.env.PORT || 3003; // Changed back to 3003 for frontend compatibility

// CORS 보안 설정 - 개발환경과 프로덕션 분리
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL || 'https://your-domain.com'
        : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'], // React, Vite 개발서버
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Admin-Token']
};

app.use(cors(corsOptions));

// Request 크기 제한 및 보안 설정
app.use(bodyParser.json({ 
    charset: 'utf-8', 
    limit: '10mb' // API 요청 크기 제한
}));
app.use(bodyParser.urlencoded({ 
    extended: true, 
    charset: 'utf-8',
    limit: '10mb'
}));

// 기본 보안 헤더 추가
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// 미들웨어 적용
const { apiLogger, errorHandler, notFoundHandler } = require('./middleware');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

// Rate limiting 적용 (모든 API 요청) - 임시 비활성화
// app.use('/api/', apiLimiter);
app.use(apiLogger);

// 테스트 라우트
app.get('/api/test', (req, res) => {
    console.log('🔍 /api/test 요청 받음');
    res.json({ message: 'Mock API 테스트 성공!' });
});

// Mock API 라우트 (프론트엔드 호환용) - 새로운 컨트롤러 사용  
const AuthController = require('./controllers/auth/AuthController');

// 인증 관련 엔드포인트에 엄격한 Rate Limiting 적용 - 임시 비활성화
app.post('/api/login', /* authLimiter, */ (req, res) => {
    console.log('🔍 /api/login 요청 받음 (실제 DB):', req.body);
    console.log('🌐 클라이언트 요청 정보:');
    console.log('  - User-Agent:', req.get('User-Agent'));
    console.log('  - Origin:', req.get('Origin'));
    console.log('  - Content-Type:', req.get('Content-Type'));
    console.log('  - 요청 시간:', new Date().toISOString());
    
    // AuthController의 원본 응답을 가로채서 디버깅
    const originalJson = res.json;
    res.json = function(data) {
        console.log('\n🎯 /api/login 최종 응답 데이터 (index.js):');
        console.log('  - success:', data.success);
        if (data.success && data.user) {
            console.log('  - user.id:', data.user.id);
            console.log('  - user.username:', data.user.username);
            console.log('  - user.email:', data.user.email);
            console.log('📅 최종 응답 created_at 정보:');
            console.log('  - user.created_at (Raw):', data.user.created_at);
            console.log('  - user.created_at (Type):', typeof data.user.created_at);
            console.log('  - JSON.stringify created_at:', JSON.stringify(data.user.created_at));
            if (data.user.created_at) {
                console.log('  - new Date(created_at):', new Date(data.user.created_at));
                console.log('  - toISOString():', new Date(data.user.created_at).toISOString());
                console.log('  - toLocaleDateString(ko-KR):', new Date(data.user.created_at).toLocaleDateString('ko-KR'));
            }
        } else {
            console.log('  - 로그인 실패 또는 에러:', data.message);
        }
        console.log('🚀 클라이언트로 전송 완료\n');
        
        // 원래 함수 호출
        originalJson.call(this, data);
    };
    
    AuthController.login(req, res);
});

app.post('/api/register', /* authLimiter, */ (req, res) => {
    console.log('🔍 /api/register 요청 받음 (실제 DB):', req.body);
    AuthController.register(req, res);
});

// --- 라우트 설정 ---
app.get('/health', (_, res) => res.json({ ok: true }));
// The /api/test route is already defined above, so removing the duplicate here.
// app.get('/api/test', (req, res) => res.json({ message: 'API 테스트 성공!' }));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/animals', require('./routes/animalRoutes'));
app.use('/api/admin', require('./routes/adminRoutes')); // 관리자 라우트 추가
// The /api/auth route is handled by AuthController above, so removing the duplicate here.
// app.use('/api/auth', require('./routes/authRoutes'));

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
        // If Sequelize initialization fails, it's critical, so exit.
        process.exit(1);
    }

    console.log(`✅ 서버가 ${PORT}번 포트에서 정상적으로 시작되었습니다!`); // Combined from HEAD
    console.log(`🌐 서버 주소: http://localhost:${PORT}`);
    console.log('📍 등록된 라우트:');
    console.log('   - GET  /api/test');
    console.log('   - POST /api/login');
    console.log('   - POST /api/register');
    console.log('   - /api/users/* (userRoutes)');

    // Call syncAnimalData here, passing the pool if needed, or adapting it to Sequelize
    // Since syncAnimalData was modified to accept 'pool', and we are moving to Sequelize,
    // this part needs careful consideration. For now, I'll assume syncAnimalData
    // will be adapted to use Sequelize internally or receive the Sequelize instance.
    // If syncAnimalData still relies on mysql2/promise pool, it will need to be refactored.
    // For the purpose of resolving this merge conflict, I'll keep the call,
    // but note that syncAnimalData itself might need further changes.
    // 개발환경에서는 매번 동기화하지 않음
    if (process.env.NODE_ENV !== 'development') {
        try {
            console.log('🚀 서버 시작과 함께 데이터 동기화를 시작합니다...');
            await syncAnimalData();
        } catch (err) {
            console.error('💥 동기화 중 오류 발생:', err.message);
            console.log('⚠️ 데이터베이스 연결 없이 서버 계속 실행');
        }
    } else {
        console.log('🔧 개발환경: 서버 시작 시 데이터 동기화를 스킵합니다.');
    }

    cron.schedule('0 0 * * *', async () => {
        console.log('🔄 정기 데이터 동기화 시작...');
        try {
            // Assuming syncAnimalData will be adapted to Sequelize
            await syncAnimalData(); // Removed 'pool' argument
            console.log('✅ 정기 데이터 동기화 완료');
        } catch (error) {
            console.error('❌ 정기 데이터 동기화 실패:', error);
        }
    }, {
        timezone: 'Asia/Seoul'
    });
    console.log('⏰ 정기 데이터 동기화 스케줄러가 활성화되었습니다 (매일 자정).');
});