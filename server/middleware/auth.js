const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                error: '인증 토큰이 필요합니다.'
            });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const user = await User.findById(decoded.user_id);
        if (!user) {
            return res.status(401).json({
                error: '유효하지 않은 토큰입니다.'
            });
        }
        
        req.user = {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            nickname: user.nickname
        };
        
        next();
        
    } catch (error) {
        console.error('인증 오류:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: '유효하지 않은 토큰입니다.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: '토큰이 만료되었습니다.'
            });
        }
        
        res.status(500).json({
            error: '인증 처리 중 오류가 발생했습니다.'
        });
    }
};

const generateToken = (user) => {
    return jwt.sign(
        {
            user_id: user.user_id,
            username: user.username,
            email: user.email
        },
        JWT_SECRET,
        {
            expiresIn: '7d'
        }
    );
};

const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            req.user = null;
            return next();
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.user_id);
        
        if (user) {
            req.user = {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                nickname: user.nickname
            };
        } else {
            req.user = null;
        }
        
        next();
        
    } catch (error) {
        req.user = null;
        next();
    }
};

module.exports = auth;
module.exports.generateToken = generateToken;
module.exports.optionalAuth = optionalAuth;