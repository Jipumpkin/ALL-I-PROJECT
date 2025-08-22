const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { handleUploadError } = require('../middleware/upload');

router.get('/', postController.getPosts);

router.get('/:id', postController.getPostById);

router.post('/', authMiddleware, upload.single('image'), postController.createPost);

router.put('/:id', authMiddleware, upload.single('image'), postController.updatePost);

router.delete('/:id', authMiddleware, postController.deletePost);

router.post('/:id/like', authMiddleware, postController.toggleLike);

// 업로드 에러 핸들러
router.use(handleUploadError);

module.exports = router;