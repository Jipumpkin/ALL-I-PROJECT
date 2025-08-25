const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserImage = sequelize.define('UserImage', {
    image_id: {
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
    image_url: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'user_images',
    timestamps: false, // 스키마에서 custom timestamp 사용
    
    indexes: [
      {
        fields: ['user_id']
      }
    ]
  });

  // 관계 설정
  UserImage.associate = (models) => {
    // UserImage -> User (N:1)
    UserImage.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    // UserImage -> Prompts (1:N)
    UserImage.hasMany(models.Prompt, {
      foreignKey: 'image_id',
      as: 'prompts',
      onDelete: 'SET NULL'
    });
  };

  return UserImage;
};