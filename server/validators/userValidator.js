const { body, param, validationResult } = require('express-validator');
const { VALIDATION, HTTP_STATUS } = require('../config/constants');
const ResponseFormatter = require('../utils/responseFormatter');

// 공통 검증 결과 처리 미들웨어
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = {};
    errors.array().forEach(error => {
      formattedErrors[error.path] = error.msg;
    });

    console.log('🔴 검증 오류:', JSON.stringify(formattedErrors, null, 2));
    console.log('🔍 요청 데이터:', JSON.stringify(req.body, null, 2));

    return ResponseFormatter.validationError(res, formattedErrors, '입력값 검증에 실패했습니다.');
  }
  next();
};

// 회원가입 검증
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: VALIDATION.USERNAME_MIN_LENGTH, max: VALIDATION.USERNAME_MAX_LENGTH })
    .withMessage(`사용자명은 ${VALIDATION.USERNAME_MIN_LENGTH}자 이상 ${VALIDATION.USERNAME_MAX_LENGTH}자 이하여야 합니다.`)
    .matches(/^[a-zA-Z0-9가-힣_]+$/)
    .withMessage('사용자명은 영문, 한글, 숫자, 언더스코어만 사용할 수 있습니다.'),

  body('email')
    .trim()
    .matches(VALIDATION.EMAIL_REGEX)
    .withMessage('올바른 이메일 형식이 아닙니다.')
    .isLength({ max: 100 })
    .withMessage('이메일은 100자 이하여야 합니다.'),

  body('password')
    .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH })
    .withMessage(`비밀번호는 ${VALIDATION.PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`)
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('비밀번호는 영문자, 숫자, 특수문자를 포함해야 합니다.'),

  body('nickname')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('닉네임은 50자 이하여야 합니다.')
    .matches(/^[a-zA-Z0-9가-힣\s_]+$/)
    .withMessage('닉네임은 영문, 한글, 숫자, 공백, 언더스코어만 사용할 수 있습니다.'),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'unknown'])
    .withMessage('성별은 male, female, other, unknown 중 하나여야 합니다.'),

  body('phone_number')
    .optional()
    .matches(/^(\+82|0)[0-9]{1,2}-?[0-9]{3,4}-?[0-9]{4}$/)
    .withMessage('올바른 전화번호 형식이 아닙니다.'),

  handleValidationErrors
];

// 로그인 검증
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('사용자명 또는 이메일을 입력해주세요.')
    .isLength({ max: 100 })
    .withMessage('사용자명/이메일이 너무 깁니다.'),

  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요.')
    .isLength({ max: 255 })
    .withMessage('비밀번호가 너무 깁니다.'),

  handleValidationErrors
];

// 사용자명 중복 확인 검증
const validateCheckUsername = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('사용자명을 입력해주세요.')
    .isLength({ min: 3, max: 50 })
    .withMessage('사용자명은 3자 이상 50자 이하여야 합니다.')
    .matches(/^[a-zA-Z0-9가-힣_]+$/)
    .withMessage('사용자명은 영문, 한글, 숫자, 언더스코어만 사용할 수 있습니다.'),

  handleValidationErrors
];

// 프로필 업데이트 검증
const validateProfileUpdate = [
  body('nickname')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('닉네임은 50자 이하여야 합니다.')
    .matches(/^[a-zA-Z0-9가-힣\s_]+$/)
    .withMessage('닉네임은 영문, 한글, 숫자, 공백, 언더스코어만 사용할 수 있습니다.'),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'unknown'])
    .withMessage('성별은 male, female, other, unknown 중 하나여야 합니다.'),

  body('phone_number')
    .optional()
    .custom((value) => {
      if (value === null || value === '') return true; // null이나 빈 문자열 허용
      return /^(\+82|0)[0-9]{1,2}-?[0-9]{3,4}-?[0-9]{4}$/.test(value);
    })
    .withMessage('올바른 전화번호 형식이 아닙니다.'),

  body('current_password')
    .optional()
    .isLength({ min: 1 })
    .withMessage('현재 비밀번호를 입력해주세요.'),

  body('new_password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('새 비밀번호는 8자 이상이어야 합니다.')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('새 비밀번호는 영문자, 숫자, 특수문자를 포함해야 합니다.')
    .custom((value, { req }) => {
      if (value && !req.body.current_password) {
        throw new Error('비밀번호 변경시 현재 비밀번호가 필요합니다.');
      }
      return true;
    }),

  handleValidationErrors
];

// 회원탈퇴 검증
const validateDeleteAccount = [
  body('password')
    .notEmpty()
    .withMessage('회원탈퇴를 위해 비밀번호를 입력해주세요.')
    .isLength({ max: 255 })
    .withMessage('비밀번호가 너무 깁니다.'),

  handleValidationErrors
];

// 사용자 ID 파라미터 검증
const validateUserId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('올바른 사용자 ID가 아닙니다.'),

  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateCheckUsername,
  validateProfileUpdate,
  validateDeleteAccount,
  validateUserId,
  handleValidationErrors
};