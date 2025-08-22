const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authMiddleware } = require('../middleware/auth');

router.get('/posts/:postId/comments', commentController.getCommentsByPostId);

router.get('/posts/:postId/comments/count', commentController.getCommentCount);

router.post('/posts/:postId/comments', authMiddleware, commentController.createComment);

router.get('/comments/:id', commentController.getCommentById);

router.put('/comments/:id', authMiddleware, commentController.updateComment);

router.delete('/comments/:id', authMiddleware, commentController.deleteComment);

router.get('/comments/:id/replies', commentController.getReplies);

module.exports = router;