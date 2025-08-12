const User = require('../models/User');
const jwtUtils = require('../utils/jwt');

const userController = {
    getAllUsers: async (req, res) => {
        try {
            const users = await User.findAll();
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getUserById: async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createUser: async (req, res) => {
        try {
            const newUser = await User.create(req.body);
            res.status(201).json(newUser);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updateUser: async (req, res) => {
        try {
            const updatedUser = await User.update(req.params.id, req.body);
            res.json(updatedUser);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    deleteUser: async (req, res) => {
        try {
            await User.delete(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // === 미들웨어 테스트용 임시 함수들 ===
    
    /**
     * JWT 토큰 생성 테스트 (실제 로그인 구현 전까지 임시)
     * POST /api/users/test/generate-token
     * Body: { userId: number }
     */
    generateTestToken: async (req, res) => {
        try {
            const { userId } = req.body;
            
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'userId가 필요합니다.'
                });
            }

            // 사용자 존재 확인
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '존재하지 않는 사용자입니다.'
                });
            }

            // JWT 토큰 생성
            const payload = {
                userId: user.user_id,
                email: user.email,
                username: user.username
            };

            const accessToken = jwtUtils.generateAccessToken(payload);
            const refreshToken = jwtUtils.generateRefreshToken(payload);

            res.json({
                success: true,
                message: '테스트 토큰이 생성되었습니다.',
                data: {
                    user: {
                        id: user.user_id,
                        username: user.username,
                        email: user.email
                    },
                    tokens: {
                        accessToken,
                        refreshToken
                    }
                }
            });

        } catch (error) {
            console.error('Generate test token error:', error);
            res.status(500).json({
                success: false,
                message: '토큰 생성 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    /**
     * 보호된 라우트 테스트 (인증 필수)
     * GET /api/users/test/protected
     * Headers: Authorization: Bearer <token>
     */
    testProtectedRoute: async (req, res) => {
        try {
            res.json({
                success: true,
                message: '인증된 사용자만 접근 가능한 보호된 라우트입니다.',
                data: {
                    authenticatedUser: req.user,
                    timestamp: new Date().toISOString(),
                    requestInfo: {
                        method: req.method,
                        path: req.path,
                        userAgent: req.get('User-Agent')
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    /**
     * 옵셔널 인증 테스트 (토큰 있으면 인증, 없어도 접근 가능)
     * GET /api/users/test/optional-auth
     * Headers: Authorization: Bearer <token> (선택사항)
     */
    testOptionalAuth: async (req, res) => {
        try {
            const isAuthenticated = !!req.user;
            
            res.json({
                success: true,
                message: '누구나 접근 가능한 라우트입니다.',
                data: {
                    isAuthenticated,
                    user: req.user || null,
                    publicInfo: {
                        timestamp: new Date().toISOString(),
                        message: isAuthenticated 
                            ? `안녕하세요, ${req.user.username}님!` 
                            : '로그인하면 개인화된 정보를 볼 수 있습니다.'
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    /**
     * 사용자 프로필 조회 (인증 필수)
     * GET /api/users/profile
     * Headers: Authorization: Bearer <token>
     */
    getUserProfile: async (req, res) => {
        try {
            // authMiddleware에서 이미 req.user에 사용자 정보가 설정됨
            const user = req.user;
            
            res.json({
                success: true,
                message: '사용자 프로필 조회 성공',
                data: {
                    profile: {
                        id: user.user_id,
                        username: user.username,
                        email: user.email,
                        nickname: user.nickname,
                        gender: user.gender,
                        phone_number: user.phone_number,
                        created_at: user.created_at,
                        updated_at: user.updated_at
                    }
                }
            });
        } catch (error) {
            console.error('Get user profile error:', error);
            res.status(500).json({
                success: false,
                message: '프로필 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
};

module.exports = userController;