const jwtUtils = require('../../utils/jwt');

const TestController = {
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
                    message: 'userId가 필요합니다.',
                    errors: { userId: 'userId를 제공해주세요.' }
                });
            }

            // 테스트용 payload
            const payload = {
                userId: userId,
                email: `test${userId}@test.com`,
                username: `testuser${userId}`
            };

            const accessToken = jwtUtils.generateAccessToken(payload);
            const refreshToken = jwtUtils.generateRefreshToken(payload);

            res.json({
                success: true,
                message: '테스트 토큰이 생성되었습니다.',
                tokens: {
                    accessToken,
                    refreshToken
                },
                payload
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
            // authMiddleware를 통과했으므로 req.user에 정보가 있음
            const user = req.user;

            res.json({
                success: true,
                message: '보호된 라우트 접근 성공!',
                user: {
                    id: user.userId || user.user_id,
                    email: user.email,
                    username: user.username
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Test protected route error:', error);
            res.status(500).json({
                success: false,
                message: '보호된 라우트 테스트 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    /**
     * 옵셔널 인증 테스트 (인증 선택사항)
     * GET /api/users/test/optional-auth
     * Headers: Authorization: Bearer <token> (선택사항)
     */
    testOptionalAuth: async (req, res) => {
        try {
            // optionalAuthMiddleware를 통과했으므로 req.user가 있을 수도 없을 수도 있음
            const user = req.user;

            if (user) {
                res.json({
                    success: true,
                    message: '인증된 사용자로 접근했습니다.',
                    user: {
                        id: user.userId || user.user_id,
                        email: user.email,
                        username: user.username
                    },
                    authenticated: true,
                    timestamp: new Date().toISOString()
                });
            } else {
                res.json({
                    success: true,
                    message: '인증되지 않은 사용자로 접근했습니다.',
                    authenticated: false,
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            console.error('Test optional auth error:', error);
            res.status(500).json({
                success: false,
                message: '옵셔널 인증 테스트 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
};

module.exports = TestController;