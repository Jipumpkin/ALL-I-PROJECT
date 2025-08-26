/**
 * 애플리케이션 상수 정의
 * 하드코딩된 값들을 중앙화하여 관리
 */

module.exports = {
    // 암호화 관련
    SECURITY: {
        SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS) || 12
    },

    // JWT 관련
    JWT: {
        ACCESS_TOKEN_EXPIRES: process.env.JWT_EXPIRES_IN || '24h',
        REFRESH_TOKEN_EXPIRES: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        ISSUER: 'all-i-project'
    },

    // 데이터베이스 관련
    DATABASE: {
        CONNECTION_TIMEOUT: parseInt(process.env.DB_TIMEOUT) || 5000,
        CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
        CHARSET: 'utf8mb4',
        TIMEZONE: '+09:00' // KST
    },

    // API 관련
    API: {
        DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE) || 12,
        MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE) || 100,
        REQUEST_SIZE_LIMIT: process.env.REQUEST_SIZE_LIMIT || '10mb'
    },

    // 파일 업로드 관련
    UPLOAD: {
        MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads'
    },

    // 외부 API 관련
    EXTERNAL_API: {
        ANIMAL_API_TIMEOUT: parseInt(process.env.ANIMAL_API_TIMEOUT) || 10000,
        RETRY_ATTEMPTS: parseInt(process.env.API_RETRY_ATTEMPTS) || 3,
        RETRY_DELAY: parseInt(process.env.API_RETRY_DELAY) || 1000
    },

    // 로깅 관련
    LOGGING: {
        LEVEL: process.env.LOG_LEVEL || 'info',
        MAX_FILES: parseInt(process.env.LOG_MAX_FILES) || 5,
        MAX_SIZE: process.env.LOG_MAX_SIZE || '10m'
    },

    // 캐싱 관련
    CACHE: {
        TTL_SHORT: parseInt(process.env.CACHE_TTL_SHORT) || 300,    // 5분
        TTL_MEDIUM: parseInt(process.env.CACHE_TTL_MEDIUM) || 1800, // 30분
        TTL_LONG: parseInt(process.env.CACHE_TTL_LONG) || 3600     // 1시간
    },

    // Rate Limiting 관련
    RATE_LIMIT: {
        WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15분
        MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        AUTH_WINDOW_MS: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15분
        AUTH_MAX_REQUESTS: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10 // 인증 요청은 더 엄격하게
    },

    // 유효성 검증 관련
    VALIDATION: {
        USERNAME_MIN_LENGTH: 3,
        USERNAME_MAX_LENGTH: 20,
        NICKNAME_MIN_LENGTH: 2,
        NICKNAME_MAX_LENGTH: 20,
        PASSWORD_MIN_LENGTH: 8,
<<<<<<< HEAD
        PASSWORD_REGEX: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
=======
>>>>>>> dev
        PHONE_REGEX: /^010-\d{4}-\d{4}$/,
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PASSWORD_REGEX: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    },

    // HTTP 상태 코드
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        VALIDATION_ERROR: 422,
        RATE_LIMITED: 429,
        INTERNAL_ERROR: 500
    }
};