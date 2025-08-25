const { query, param, validationResult } = require('express-validator');
const { handleValidationErrors } = require('./userValidator');

// 동물 목록 조회 검증
const validateGetAnimals = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('페이지는 1 이상의 정수여야 합니다.'),

  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('페이지 크기는 1~100 사이의 정수여야 합니다.'),

  query('species')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('동물 종류는 50자 이하여야 합니다.'),

  query('gender')
    .optional()
    .isIn(['male', 'female', 'unknown'])
    .withMessage('성별은 male, female, unknown 중 하나여야 합니다.'),

  query('region')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('지역은 100자 이하여야 합니다.'),

  query('status')
    .optional()
    .isIn(['available', 'adopted', 'pending'])
    .withMessage('상태는 available, adopted, pending 중 하나여야 합니다.'),

  handleValidationErrors
];

// 동물 ID 파라미터 검증
const validateAnimalId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('올바른 동물 ID가 아닙니다.'),

  handleValidationErrors
];

// TopSix 조회 검증
const validateTopSix = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('개수는 1~20 사이의 정수여야 합니다.'),

  handleValidationErrors
];

module.exports = {
  validateGetAnimals,
  validateAnimalId,
  validateTopSix
};