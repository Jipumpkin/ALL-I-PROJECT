const express = require('express')
const router = express.Router();
const aiController = require('../controllers/aiController');

// 이미지 생성
router.post('/generate', aiController.generateAiImage);


module.exports = router;