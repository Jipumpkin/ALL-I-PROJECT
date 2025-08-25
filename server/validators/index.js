// validators/index.js - 중앙 집중식 validator export

const userValidator = require('./userValidator');
const animalValidator = require('./animalValidator');

module.exports = {
  // User validators
  ...userValidator,
  
  // Animal validators  
  ...animalValidator,

  // 공통 유틸리티
  handleValidationErrors: userValidator.handleValidationErrors
};