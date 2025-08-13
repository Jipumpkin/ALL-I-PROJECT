const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', postController.getPosts);

router.get('/:id', postController.getPostById);

router.post('/', auth, upload.single('image'), postController.createPost);

router.put('/:id', auth, upload.single('image'), postController.updatePost);

router.delete('/:id', auth, postController.deletePost);

router.post('/:id/like', auth, postController.toggleLike);

module.exports = router;