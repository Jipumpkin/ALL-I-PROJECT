const express = require('express')
const router = express.Router();
const aiController = require('../controllers/aiController');
const careController = require('../controllers/careController');

// 기존 AI 이미지 생성
router.post('/generate', aiController.generateAiImage);

// 케어 게임 이미지 생성
router.post('/generate-care-image', aiController.generateCareImage);

// AI 케어 피드백 생성 (새로운 기능)
router.post('/care-feedback', aiController.generateCareFeedback);

// AI 동물 스토리 생성 (새로운 기능)
router.post('/animal-story', aiController.generateAnimalStory);

// 테스트용 단순 라우트
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'AI routes working!' });
});

// AI 케어 추천 시스템 (새로운 기능)
router.post('/care-recommendations', aiController.getAiCareRecommendations);

// 사용자 이미지 히스토리 조회
router.get('/history/:user_id', aiController.getImageHistory);

// 케어 이미지 합성
router.post('/care/synthesize', careController.synthesizeCareImage);

// 지원하는 케어 활동 목록
router.get('/care/activities', careController.getCareActivities);

// 케어 이미지 히스토리
router.get('/care/history/:user_id', careController.getCareHistory);

module.exports = router;