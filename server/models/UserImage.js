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
      allowNull: true
    },
    image_data: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Base64 encoded image data'
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'image/jpeg, image/png, etc.'
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'File size in bytes'
    },
    storage_type: {
      type: DataTypes.ENUM('url', 'base64', 'file'),
      defaultValue: 'url',
      comment: 'Storage method used'
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'user_images',
    timestamps: false, // 스키마에서 custom timestamp 사용
    
    // 인덱스 설정 (기존 DB에 인덱스가 있어 임시 주석)
    // indexes: [
    //   {
    //     fields: ['user_id']
    //   }
    // ]
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