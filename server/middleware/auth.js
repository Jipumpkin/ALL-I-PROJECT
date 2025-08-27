const jwtUtils = require('../utils/jwt');
const { User } = require('../models');
const { initializeDatabase } = require('../config/database');

/**
 * JWT 토큰 인증 미들웨어
 * Authorization 헤더의 Bearer 토큰을 검증하고 사용자 정보를 req.user에 추가
 */
const authMiddleware = async (req, res, next) => {
    try {
        // 1. Authorization 헤더에서 토큰 추출
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: '접근 권한이 없습니다. 토큰이 필요합니다.',
                error: 'NO_TOKEN'
            });
        }

        // Bearer 토큰 형식 확인 및 추출
        const tokenParts = authHeader.split(' ');
        if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
            return res.status(401).json({
                success: false,
                message: '토큰 형식이 올바르지 않습니다. Bearer 토큰을 사용해주세요.',
                error: 'INVALID_TOKEN_FORMAT'
            });
        }

        const token = tokenParts[1];

        // 2. JWT 토큰 검증
        let decoded;
        try {
            decoded = jwtUtils.verifyToken(token);
        } catch (error) {
            // jwtUtils에서 던진 에러 메시지 활용
            let errorCode = 'INVALID_TOKEN';
            if (error.message.includes('만료')) {
                errorCode = 'TOKEN_EXPIRED';
            } else if (error.message.includes('유효하지 않은')) {
                errorCode = 'INVALID_TOKEN';
            }

            return res.status(401).json({
                success: false,
                message: error.message,
                error: errorCode
            });
        }

        // 3. 토큰에서 사용자 ID 추출 및 사용자 정보 조회
        const userId = decoded.userId || decoded.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: '토큰에 사용자 정보가 없습니다.',
                error: 'INVALID_TOKEN_PAYLOAD'
            });
        }

        // 데이터베이스 초기화 확인
        await initializeDatabase();
        
        // 데이터베이스에서 사용자 확인
        console.log('🔍 Auth middleware - Looking for user with ID:', userId);
        const user = await User.findByPk(userId);
        console.log('🔍 Auth middleware - Found user:', user ? 'YES' : 'NO');
        if (!user) {
            console.log('🔍 Auth middleware - User not found in database');
            return res.status(404).json({
                success: false,
                message: '존재하지 않는 사용자입니다.',
                error: 'User not found'
            });
        }

        // 4. req.user에 사용자 정보 추가 (비밀번호 제외)
        const userData = user.dataValues || user;
        const { password_hash, ...userWithoutPassword } = userData;
        req.user = { ...userWithoutPassword, userId: userData.user_id || userData.id };
        req.token = token;

        next();

    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: '인증 처리 중 서버 오류가 발생했습니다.',
            error: 'INTERNAL_SERVER_ERROR'
        });
    }
};

/**
 * 옵셔널 인증 미들웨어
 * 토큰이 있으면 인증하고, 없어도 다음 미들웨어로 진행
 * 공개 API에서 로그인 상태에 따라 다른 응답을 제공할 때 사용
 */
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        // 토큰이 없으면 그냥 다음으로 진행
        if (!authHeader) {
            req.user = null;
            return next();
        }

        // 토큰이 있으면 검증 시도
        const tokenParts = authHeader.split(' ');
        if (tokenParts.length === 2 && tokenParts[0] === 'Bearer') {
            const token = tokenParts[1];
            
            try {
                const decoded = jwtUtils.verifyToken(token);
                const userId = decoded.userId || decoded.id;
                
                if (userId) {
                    const user = await User.findByPk(userId);
                    if (user) {
                        const userData = user.dataValues || user;
                        const { password_hash, ...userWithoutPassword } = userData;
                        req.user = { ...userWithoutPassword, userId: userData.user_id || userData.id };
                        req.token = token;
                    }
                }
            } catch (error) {
                // 토큰 오류가 있어도 그냥 진행 (옵셔널이므로)
                req.user = null;
            }
        } else {
            req.user = null;
        }

        next();

    } catch (error) {
        console.error('Optional auth middleware error:', error);
        req.user = null;
        next();
    }
};

/**
 * 관리자 권한 확인 미들웨어
 * authMiddleware 이후에 사용해야 함
 */
const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: '인증이 필요합니다.',
            error: 'NO_AUTH'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: '관리자 권한이 필요합니다.',
            error: 'INSUFFICIENT_PERMISSIONS'
        });
    }

    next();
};

module.exports = {
    authMiddleware,
    optionalAuthMiddleware,
    adminMiddleware
};