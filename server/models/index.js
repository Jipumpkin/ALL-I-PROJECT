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
  
  // 연결 확인만 수행 (기존 스키마 유지)
  await sequelizeInstance.authenticate();
  console.log('✅ 데이터베이스 연결이 확인되었습니다. (기존 스키마 유지)');
  
  return sequelizeInstance;
}

module.exports = {
  sequelize,
  initializeDatabase,
  ...models
};