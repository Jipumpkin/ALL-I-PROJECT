const Comment = require('../models/Comment');

const commentController = {
    async createComment(req, res) {
        try {
            const { postId } = req.params;
            const { content, parent_comment_id = null } = req.body;
            const userId = req.user.user_id;
            
            if (!postId || isNaN(postId)) {
                return res.status(400).json({
                    error: '유효하지 않은 게시글 ID입니다.'
                });
            }
            
            if (!content || content.trim().length === 0) {
                return res.status(400).json({
                    error: '댓글 내용을 입력해주세요.'
                });
            }
            
            if (content.trim().length > 1000) {
                return res.status(400).json({
                    error: '댓글은 1000자를 초과할 수 없습니다.'
                });
            }
            
            if (parent_comment_id && isNaN(parent_comment_id)) {
                return res.status(400).json({
                    error: '유효하지 않은 부모 댓글 ID입니다.'
                });
            }
            
            const commentData = {
                post_id: parseInt(postId),
                user_id: userId,
                content: content.trim(),
                parent_comment_id: parent_comment_id ? parseInt(parent_comment_id) : null
            };
            
            const result = await Comment.create(commentData);
            
            res.status(201).json({
                success: true,
                message: '댓글이 성공적으로 작성되었습니다.',
                comment_id: result.comment_id
            });
            
        } catch (error) {
            console.error('댓글 작성 오류:', error);
            res.status(500).json({
                error: error.message || '댓글 작성 중 오류가 발생했습니다.'
            });
        }
    },

    async getCommentsByPostId(req, res) {
        try {
            const { postId } = req.params;
            const { page = 1, limit = 20 } = req.query;
            
            if (!postId || isNaN(postId)) {
                return res.status(400).json({
                    error: '유효하지 않은 게시글 ID입니다.'
                });
            }
            
            const options = {
                page: Math.max(1, parseInt(page)),
                limit: Math.min(100, Math.max(1, parseInt(limit)))
            };
            
            const result = await Comment.findByPostId(parseInt(postId), options);
            
            res.json({
                success: true,
                data: result.comments,
                pagination: result.pagination
            });
            
        } catch (error) {
            console.error('댓글 목록 조회 오류:', error);
            res.status(500).json({
                error: error.message || '댓글 목록 조회 중 오류가 발생했습니다.'
            });
        }
    },

    async getCommentById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    error: '유효하지 않은 댓글 ID입니다.'
                });
            }
            
            const comment = await Comment.findById(parseInt(id));
            
            if (!comment) {
                return res.status(404).json({
                    error: '댓글을 찾을 수 없습니다.'
                });
            }
            
            res.json({
                success: true,
                data: comment
            });
            
        } catch (error) {
            console.error('댓글 조회 오류:', error);
            res.status(500).json({
                error: error.message || '댓글 조회 중 오류가 발생했습니다.'
            });
        }
    },

    async updateComment(req, res) {
        try {
            const { id } = req.params;
            const { content } = req.body;
            const userId = req.user.user_id;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    error: '유효하지 않은 댓글 ID입니다.'
                });
            }
            
            if (!content || content.trim().length === 0) {
                return res.status(400).json({
                    error: '댓글 내용을 입력해주세요.'
                });
            }
            
            if (content.trim().length > 1000) {
                return res.status(400).json({
                    error: '댓글은 1000자를 초과할 수 없습니다.'
                });
            }
            
            await Comment.update(parseInt(id), userId, content.trim());
            
            res.json({
                success: true,
                message: '댓글이 성공적으로 수정되었습니다.'
            });
            
        } catch (error) {
            console.error('댓글 수정 오류:', error);
            
            if (error.message.includes('권한이 없습니다') || error.message.includes('찾을 수 없습니다')) {
                return res.status(403).json({
                    error: error.message
                });
            }
            
            res.status(500).json({
                error: error.message || '댓글 수정 중 오류가 발생했습니다.'
            });
        }
    },

    async deleteComment(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.user_id;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    error: '유효하지 않은 댓글 ID입니다.'
                });
            }
            
            await Comment.delete(parseInt(id), userId);
            
            res.json({
                success: true,
                message: '댓글이 성공적으로 삭제되었습니다.'
            });
            
        } catch (error) {
            console.error('댓글 삭제 오류:', error);
            
            if (error.message.includes('권한이 없습니다') || error.message.includes('찾을 수 없습니다')) {
                return res.status(403).json({
                    error: error.message
                });
            }
            
            res.status(500).json({
                error: error.message || '댓글 삭제 중 오류가 발생했습니다.'
            });
        }
    },

    async getReplies(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    error: '유효하지 않은 댓글 ID입니다.'
                });
            }
            
            const replies = await Comment.getReplies(parseInt(id));
            
            res.json({
                success: true,
                data: replies
            });
            
        } catch (error) {
            console.error('대댓글 조회 오류:', error);
            res.status(500).json({
                error: error.message || '대댓글 조회 중 오류가 발생했습니다.'
            });
        }
    },

    async getCommentCount(req, res) {
        try {
            const { postId } = req.params;
            
            if (!postId || isNaN(postId)) {
                return res.status(400).json({
                    error: '유효하지 않은 게시글 ID입니다.'
                });
            }
            
            const count = await Comment.getCommentCount(parseInt(postId));
            
            res.json({
                success: true,
                data: { count }
            });
            
        } catch (error) {
            console.error('댓글 수 조회 오류:', error);
            res.status(500).json({
                error: error.message || '댓글 수 조회 중 오류가 발생했습니다.'
            });
        }
    }
};

module.exports = commentController;