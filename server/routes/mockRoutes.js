const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// === Mock API 라우트 (프론트엔드 완전 호환) ===

/**
 * Mock 로그인 API
 * POST /api/login
 * Body: { username, password }
 * 
 * 특징:
 * - 프론트엔드 기존 코드와 100% 호환
 * - username 필드로 실제로는 username 또는 email 검색
 * - 실제 JWT 토큰 발급
 * - DB 없이 메모리 기반 동작
 */
router.post('/login', userController.mockLogin);

/**
 * Mock 회원가입 API  
 * POST /api/register
 * Body: { username, password, email?, nickname?, phone_number? }
 * 
 * 특징:
 * - 프론트엔드 호환성 우선
 * - email이 없으면 자동으로 ${username}@mock.com 생성
 * - 실제 bcrypt 해싱 및 JWT 발급
 * - Mock DB에 영구 저장 (서버 재시작시 초기화)
 */
router.post('/register', userController.mockRegister);

module.exports = router;