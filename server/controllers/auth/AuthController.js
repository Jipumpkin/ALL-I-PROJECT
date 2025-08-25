const UserService = require('../../services/userService');
const ResponseFormatter = require('../../utils/responseFormatter');

const AuthController = {
    /**
     * 회원가입
     * POST /api/users/auth/register
     */
    register: async (req, res) => {
        try {
            console.log('🔍 register 함수 입력 데이터:', { ...req.body, password: '***' });

            const result = await UserService.registerUser(req.body);

            res.status(201).json({
                success: true,
                message: '회원가입이 성공적으로 완료되었습니다.',
                ...result
            });

        } catch (error) {
            console.error('Register error:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                sql: error.sql,
                stack: error.stack
            });
            
            // Sequelize 유니크 제약조건 에러 처리
            if (error.name === 'SequelizeUniqueConstraintError') {
                const field = error.errors[0].path;
                if (field === 'email') {
                    return res.status(409).json({
                        success: false,
                        message: '이미 사용 중인 이메일입니다.',
                        errors: { email: '다른 이메일 주소를 사용해주세요.' }
                    });
                } else if (field === 'username') {
                    return res.status(409).json({
                        success: false,
                        message: '이미 사용 중인 사용자명입니다.',
                        errors: { username: '다른 사용자명을 선택해주세요.' }
                    });
                }
            }
            
            // MySQL 중복 에러 처리 (레거시)
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: '이미 사용 중인 이메일입니다.',
                    errors: { email: '다른 이메일 주소를 사용해주세요.' }
                });
            }

            // Sequelize 검증 에러 처리
            if (error.name === 'SequelizeValidationError') {
                const errors = {};
                error.errors.forEach(err => {
                    errors[err.path] = err.message;
                });
                return res.status(400).json({
                    success: false,
                    message: '입력 데이터가 올바르지 않습니다.',
                    errors
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
     * 로그인
     * POST /api/users/auth/login
     */
    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            console.log('🔍 login 함수 입력 데이터:', { username, password: '***' });

            const result = await UserService.loginUser(username, password);

            console.log('✅ 로그인 성공:', { userId: result.user.id, username: result.user.username });

            res.json({
                success: true,
                message: '로그인이 성공적으로 완료되었습니다.',
                ...result
            });

        } catch (error) {
            console.error('Login error:', error);
            
            if (error.message === 'INVALID_CREDENTIALS') {
                return res.status(401).json({
                    success: false,
                    message: '사용자명 또는 비밀번호가 올바르지 않습니다.',
                    errors: { auth: '로그인 정보를 확인해주세요.' }
                });
            }

            res.status(500).json({
                success: false,
                message: '로그인 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    /**
     * 사용자명 중복 확인
     * POST /api/users/auth/check-username
     */
    checkUsername: async (req, res) => {
        try {
            const { username } = req.body;

            const isAvailable = await UserService.checkUsernameAvailability(username);

            if (!isAvailable) {
                return res.json({
                    success: true,
                    available: false,
                    message: '이미 사용 중인 사용자명입니다.',
                    errors: { username: '다른 사용자명을 선택해주세요.' }
                });
            }

            res.json({
                success: true,
                available: true,
                message: '사용 가능한 사용자명입니다.'
            });

        } catch (error) {
            console.error('Check username error:', error);
            res.status(500).json({
                success: false,
                message: '사용자명 확인 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    /**
     * 아이디 찾기 (닉네임 또는 이메일로 찾기)
     * POST /api/users/auth/find-id
     */
    findId: async (req, res) => {
        try {
            const { searchType, searchValue, name, phone } = req.body;
            console.log('🔍 findId 함수 입력 데이터:', { searchType, searchValue, name, phone: phone ? '***' : undefined });

            // searchType에 따라 다른 검색 로직 실행
            let result;
            if (searchType === 'email') {
                result = await UserService.findIdByEmail(searchValue, name, phone);
            } else if (searchType === 'nickname') {
                result = await UserService.findIdByNickname(searchValue, name, phone);
            } else {
                return res.status(400).json({
                    success: false,
                    message: '잘못된 검색 유형입니다.'
                });
            }

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: '일치하는 사용자 정보를 찾을 수 없습니다.'
                });
            }

            res.json({
                success: true,
                message: '아이디를 찾았습니다.',
                data: {
                    username: result.username,
                    email: result.email.substring(0, 3) + '***@' + result.email.split('@')[1]
                }
            });

        } catch (error) {
            console.error('Find ID error:', error);
            res.status(500).json({
                success: false,
                message: '아이디 찾기 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
};

module.exports = AuthController;