const db = require('../config/database');

class Post {
    static async create(postData) {
        try {
            const { user_id, title, content, image_url = null, category = 'general' } = postData;
            
            const query = `
                INSERT INTO posts (user_id, title, content, image_url, category)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const [result] = await db.execute(query, [user_id, title, content, image_url, category]);
            return { post_id: result.insertId };
        } catch (error) {
            throw new Error(`게시글 생성 실패: ${error.message}`);
        }
    }

    static async findAll(options = {}) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                category = null, 
                search = null,
                sortBy = 'created_at',
                sortOrder = 'DESC'
            } = options;
            
            const offset = (page - 1) * limit;
            
            let whereClause = "WHERE p.status = 'active'";
            let queryParams = [];
            
            if (category) {
                whereClause += " AND p.category = ?";
                queryParams.push(category);
            }
            
            if (search) {
                whereClause += " AND (p.title LIKE ? OR p.content LIKE ?)";
                queryParams.push(`%${search}%`, `%${search}%`);
            }
            
            const query = `
                SELECT 
                    p.post_id,
                    p.title,
                    p.content,
                    p.image_url,
                    p.category,
                    p.view_count,
                    p.like_count,
                    p.created_at,
                    p.updated_at,
                    u.username,
                    u.nickname
                FROM posts p
                INNER JOIN users u ON p.user_id = u.user_id
                ${whereClause}
                ORDER BY p.${sortBy} ${sortOrder}
                LIMIT ? OFFSET ?
            `;
            
            queryParams.push(parseInt(limit), parseInt(offset));
            
            const [posts] = await db.execute(query, queryParams);
            
            const countQuery = `
                SELECT COUNT(*) as total
                FROM posts p
                ${whereClause.replace('p.created_at DESC', '').replace('ORDER BY', '').replace('LIMIT ? OFFSET ?', '')}
            `;
            
            const [countResult] = await db.execute(countQuery, queryParams.slice(0, -2));
            const total = countResult[0].total;
            
            return {
                posts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalCount: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            throw new Error(`게시글 목록 조회 실패: ${error.message}`);
        }
    }

    static async findById(postId) {
        try {
            const query = `
                SELECT 
                    p.post_id,
                    p.user_id,
                    p.title,
                    p.content,
                    p.image_url,
                    p.category,
                    p.view_count,
                    p.like_count,
                    p.created_at,
                    p.updated_at,
                    u.username,
                    u.nickname
                FROM posts p
                INNER JOIN users u ON p.user_id = u.user_id
                WHERE p.post_id = ? AND p.status = 'active'
            `;
            
            const [posts] = await db.execute(query, [postId]);
            return posts[0] || null;
        } catch (error) {
            throw new Error(`게시글 조회 실패: ${error.message}`);
        }
    }

    static async update(postId, userId, updateData) {
        try {
            const { title, content, image_url, category } = updateData;
            
            const query = `
                UPDATE posts 
                SET title = ?, content = ?, image_url = ?, category = ?, updated_at = CURRENT_TIMESTAMP
                WHERE post_id = ? AND user_id = ? AND status = 'active'
            `;
            
            const [result] = await db.execute(query, [title, content, image_url, category, postId, userId]);
            
            if (result.affectedRows === 0) {
                throw new Error('게시글을 찾을 수 없거나 수정 권한이 없습니다.');
            }
            
            return { success: true };
        } catch (error) {
            throw new Error(`게시글 수정 실패: ${error.message}`);
        }
    }

    static async delete(postId, userId) {
        try {
            const query = `
                UPDATE posts 
                SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
                WHERE post_id = ? AND user_id = ? AND status = 'active'
            `;
            
            const [result] = await db.execute(query, [postId, userId]);
            
            if (result.affectedRows === 0) {
                throw new Error('게시글을 찾을 수 없거나 삭제 권한이 없습니다.');
            }
            
            return { success: true };
        } catch (error) {
            throw new Error(`게시글 삭제 실패: ${error.message}`);
        }
    }

    static async incrementViewCount(postId) {
        try {
            const query = `
                UPDATE posts 
                SET view_count = view_count + 1 
                WHERE post_id = ? AND status = 'active'
            `;
            
            await db.execute(query, [postId]);
        } catch (error) {
            console.error('조회수 증가 실패:', error.message);
        }
    }

    static async toggleLike(postId, userId) {
        try {
            await db.execute('START TRANSACTION');
            
            const checkQuery = `
                SELECT like_id FROM post_likes 
                WHERE post_id = ? AND user_id = ?
            `;
            const [existingLike] = await db.execute(checkQuery, [postId, userId]);
            
            let isLiked = false;
            
            if (existingLike.length > 0) {
                const deleteLikeQuery = `
                    DELETE FROM post_likes 
                    WHERE post_id = ? AND user_id = ?
                `;
                await db.execute(deleteLikeQuery, [postId, userId]);
                
                const decrementQuery = `
                    UPDATE posts 
                    SET like_count = like_count - 1 
                    WHERE post_id = ?
                `;
                await db.execute(decrementQuery, [postId]);
                
                isLiked = false;
            } else {
                const insertLikeQuery = `
                    INSERT INTO post_likes (post_id, user_id) 
                    VALUES (?, ?)
                `;
                await db.execute(insertLikeQuery, [postId, userId]);
                
                const incrementQuery = `
                    UPDATE posts 
                    SET like_count = like_count + 1 
                    WHERE post_id = ?
                `;
                await db.execute(incrementQuery, [postId]);
                
                isLiked = true;
            }
            
            await db.execute('COMMIT');
            
            const [updatedPost] = await db.execute(
                'SELECT like_count FROM posts WHERE post_id = ?',
                [postId]
            );
            
            return {
                isLiked,
                likeCount: updatedPost[0].like_count
            };
        } catch (error) {
            await db.execute('ROLLBACK');
            throw new Error(`좋아요 처리 실패: ${error.message}`);
        }
    }
}

module.exports = Post;