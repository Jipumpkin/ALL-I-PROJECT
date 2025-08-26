const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Prompt = sequelize.define('Prompt', {
    prompt_id: {
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
    original_prompt: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    final_prompt: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'user_images',
        key: 'image_id'
      }
    },
    animal_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'animals',
        key: 'animal_id'
      }
    }
  }, {
    tableName: 'prompts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // 스키마에 updated_at이 없음
    
    // 인덱스 설정 (기존 DB에 인덱스가 있어 임시 주석)
    // indexes: [
    //   {
    //     fields: ['user_id']
    //   },
    //   {
    //     fields: ['image_id']
    //   },
    //   {
    //     fields: ['animal_id']
    //   }
    // ]
  });

  // 관계 설정
  Prompt.associate = (models) => {
    // Prompt -> User (N:1)
    Prompt.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    // Prompt -> UserImage (N:1)
    Prompt.belongsTo(models.UserImage, {
      foreignKey: 'image_id',
      as: 'userImage',
      onDelete: 'SET NULL'
    });

    // Prompt -> Animal (N:1)
    Prompt.belongsTo(models.Animal, {
      foreignKey: 'animal_id',
      as: 'animal',
      onDelete: 'SET NULL'
    });

    // Prompt -> GeneratedImages (1:N)
    Prompt.hasMany(models.GeneratedImage, {
      foreignKey: 'prompt_id',
      as: 'generatedImages',
      onDelete: 'CASCADE'
    });
  };

  return Prompt;
};