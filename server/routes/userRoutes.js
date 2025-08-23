const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

// === 인증 관련 라우트 (우선순위 높음) ===
router.post('/auth/register', userController.register);
router.post('/auth/login', userController.login);
router.post('/auth/check-username', userController.checkUsername);

// === 미들웨어 테스트용 임시 라우트 ===
// JWT 토큰 생성 테스트 (실제 로그인 전까지 임시)
router.post('/test/generate-token', userController.generateTestToken);

// 인증 필요한 보호된 라우트 테스트
router.get('/test/protected', authMiddleware, userController.testProtectedRoute);

// 옵셔널 인증 테스트 라우트
router.get('/test/optional-auth', optionalAuthMiddleware, userController.testOptionalAuth);

// 사용자 프로필 조회 (인증 필요)
router.get('/profile', authMiddleware, userController.getUserProfile);

// 사용자 프로필 수정 (인증 필요)
router.put('/profile', authMiddleware, userController.updateUserProfile);

// 회원탈퇴 (인증 필요)
router.delete('/account', authMiddleware, userController.deleteAccount);

// 사용자 등록 이미지 조회
router.get('/:userId/images', userController.getUserImages);

// 사용자 이미지 추가
router.post('/:userId/images', userController.addUserImage);

// 테스트 라우트
router.get('/test-route', (req, res) => {
    res.json({ message: 'Test route working' });
});

// 기본 CRUD 라우트 (마지막에 배치하여 다른 라우트와 충돌 방지)
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;