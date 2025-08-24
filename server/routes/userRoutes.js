const express = require('express');
const router = express.Router();

// 분할된 컨트롤러들 import
const AuthController = require('../controllers/auth/AuthController');
const UserProfileController = require('../controllers/user/UserProfileController');
const UserCrudController = require('../controllers/user/UserCrudController');
const TestController = require('../controllers/test/TestController');

// 미들웨어 import
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

// Validators import
const {
  validateRegister,
  validateLogin,
  validateCheckUsername,
  validateProfileUpdate,
  validateDeleteAccount,
  validateUserId
} = require('../validators');

// === 인증 관련 라우트 (우선순위 높음) ===
router.post('/auth/register', validateRegister, AuthController.register);
router.post('/auth/login', validateLogin, AuthController.login);
router.post('/auth/check-username', validateCheckUsername, AuthController.checkUsername);

// === 사용자 프로필 관련 라우트 (인증 필요) ===
router.get('/profile', authMiddleware, UserProfileController.getUserProfile);
router.put('/profile', authMiddleware, validateProfileUpdate, UserProfileController.updateUserProfile);
router.delete('/account', authMiddleware, validateDeleteAccount, UserProfileController.deleteAccount);

// === 테스트 라우트 (개발용) ===
router.post('/test/generate-token', TestController.generateTestToken);
router.get('/test/protected', authMiddleware, TestController.testProtectedRoute);
router.get('/test/optional-auth', optionalAuthMiddleware, TestController.testOptionalAuth);

// === 기본 테스트 라우트 ===
router.get('/test-route', (req, res) => {
    res.json({ message: 'Test route working' });
});

// === 기본 CRUD 라우트 (마지막에 배치하여 다른 라우트와 충돌 방지) ===
router.get('/', UserCrudController.getAllUsers);
router.get('/:id', validateUserId, UserCrudController.getUserById);
router.post('/', validateRegister, UserCrudController.createUser);
router.put('/:id', validateUserId, validateProfileUpdate, UserCrudController.updateUser);
router.delete('/:id', validateUserId, UserCrudController.deleteUser);

module.exports = router;