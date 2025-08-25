const User = require('../models/User');
const jwtUtils = require('../utils/jwt');
const hashUtils = require('../utils/hash');
const mockDB = require('../utils/mockDatabase');

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
            console.log('🔍 register 함수 입력 데이터:', { username, email, password: password ? '***' : undefined, nickname, gender, phone_number });

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
                gender: gender || null,
                phone_number: phone_number || null
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
                        gender: newUser.gender,
                        phone_number: newUser.phone_number,
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
            
            // username 중복 에러 처리
            if (error.message === '이미 존재하는 사용자명입니다.') {
                return res.status(409).json({
                    success: false,
                    message: error.message,
                    errors: { username: '이미 사용 중인 사용자명입니다.' }
                });
            }
            
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

            // email로 사용자 검색
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
                    message: '사용자명 또는 비밀번호가 올바르지 않습니다.',
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
                        gender: user.gender,
                        phone_number: user.phone_number,
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

    // === Mock API (프론트엔드 호환용) ===

    /**
     * Mock 로그인 API (프론트엔드 완전 호환)
     * POST /api/login
     * Body: { username, password } - username은 실제로는 email도 허용
     */
    mockLogin: async (req, res) => {
        try {
            const { username, password } = req.body;

            // 필수 입력값 검증
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'username과 password는 필수 입력값입니다.',
                    errors: {
                        username: !username ? 'username이 필요합니다.' : null,
                        password: !password ? 'password가 필요합니다.' : null
                    }
                });
            }

            // username 또는 email로 사용자 검색 (Mock DB)
            const user = await mockDB.findByUsernameOrEmail(username);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: '사용자명 또는 비밀번호가 올바르지 않습니다.',
                    errors: { auth: '로그인 정보를 확인해주세요.' }
                });
            }

            // 비밀번호 검증
            const isValidPassword = await hashUtils.comparePassword(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: '사용자명 또는 비밀번호가 올바르지 않습니다.',
                    errors: { auth: '로그인 정보를 확인해주세요.' }
                });
            }

            // 로그인 시간 업데이트
            await mockDB.updateLastLogin(user.user_id);

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
                        gender: user.gender,
                        phone_number: user.phone_number
                    },
                    tokens: {
                        accessToken,
                        refreshToken
                    }
                }
            });

        } catch (error) {
            console.error('Mock Login error:', error);
            res.status(500).json({
                success: false,
                message: '로그인 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    /**
     * Mock 회원가입 API (프론트엔드 호환용)
     * POST /api/register  
     * Body: { username, email?, password, nickname?, phone_number? }
     */
    mockRegister: async (req, res) => {
        try {
            const { username, email, password, nickname, gender, phone_number } = req.body;

            // 필수 입력값 검증
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'username과 password는 필수 입력값입니다.',
                    errors: {
                        username: !username ? 'username이 필요합니다.' : null,
                        password: !password ? 'password가 필요합니다.' : null
                    }
                });
            }

            // email이 없으면 username을 email로 사용 (임시 처리)
            const userEmail = email || `${username}@mock.com`;

            // 이메일 형식 검증 (email이 제공된 경우만)
            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return res.status(400).json({
                        success: false,
                        message: '올바른 이메일 형식이 아닙니다.',
                        errors: { email: '유효한 이메일 주소를 입력해주세요.' }
                    });
                }
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

            // 사용자 생성 (Mock DB)
            const userData = {
                username,
                email: userEmail,
                password_hash: hashedPassword,
                nickname: nickname || username,
                gender: gender || null,
                phone_number: phone_number || null
            };

            const newUser = await mockDB.createUser(userData);

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
                        gender: newUser.gender,
                        phone_number: newUser.phone_number
                    },
                    tokens: {
                        accessToken,
                        refreshToken
                    }
                }
            });

        } catch (error) {
            console.error('Mock Register error:', error);
            
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
     * 아이디 중복 체크 API
     * POST /api/users/auth/check-username
     * Body: { username }
     */
    checkUsername: async (req, res) => {
        try {
            const { username } = req.body;

            if (!username) {
                return res.status(400).json({
                    success: false,
                    message: 'username이 필요합니다.',
                    errors: { username: 'username을 입력해주세요.' }
                });
            }

            const exists = await User.checkUsernameExists(username);
            
            if (exists) {
                return res.status(409).json({
                    success: false,
                    message: '이미 사용 중인 아이디입니다.',
                    available: false
                });
            } else {
                return res.json({
                    success: true,
                    message: '사용 가능한 아이디입니다.',
                    available: true
                });
            }

        } catch (error) {
            console.error('Username check error:', error);
            res.status(500).json({
                success: false,
                message: '아이디 중복 체크 중 오류가 발생했습니다.',
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
    },

    /**
     * 사용자 프로필 수정 (인증 필수)
     * PUT /api/users/profile
     * Headers: Authorization: Bearer <token>
     * Body: { nickname?, phone_number?, gender? }
     */
    updateUserProfile: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const { nickname, phone_number, gender } = req.body;

            // 수정 가능한 필드만 필터링
            const updateData = {};
            if (nickname !== undefined) updateData.nickname = nickname;
            if (phone_number !== undefined) updateData.phone_number = phone_number;
            if (gender !== undefined) updateData.gender = gender;

            // 최소한 하나의 필드는 있어야 함
            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '수정할 정보가 없습니다.',
                    errors: { general: '닉네임, 연락처, 성별 중 하나 이상을 입력해주세요.' }
                });
            }

            // 닉네임 길이 검증
            if (nickname && (nickname.length < 2 || nickname.length > 20)) {
                return res.status(400).json({
                    success: false,
                    message: '닉네임은 2~20자 사이여야 합니다.',
                    errors: { nickname: '닉네임은 2~20자 사이여야 합니다.' }
                });
            }

            // 연락처 형식 검증
            if (phone_number && !/^010-\d{4}-\d{4}$/.test(phone_number)) {
                return res.status(400).json({
                    success: false,
                    message: '연락처 형식이 올바르지 않습니다.',
                    errors: { phone_number: '010-1234-5678 형식으로 입력해주세요.' }
                });
            }

            // 성별 값 검증
            if (gender && !['male', 'female', 'other'].includes(gender)) {
                return res.status(400).json({
                    success: false,
                    message: '올바르지 않은 성별 값입니다.',
                    errors: { gender: '성별은 male, female, other 중 하나여야 합니다.' }
                });
            }

            // 사용자 정보 업데이트
            const updatedUser = await User.updateProfile(userId, updateData);

            res.json({
                success: true,
                message: '프로필이 성공적으로 수정되었습니다.',
                data: {
                    profile: {
                        id: updatedUser.user_id,
                        username: updatedUser.username,
                        email: updatedUser.email,
                        nickname: updatedUser.nickname,
                        gender: updatedUser.gender,
                        phone_number: updatedUser.phone_number,
                        updated_at: updatedUser.updated_at
                    }
                }
            });

        } catch (error) {
            console.error('Update user profile error:', error);
            res.status(500).json({
                success: false,
                message: '프로필 수정 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    /**
     * 회원탈퇴 (인증 필수)
     * DELETE /api/users/account
     * Headers: Authorization: Bearer <token>
     * Body: { password }
     */
    deleteAccount: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const { password } = req.body;

            // 비밀번호 확인 필수
            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: '비밀번호 확인이 필요합니다.',
                    errors: { password: '현재 비밀번호를 입력해주세요.' }
                });
            }

            // 사용자 정보 조회
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
            }

            // 비밀번호 검증
            const isValidPassword = await hashUtils.comparePassword(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: '비밀번호가 올바르지 않습니다.',
                    errors: { password: '현재 비밀번호를 정확히 입력해주세요.' }
                });
            }

            // 회원탈퇴 처리
            await User.deleteAccount(userId);

            res.json({
                success: true,
                message: '회원탈퇴가 완료되었습니다.',
                data: {
                    deletedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({
                success: false,
                message: '회원탈퇴 처리 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    /**
     * 사용자 등록 이미지 조회
     * GET /api/users/:userId/images
     */
    getUserImages: async (req, res) => {
        try {
            const { userId } = req.params;
            
            // Mock Database에서 사용자 이미지 조회
            const mockDB = require('../utils/mockDatabase');
            const images = await mockDB.getUserImages(userId);

            res.json({
                success: true,
                message: '사용자 이미지 조회 성공',
                data: images
            });

        } catch (error) {
            console.error('Get user images error:', error);
            res.status(500).json({
                success: false,
                message: '사용자 이미지 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    /**
     * 사용자 이미지 추가
     * POST /api/users/:userId/images
     * Body: { image_url }
     */
    addUserImage: async (req, res) => {
        try {
            const { userId } = req.params;
            const { image_url } = req.body;

            if (!image_url) {
                return res.status(400).json({
                    success: false,
                    message: 'image_url이 필요합니다.'
                });
            }

            // Mock Database에 이미지 추가
            const mockDB = require('../utils/mockDatabase');
            const newImage = await mockDB.addUserImage(userId, image_url);

            res.json({
                success: true,
                message: '사용자 이미지 추가 성공',
                data: {
                    image_id: newImage.image_id,
                    user_id: newImage.user_id,
                    image_url: newImage.image_url,
                    uploaded_at: newImage.uploaded_at
                }
            });

        } catch (error) {
            console.error('Add user image error:', error);
            res.status(500).json({
                success: false,
                message: '사용자 이미지 추가 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
};

module.exports = userController;