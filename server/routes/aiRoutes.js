const express = require('express')
const router = express.Router();
const aiController = require('../controllers/aiController');

// 이미지 생성
router.post('/generate', aiController.generateAiImage);

// 사용자 이미지 히스토리 조회
router.get('/history/:user_id', aiController.getImageHistory);

module.exports = router;