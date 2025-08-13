const Post = require('../models/Post');

const postController = {
    async createPost(req, res) {
        try {
            const { title, content, category = 'general' } = req.body;
            const userId = req.user.user_id;
            
            if (!title || !content) {
                return res.status(400).json({
                    error: '제목과 내용은 필수입니다.'
                });
            }
            
            if (title.length > 200) {
                return res.status(400).json({
                    error: '제목은 200자를 초과할 수 없습니다.'
                });
            }
            
            const validCategories = ['general', 'adoption', 'missing', 'found', 'tips'];
            if (!validCategories.includes(category)) {
                return res.status(400).json({
                    error: '유효하지 않은 카테고리입니다.'
                });
            }
            
            const postData = {
                user_id: userId,
                title: title.trim(),
                content: content.trim(),
                category,
                image_url: req.file ? `/uploads/${req.file.filename}` : null
            };
            
            const result = await Post.create(postData);
            
            res.status(201).json({
                success: true,
                message: '게시글이 성공적으로 작성되었습니다.',
                post_id: result.post_id
            });
            
        } catch (error) {
            console.error('게시글 작성 오류:', error);
            res.status(500).json({
                error: error.message || '게시글 작성 중 오류가 발생했습니다.'
            });
        }
    },

    async getPosts(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                category,
                search,
                sortBy = 'created_at',
                sortOrder = 'DESC'
            } = req.query;
            
            const validSortFields = ['created_at', 'view_count', 'like_count', 'title'];
            const validSortOrders = ['ASC', 'DESC'];
            
            const options = {
                page: Math.max(1, parseInt(page)),
                limit: Math.min(50, Math.max(1, parseInt(limit))),
                category: category || null,
                search: search || null,
                sortBy: validSortFields.includes(sortBy) ? sortBy : 'created_at',
                sortOrder: validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC'
            };
            
            const result = await Post.findAll(options);
            
            res.json({
                success: true,
                data: result.posts,
                pagination: result.pagination
            });
            
        } catch (error) {
            console.error('게시글 목록 조회 오류:', error);
            res.status(500).json({
                error: error.message || '게시글 목록 조회 중 오류가 발생했습니다.'
            });
        }
    },

    async getPostById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    error: '유효하지 않은 게시글 ID입니다.'
                });
            }
            
            const post = await Post.findById(parseInt(id));
            
            if (!post) {
                return res.status(404).json({
                    error: '게시글을 찾을 수 없습니다.'
                });
            }
            
            await Post.incrementViewCount(parseInt(id));
            post.view_count += 1;
            
            res.json({
                success: true,
                data: post
            });
            
        } catch (error) {
            console.error('게시글 조회 오류:', error);
            res.status(500).json({
                error: error.message || '게시글 조회 중 오류가 발생했습니다.'
            });
        }
    },

    async updatePost(req, res) {
        try {
            const { id } = req.params;
            const { title, content, category } = req.body;
            const userId = req.user.user_id;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    error: '유효하지 않은 게시글 ID입니다.'
                });
            }
            
            if (!title || !content) {
                return res.status(400).json({
                    error: '제목과 내용은 필수입니다.'
                });
            }
            
            if (title.length > 200) {
                return res.status(400).json({
                    error: '제목은 200자를 초과할 수 없습니다.'
                });
            }
            
            const validCategories = ['general', 'adoption', 'missing', 'found', 'tips'];
            if (category && !validCategories.includes(category)) {
                return res.status(400).json({
                    error: '유효하지 않은 카테고리입니다.'
                });
            }
            
            const updateData = {
                title: title.trim(),
                content: content.trim(),
                category: category || 'general',
                image_url: req.file ? `/uploads/${req.file.filename}` : undefined
            };
            
            if (updateData.image_url === undefined) {
                delete updateData.image_url;
            }
            
            await Post.update(parseInt(id), userId, updateData);
            
            res.json({
                success: true,
                message: '게시글이 성공적으로 수정되었습니다.'
            });
            
        } catch (error) {
            console.error('게시글 수정 오류:', error);
            
            if (error.message.includes('권한이 없습니다') || error.message.includes('찾을 수 없습니다')) {
                return res.status(403).json({
                    error: error.message
                });
            }
            
            res.status(500).json({
                error: error.message || '게시글 수정 중 오류가 발생했습니다.'
            });
        }
    },

    async deletePost(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.user_id;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    error: '유효하지 않은 게시글 ID입니다.'
                });
            }
            
            await Post.delete(parseInt(id), userId);
            
            res.json({
                success: true,
                message: '게시글이 성공적으로 삭제되었습니다.'
            });
            
        } catch (error) {
            console.error('게시글 삭제 오류:', error);
            
            if (error.message.includes('권한이 없습니다') || error.message.includes('찾을 수 없습니다')) {
                return res.status(403).json({
                    error: error.message
                });
            }
            
            res.status(500).json({
                error: error.message || '게시글 삭제 중 오류가 발생했습니다.'
            });
        }
    },

    async toggleLike(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.user_id;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    error: '유효하지 않은 게시글 ID입니다.'
                });
            }
            
            const result = await Post.toggleLike(parseInt(id), userId);
            
            res.json({
                success: true,
                data: {
                    isLiked: result.isLiked,
                    likeCount: result.likeCount
                },
                message: result.isLiked ? '좋아요를 눌렀습니다.' : '좋아요를 취소했습니다.'
            });
            
        } catch (error) {
            console.error('좋아요 처리 오류:', error);
            res.status(500).json({
                error: error.message || '좋아요 처리 중 오류가 발생했습니다.'
            });
        }
    }
};

module.exports = postController;