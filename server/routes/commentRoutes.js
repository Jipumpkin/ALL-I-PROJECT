const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');

router.get('/posts/:postId/comments', commentController.getCommentsByPostId);

router.get('/posts/:postId/comments/count', commentController.getCommentCount);

router.post('/posts/:postId/comments', auth, commentController.createComment);

router.get('/comments/:id', commentController.getCommentById);

router.put('/comments/:id', auth, commentController.updateComment);

router.delete('/comments/:id', auth, commentController.deleteComment);

router.get('/comments/:id/replies', commentController.getReplies);

module.exports = router;