const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GeneratedImage = sequelize.define('GeneratedImage', {
    generated_image_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    prompt_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'prompts',
        key: 'prompt_id'
      }
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'generated_images',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // 스키마에 updated_at이 없음
    
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['prompt_id']
      }
    ]
  });

  // 관계 설정
  GeneratedImage.associate = (models) => {
    // GeneratedImage -> User (N:1)
    GeneratedImage.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    // GeneratedImage -> Prompt (N:1)
    GeneratedImage.belongsTo(models.Prompt, {
      foreignKey: 'prompt_id',
      as: 'prompt',
      onDelete: 'CASCADE'
    });
  };

  return GeneratedImage;
};