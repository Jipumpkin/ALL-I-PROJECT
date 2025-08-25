const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other', 'unknown'),
      defaultValue: 'unknown'
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    // 인덱스 설정
  });

  // 관계 설정
  User.associate = (models) => {
    // User -> UserImages (1:N)
    User.hasMany(models.UserImage, {
      foreignKey: 'user_id',
      as: 'images',
      onDelete: 'CASCADE'
    });

    // User -> Prompts (1:N)
    User.hasMany(models.Prompt, {
      foreignKey: 'user_id',
      as: 'prompts',
      onDelete: 'CASCADE'
    });

    // User -> GeneratedImages (1:N)
    User.hasMany(models.GeneratedImage, {
      foreignKey: 'user_id',
      as: 'generatedImages',
      onDelete: 'CASCADE'
    });
  };

  // 클래스 메소드들 (기존 Raw SQL 메소드를 Sequelize로 변환)
  
  /**
   * 모든 사용자 조회
   */
  User.findAllUsers = async function() {
    return await this.findAll({
      attributes: { exclude: ['password_hash'] }
    });
  };

  /**
   * ID로 사용자 조회
   */
  User.findByPk = async function(id) {
    return await this.findByPk(id, {
      attributes: { exclude: ['password_hash'] }
    });
  };

  /**
   * Username 또는 Email로 사용자 검색 (로그인용)
   */
  User.findByUsernameOrEmail = async function(identifier) {
    return await this.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { username: identifier },
          { email: identifier }
        ]
      }
    });
  };

  /**
   * Username으로 사용자 검색 (중복 체크용)
   */
  User.findByUsername = async function(username) {
    return await this.findOne({
      where: { username }
    });
  };

  /**
   * 사용자 생성
   */
  User.createUser = async function(userData) {
    const user = await this.create(userData);
    // 비밀번호 제외하고 반환
    const { password_hash, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  };

  /**
   * 사용자 프로필 업데이트
   */
  User.updateProfile = async function(userId, updateData) {
    const [affectedRows] = await this.update(updateData, {
      where: { user_id: userId }
    });
    
    if (affectedRows > 0) {
      return await this.findByPk(userId);
    }
    return null;
  };

  /**
   * 비밀번호 업데이트
   */
  User.updatePassword = async function(userId, newPasswordHash) {
    const [affectedRows] = await this.update(
      { password_hash: newPasswordHash },
      { where: { user_id: userId } }
    );
    return affectedRows > 0;
  };

  /**
   * 마지막 로그인 시간 업데이트
   */
  User.updateLastLogin = async function(userId) {
    const [affectedRows] = await this.update(
      { last_login_at: new Date() },
      { where: { user_id: userId } }
    );
    return affectedRows > 0;
  };

  /**
   * 회원 탈퇴 (실제로는 soft delete 또는 상태 변경)
   */
  User.deleteAccount = async function(userId) {
    // 실제 삭제 대신 다른 방법을 사용할 수 있음 (예: status 필드)
    // 현재는 실제 삭제로 구현
    const deletedRows = await this.destroy({
      where: { user_id: userId }
    });
    return deletedRows > 0;
  };

  // 인스턴스 메소드들

  /**
   * 비밀번호 제외 JSON 반환
   */
  User.prototype.toSafeJSON = function() {
    const { password_hash, ...safeUser } = this.toJSON();
    return safeUser;
  };

  return User;
};