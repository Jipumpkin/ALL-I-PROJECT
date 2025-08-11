const express = require('express')
const router = express.Router();
const aiController = require('../controllers/aiController');

// 이미지 업로드
router.post('/upload', aiController.uploadUserImage);

// 합성버튼 3가지
router.post('/combine/clean', aiController.combineClean);
router.post('/combine/feed', aiController.combineFeed);
router.post('/combine/dress', aiController.combineDress);

// 이미지 다운로드
router.get('/images/:id/download', aiController.downloadImage);

module.exports = router;