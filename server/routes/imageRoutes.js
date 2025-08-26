const express = require('express');
const router = express.Router();
const ImageController = require('../controllers/imageController');
const upload = require('../middleware/upload');

// 이미지 업로드 (최대 5개 파일)
router.post('/upload', upload.array('images', 5), ImageController.uploadUserImages);

// 이미지 삭제
router.delete('/:filename', ImageController.deleteUserImage);

module.exports = router;