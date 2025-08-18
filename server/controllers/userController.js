const User = require('../models/User');
const jwtUtils = require('../utils/jwt');
const hashUtils = require('../utils/hash');

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

    // === 인증 관련 API ===

    /**
     * 회원가입 API
     * POST /api/users/auth/register
     * Body: { username, email, password, nickname?, gender?, phone_number? }
     */
    register: async (req, res) => {
        try {
            const { username, email, password, nickname, gender, phone_number } = req.body;

            // 필수 입력값 검증
            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'username, email, password는 필수 입력값입니다.',
                    errors: {
                        username: !username ? 'username이 필요합니다.' : null,
                        email: !email ? 'email이 필요합니다.' : null,
                        password: !password ? 'password가 필요합니다.' : null
                    }
                });
            }

            // 이메일 형식 검증
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: '올바른 이메일 형식이 아닙니다.',
                    errors: { email: '유효한 이메일 주소를 입력해주세요.' }
                });
            }

            // 비밀번호 강도 검증
            if (!hashUtils.validatePassword(password)) {
                return res.status(400).json({
                    success: false,
                    message: '비밀번호가 보안 요구사항을 충족하지 않습니다.',
                    errors: { 
                        password: '비밀번호는 8자 이상, 영문자, 숫자, 특수문자를 포함해야 합니다.' 
                    }
                });
            }

            // 비밀번호 해싱
            const hashedPassword = await hashUtils.hashPassword(password);

            // 사용자 생성 (이메일 중복 체크 포함)
            const userData = {
                username,
                email,
                password_hash: hashedPassword,
                nickname: nickname || username,
                gender,
                phone_number
            };

            const newUser = await User.createWithValidation(userData);

            // JWT 토큰 생성
            const payload = {
                userId: newUser.user_id,
                email: newUser.email,
                username: newUser.username
            };

            const accessToken = jwtUtils.generateAccessToken(payload);
            const refreshToken = jwtUtils.generateRefreshToken(payload);

            res.status(201).json({
                success: true,
                message: '회원가입이 성공적으로 완료되었습니다.',
                data: {
                    user: {
                        id: newUser.user_id,
                        username: newUser.username,
                        email: newUser.email,
                        nickname: newUser.nickname,
                        created_at: newUser.created_at
                    },
                    tokens: {
                        accessToken,
                        refreshToken
                    }
                }
            });

        } catch (error) {
            console.error('Register error:', error);
            
            // 이메일 중복 에러 처리
            if (error.message === '이미 존재하는 이메일입니다.') {
                return res.status(409).json({
                    success: false,
                    message: error.message,
                    errors: { email: '이미 가입된 이메일 주소입니다.' }
                });
            }

            res.status(500).json({
                success: false,
                message: '회원가입 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    /**
     * 로그인 API
     * POST /api/users/auth/login
     * Body: { email, password }
     */
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // 필수 입력값 검증
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'email과 password는 필수 입력값입니다.',
                    errors: {
                        email: !email ? 'email이 필요합니다.' : null,
                        password: !password ? 'password가 필요합니다.' : null
                    }
                });
            }

            // 이메일로 사용자 검색
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: '이메일 또는 비밀번호가 올바르지 않습니다.',
                    errors: { auth: '로그인 정보를 확인해주세요.' }
                });
            }

            // 비밀번호 검증
            const isValidPassword = await hashUtils.comparePassword(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: '이메일 또는 비밀번호가 올바르지 않습니다.',
                    errors: { auth: '로그인 정보를 확인해주세요.' }
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
                message: '로그인이 성공적으로 완료되었습니다.',
                data: {
                    user: {
                        id: user.user_id,
                        username: user.username,
                        email: user.email,
                        nickname: user.nickname,
                        created_at: user.created_at
                    },
                    tokens: {
                        accessToken,
                        refreshToken
                    }
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: '로그인 중 오류가 발생했습니다.',
                error: error.message
            });
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