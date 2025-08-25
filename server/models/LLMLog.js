const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LLMLog = sequelize.define('LLMLog', {
    log_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    request_type: {
      type: DataTypes.ENUM('gpt', 'dalle'),
      allowNull: false
    },
    cost: {
      type: DataTypes.DECIMAL(10, 5),
      allowNull: true
    },
    result_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    }
  }, {
    tableName: 'llm_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // 스키마에 updated_at이 없음
    
    indexes: [
      {
        fields: ['request_type']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // LLMLog는 다른 테이블과의 관계가 명확하지 않으므로 associate 함수 없음

  return LLMLog;
};