const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../config/constants');

/**
 * 일반 API 요청에 대한 Rate Limiting
 */
const apiLimiter = rateLimit({
    windowMs: RATE_LIMIT.WINDOW_MS,
    max: RATE_LIMIT.MAX_REQUESTS,
    message: {
        success: false,
        message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
        errorCode: 'RATE_LIMITED',
        retryAfter: Math.ceil(RATE_LIMIT.WINDOW_MS / 1000)
    },
    standardHeaders: true, // `RateLimit-*` 헤더 반환
    legacyHeaders: false, // `X-RateLimit-*` 헤더 비활성화
    // IP 기반 제한
    keyGenerator: (req) => req.ip,
    // 요청 성공 여부에 관계없이 카운트
    skipSuccessfulRequests: false,
    skipFailedRequests: false
});

/**
 * 인증 관련 API에 대한 엄격한 Rate Limiting
 */
const authLimiter = rateLimit({
    windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
    max: RATE_LIMIT.AUTH_MAX_REQUESTS,
    message: {
        success: false,
        message: '로그인 시도가 너무 많습니다. 15분 후에 다시 시도해주세요.',
        errorCode: 'AUTH_RATE_LIMITED',
        retryAfter: Math.ceil(RATE_LIMIT.AUTH_WINDOW_MS / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
    // 실패한 로그인만 카운트 (선택적)
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
    // 사용자 정의 스킵 조건
    skip: (req) => {
        // 특정 IP나 환경에서는 제한 해제 (개발 환경 등)
        if (process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1') {
            return true;
        }
        return false;
    }
});

/**
 * 비밀번호 재설정과 같은 중요한 작업에 대한 매우 엄격한 Rate Limiting
 */
const sensitiveActionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1시간
    max: 3, // 시간당 3회만 허용
    message: {
        success: false,
        message: '중요한 작업에 대한 요청 한도를 초과했습니다. 1시간 후에 다시 시도해주세요.',
        errorCode: 'SENSITIVE_ACTION_RATE_LIMITED',
        retryAfter: 3600
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip
});

/**
 * 파일 업로드에 대한 Rate Limiting
 */
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 10, // 15분간 10개 파일만 업로드 허용
    message: {
        success: false,
        message: '파일 업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        errorCode: 'UPLOAD_RATE_LIMITED',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip
});

module.exports = {
    apiLimiter,
    authLimiter,
    sensitiveActionLimiter,
    uploadLimiter
};