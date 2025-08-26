const { sequelize, initializeSequelize } = require('../config/sequelize');

// 모델들 import
const User = require('./User');
const UserImage = require('./UserImage');
const Animal = require('./Animal');
const Shelter = require('./Shelter');
const Prompt = require('./Prompt');
const GeneratedImage = require('./GeneratedImage');
const LLMLog = require('./LLMLog');

// 모델과 sequelize 인스턴스 연결
const models = {
  User: User(sequelize),
  UserImage: UserImage(sequelize),
  Animal: Animal(sequelize),
  Shelter: Shelter(sequelize),
  Prompt: Prompt(sequelize),
  GeneratedImage: GeneratedImage(sequelize),
  LLMLog: LLMLog(sequelize)
};

// 관계 설정
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// 데이터베이스 초기화 함수
async function initializeDatabase() {
  const sequelizeInstance = await initializeSequelize();
  
  // 기존 데이터베이스와 연결만 수행 (스키마 변경 없음)
  console.log('✅ 데이터베이스 연결이 완료되었습니다.');
  
  return sequelizeInstance;
}

module.exports = {
  sequelize,
  initializeDatabase,
  ...models
};