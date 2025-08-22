const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
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