const bcrypt = require('bcryptjs');
const { SECURITY } = require('../config/constants');

// 상수 파일에서 설정값 가져오기

const hashUtils = {
    hashPassword: async (password) => {
        try {
            const salt = await bcrypt.genSalt(SECURITY.SALT_ROUNDS);
            const hashedPassword = await bcrypt.hash(password, salt);
            return hashedPassword;
        } catch (error) {
            throw new Error('비밀번호 해싱 중 오류가 발생했습니다');
        }
    },

    comparePassword: async (password, hashedPassword) => {
        try {
            const isMatch = await bcrypt.compare(password, hashedPassword);
            return isMatch;
        } catch (error) {
            throw new Error('비밀번호 비교 중 오류가 발생했습니다');
        }
    },

    validatePassword: (password) => {
        // 상수에서 설정된 정규식과 최소 길이 사용
        const minLength = SECURITY.PASSWORD_MIN_LENGTH;
        const passwordRegex = SECURITY.PASSWORD_REGEX;

        if (!password || password.length < minLength) {
            return false;
        }

        return passwordRegex.test(password);
    },

    /**
     * 상세한 비밀번호 검증 (에러 메시지 포함)
     */
    validatePasswordDetailed: (password) => {
        const minLength = SECURITY.PASSWORD_MIN_LENGTH;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[@$!%*?&]/.test(password);

        const errors = [];

        if (!password) {
            errors.push('비밀번호를 입력해주세요');
            return { isValid: false, errors };
        }

        if (password.length < minLength) {
            errors.push(`비밀번호는 최소 ${minLength}자 이상이어야 합니다`);
        }
        if (!hasUpperCase) {
            errors.push('영대문자를 포함해야 합니다');
        }
        if (!hasLowerCase) {
            errors.push('영소문자를 포함해야 합니다');
        }
        if (!hasNumbers) {
            errors.push('숫자를 포함해야 합니다');
        }
        if (!hasSpecialChar) {
            errors.push('특수문자(@$!%*?&)를 포함해야 합니다');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
};

module.exports = hashUtils;