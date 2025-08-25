/**
 * API 응답 형식 통일화 유틸리티
 */

const ResponseFormatter = {
    /**
     * 성공 응답 형식
     * @param {Object} res - Express response object
     * @param {Object} data - 응답 데이터
     * @param {string} message - 성공 메시지
     * @param {number} statusCode - HTTP 상태 코드 (기본값: 200)
     */
    success: (res, data = null, message = '요청이 성공적으로 처리되었습니다.', statusCode = 200) => {
        const response = {
            success: true,
            message,
            timestamp: new Date().toISOString(),
            ...(data && { data })
        };
        
        return res.status(statusCode).json(response);
    },

    /**
     * 생성 성공 응답 형식
     * @param {Object} res - Express response object
     * @param {Object} data - 생성된 데이터
     * @param {string} message - 성공 메시지
     */
    created: (res, data = null, message = '리소스가 성공적으로 생성되었습니다.') => {
        return ResponseFormatter.success(res, data, message, 201);
    },

    /**
     * 에러 응답 형식
     * @param {Object} res - Express response object
     * @param {string} message - 에러 메시지
     * @param {number} statusCode - HTTP 상태 코드
     * @param {Object} errors - 상세 에러 정보
     * @param {string} errorCode - 에러 코드 (선택사항)
     */
    error: (res, message = '서버 오류가 발생했습니다.', statusCode = 500, errors = null, errorCode = null) => {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString(),
            ...(errors && { errors }),
            ...(errorCode && { errorCode }),
            // 개발 환경에서만 스택 트레이스 포함
            ...(process.env.NODE_ENV === 'development' && errors && { stack: errors.stack })
        };

        return res.status(statusCode).json(response);
    },

    /**
     * 검증 에러 응답 형식
     * @param {Object} res - Express response object
     * @param {Object} validationErrors - 검증 에러 객체
     * @param {string} message - 에러 메시지
     */
    validationError: (res, validationErrors, message = '입력값 검증에 실패했습니다.') => {
        return ResponseFormatter.error(res, message, 400, validationErrors, 'VALIDATION_ERROR');
    },

    /**
     * 인증 에러 응답 형식
     * @param {Object} res - Express response object
     * @param {string} message - 에러 메시지
     */
    unauthorized: (res, message = '인증이 필요합니다.') => {
        return ResponseFormatter.error(res, message, 401, null, 'UNAUTHORIZED');
    },

    /**
     * 권한 에러 응답 형식
     * @param {Object} res - Express response object
     * @param {string} message - 에러 메시지
     */
    forbidden: (res, message = '접근 권한이 없습니다.') => {
        return ResponseFormatter.error(res, message, 403, null, 'FORBIDDEN');
    },

    /**
     * 리소스 없음 에러 응답 형식
     * @param {Object} res - Express response object
     * @param {string} message - 에러 메시지
     */
    notFound: (res, message = '요청한 리소스를 찾을 수 없습니다.') => {
        return ResponseFormatter.error(res, message, 404, null, 'NOT_FOUND');
    },

    /**
     * 충돌 에러 응답 형식
     * @param {Object} res - Express response object
     * @param {string} message - 에러 메시지
     * @param {Object} conflictData - 충돌 관련 데이터
     */
    conflict: (res, message = '요청한 작업이 현재 리소스 상태와 충돌합니다.', conflictData = null) => {
        return ResponseFormatter.error(res, message, 409, conflictData, 'CONFLICT');
    },

    /**
     * 페이지네이션을 포함한 목록 응답 형식
     * @param {Object} res - Express response object
     * @param {Array} items - 목록 데이터
     * @param {Object} pagination - 페이지네이션 정보
     * @param {string} message - 성공 메시지
     */
    list: (res, items = [], pagination = null, message = '목록을 성공적으로 조회했습니다.') => {
        const response = {
            success: true,
            message,
            timestamp: new Date().toISOString(),
            data: {
                items,
                count: items.length,
                ...(pagination && { pagination })
            }
        };

        return res.status(200).json(response);
    }
};

module.exports = ResponseFormatter;