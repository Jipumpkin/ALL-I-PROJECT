const bcrypt = require('bcryptjs');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

const hashUtils = {
    hashPassword: async (password) => {
        try {
            const salt = await bcrypt.genSalt(SALT_ROUNDS);
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
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const errors = [];

        if (password.length < minLength) {
            errors.push(`비밀번호는 최소 ${minLength}자 이상이어야 합니다`);
        }
        if (!hasUpperCase) {
            errors.push('대문자를 포함해야 합니다');
        }
        if (!hasLowerCase) {
            errors.push('소문자를 포함해야 합니다');
        }
        if (!hasNumbers) {
            errors.push('숫자를 포함해야 합니다');
        }
        if (!hasSpecialChar) {
            errors.push('특수문자를 포함해야 합니다');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
};

module.exports = hashUtils;