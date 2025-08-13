const db = require('../config/database');

class Comment {
    static async create(commentData) {
        try {
            const { post_id, user_id, content, parent_comment_id = null } = commentData;
            
            const query = `
                INSERT INTO comments (post_id, user_id, content, parent_comment_id)
                VALUES (?, ?, ?, ?)
            `;
            
            const [result] = await db.execute(query, [post_id, user_id, content, parent_comment_id]);
            return { comment_id: result.insertId };
        } catch (error) {
            throw new Error(`댓글 생성 실패: ${error.message}`);
        }
    }

    static async findByPostId(postId, options = {}) {
        try {
            const { page = 1, limit = 20 } = options;
            const offset = (page - 1) * limit;
            
            const query = `
                SELECT 
                    c.comment_id,
                    c.post_id,
                    c.user_id,
                    c.parent_comment_id,
                    c.content,
                    c.status,
                    c.created_at,
                    c.updated_at,
                    u.username,
                    u.nickname
                FROM comments c
                INNER JOIN users u ON c.user_id = u.user_id
                WHERE c.post_id = ? AND c.status = 'active'
                ORDER BY 
                    CASE WHEN c.parent_comment_id IS NULL THEN c.comment_id ELSE c.parent_comment_id END,
                    c.parent_comment_id IS NULL DESC,
                    c.created_at ASC
                LIMIT ? OFFSET ?
            `;
            
            const [comments] = await db.execute(query, [postId, parseInt(limit), parseInt(offset)]);
            
            const countQuery = `
                SELECT COUNT(*) as total
                FROM comments
                WHERE post_id = ? AND status = 'active'
            `;
            const [countResult] = await db.execute(countQuery, [postId]);
            const total = countResult[0].total;
            
            const organizedComments = this.organizeComments(comments);
            
            return {
                comments: organizedComments,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalCount: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            throw new Error(`댓글 목록 조회 실패: ${error.message}`);
        }
    }

    static organizeComments(comments) {
        const commentMap = {};
        const rootComments = [];
        
        comments.forEach(comment => {
            comment.replies = [];
            commentMap[comment.comment_id] = comment;
            
            if (comment.parent_comment_id === null) {
                rootComments.push(comment);
            }
        });
        
        comments.forEach(comment => {
            if (comment.parent_comment_id !== null) {
                const parentComment = commentMap[comment.parent_comment_id];
                if (parentComment) {
                    parentComment.replies.push(comment);
                }
            }
        });
        
        return rootComments;
    }

    static async findById(commentId) {
        try {
            const query = `
                SELECT 
                    c.comment_id,
                    c.post_id,
                    c.user_id,
                    c.parent_comment_id,
                    c.content,
                    c.status,
                    c.created_at,
                    c.updated_at,
                    u.username,
                    u.nickname
                FROM comments c
                INNER JOIN users u ON c.user_id = u.user_id
                WHERE c.comment_id = ? AND c.status = 'active'
            `;
            
            const [comments] = await db.execute(query, [commentId]);
            return comments[0] || null;
        } catch (error) {
            throw new Error(`댓글 조회 실패: ${error.message}`);
        }
    }

    static async update(commentId, userId, content) {
        try {
            const query = `
                UPDATE comments 
                SET content = ?, updated_at = CURRENT_TIMESTAMP
                WHERE comment_id = ? AND user_id = ? AND status = 'active'
            `;
            
            const [result] = await db.execute(query, [content, commentId, userId]);
            
            if (result.affectedRows === 0) {
                throw new Error('댓글을 찾을 수 없거나 수정 권한이 없습니다.');
            }
            
            return { success: true };
        } catch (error) {
            throw new Error(`댓글 수정 실패: ${error.message}`);
        }
    }

    static async delete(commentId, userId) {
        try {
            await db.execute('START TRANSACTION');
            
            const checkQuery = `
                SELECT comment_id FROM comments 
                WHERE comment_id = ? AND user_id = ? AND status = 'active'
            `;
            const [existingComment] = await db.execute(checkQuery, [commentId, userId]);
            
            if (existingComment.length === 0) {
                await db.execute('ROLLBACK');
                throw new Error('댓글을 찾을 수 없거나 삭제 권한이 없습니다.');
            }
            
            const deleteQuery = `
                UPDATE comments 
                SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
                WHERE comment_id = ? AND user_id = ?
            `;
            await db.execute(deleteQuery, [commentId, userId]);
            
            const deleteRepliesQuery = `
                UPDATE comments 
                SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
                WHERE parent_comment_id = ?
            `;
            await db.execute(deleteRepliesQuery, [commentId]);
            
            await db.execute('COMMIT');
            return { success: true };
        } catch (error) {
            await db.execute('ROLLBACK');
            throw new Error(`댓글 삭제 실패: ${error.message}`);
        }
    }

    static async getCommentCount(postId) {
        try {
            const query = `
                SELECT COUNT(*) as count
                FROM comments
                WHERE post_id = ? AND status = 'active'
            `;
            
            const [result] = await db.execute(query, [postId]);
            return result[0].count;
        } catch (error) {
            throw new Error(`댓글 수 조회 실패: ${error.message}`);
        }
    }

    static async getReplies(parentCommentId) {
        try {
            const query = `
                SELECT 
                    c.comment_id,
                    c.post_id,
                    c.user_id,
                    c.parent_comment_id,
                    c.content,
                    c.created_at,
                    c.updated_at,
                    u.username,
                    u.nickname
                FROM comments c
                INNER JOIN users u ON c.user_id = u.user_id
                WHERE c.parent_comment_id = ? AND c.status = 'active'
                ORDER BY c.created_at ASC
            `;
            
            const [replies] = await db.execute(query, [parentCommentId]);
            return replies;
        } catch (error) {
            throw new Error(`대댓글 조회 실패: ${error.message}`);
        }
    }
}

module.exports = Comment;