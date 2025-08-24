const UserService = require('../../services/userService');

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
            
            // 이메일 중복 에러 처리
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: '이미 사용 중인 이메일입니다.',
                    errors: { email: '다른 이메일 주소를 사용해주세요.' }
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
                    success: false,
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
    }
};

module.exports = AuthController;