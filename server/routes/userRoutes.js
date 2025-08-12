const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

// 기본 CRUD 라우트
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// === 미들웨어 테스트용 임시 라우트 ===
// JWT 토큰 생성 테스트 (실제 로그인 전까지 임시)
router.post('/test/generate-token', userController.generateTestToken);

// 인증 필요한 보호된 라우트 테스트
router.get('/test/protected', authMiddleware, userController.testProtectedRoute);

// 옵셔널 인증 테스트 라우트
router.get('/test/optional-auth', optionalAuthMiddleware, userController.testOptionalAuth);

// 사용자 프로필 조회 (인증 필요)
router.get('/profile', authMiddleware, userController.getUserProfile);

module.exports = router;