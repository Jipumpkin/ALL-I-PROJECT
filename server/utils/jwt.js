const jwt = require('jsonwebtoken');

// JWT Secret 보안 검증 - 프로덕션에서 기본값 사용 방지
if (!process.env.JWT_SECRET) {
    console.error('🚨 JWT_SECRET 환경변수가 설정되지 않았습니다!');
    console.error('보안을 위해 강력한 JWT_SECRET을 설정해주세요.');
    if (process.env.NODE_ENV === 'production') {
        console.error('프로덕션 환경에서는 JWT_SECRET이 필수입니다.');
        process.exit(1);
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const jwtUtils = {
    generateAccessToken: (payload) => {
        return jwt.sign(payload, JWT_SECRET, { 
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'all-i-project'
        });
    },

    generateRefreshToken: (payload) => {
        return jwt.sign(payload, JWT_SECRET, { 
            expiresIn: JWT_REFRESH_EXPIRES_IN,
            issuer: 'all-i-project'
        });
    },

    verifyToken: (token) => {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('토큰이 만료되었습니다');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('유효하지 않은 토큰입니다');
            } else {
                throw new Error('토큰 검증 중 오류가 발생했습니다');
            }
        }
    },

    decodeToken: (token) => {
        try {
            return jwt.decode(token, { complete: true });
        } catch (error) {
            throw new Error('토큰 디코딩에 실패했습니다');
        }
    }
};

module.exports = jwtUtils;