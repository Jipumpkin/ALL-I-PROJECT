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
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
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
    paranoid: false,  // 소프트 삭제 비활성화 (deleted_at 컬럼 없음)
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    // 인덱스 설정 (기존 DB에 인덱스가 있어 임시 주석)
    // indexes: [
    //   {
    //     unique: true,
    //     fields: ['email']
    //   },
    //   {
    //     fields: ['username']
    //   }
    // ]
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
  User.findUserByPk = async function(id) {
    return await this.findByPk(id, {
      attributes: { exclude: ['password_hash'] }
    });
  };

  /**
   * Username 또는 Email로 사용자 검색 (로그인용)
   */
  User.findByUsernameOrEmail = async function(identifier) {
    console.log('🔍 User.findByUsernameOrEmail 검색 시작:', identifier);
    
    const user = await this.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { username: identifier },
          { email: identifier }
        ]
      }
    });
    
    if (user) {
      console.log('👤 데이터베이스에서 조회된 사용자:');
      console.log('  - user_id:', user.user_id);
      console.log('  - username:', user.username);
      console.log('  - email:', user.email);
      console.log('📅 데이터베이스 created_at 원본 데이터:');
      console.log('  - Raw created_at:', user.created_at);
      console.log('  - Type of created_at:', typeof user.created_at);
      console.log('  - created_at instanceof Date:', user.created_at instanceof Date);
      console.log('  - created_at toString():', user.created_at ? user.created_at.toString() : 'null');
      console.log('  - created_at toISOString():', user.created_at ? user.created_at.toISOString() : 'null');
      console.log('  - created_at getTime():', user.created_at ? user.created_at.getTime() : 'null');
      console.log('  - new Date(created_at):', user.created_at ? new Date(user.created_at) : 'null');
      console.log('  - toLocaleDateString(ko-KR):', user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : 'null');
      console.log('  - toLocaleString(ko-KR):', user.created_at ? new Date(user.created_at).toLocaleString('ko-KR') : 'null');
    } else {
      console.log('❌ 사용자를 찾을 수 없음:', identifier);
    }
    
    return user;
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
   * Email로 사용자 검색 (중복 체크용)
   */
  User.findByEmail = async function(email) {
    return await this.findOne({
      where: { email }
    });
  };

  /**
   * 사용자 생성
   */
  User.createUser = async function(userData) {
    console.log('🔍 User.createUser 입력 데이터:', userData);
    
    const user = await this.create(userData);
    
    // 디버깅: 생성된 사용자의 created_at 확인
    console.log('📅 생성된 사용자의 created_at 정보:');
    console.log('  - Raw created_at:', user.created_at);
    console.log('  - Type of created_at:', typeof user.created_at);
    console.log('  - created_at toString():', user.created_at ? user.created_at.toString() : 'null');
    console.log('  - JavaScript Date 변환:', user.created_at ? new Date(user.created_at) : 'null');
    console.log('  - toLocaleDateString(ko-KR):', user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : 'null');
    
    // 비밀번호 제외하고 반환
    const { password_hash, ...userWithoutPassword } = user.toJSON();
    
    console.log('📤 User.createUser 반환 데이터:', userWithoutPassword);
    console.log('📤 반환 데이터의 created_at:', userWithoutPassword.created_at);
    
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
      return await this.findByPk(userId, {
        attributes: { exclude: ['password_hash'] }
      });
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