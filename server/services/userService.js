const { User } = require('../models');
const hashUtils = require('../utils/hash');
const jwtUtils = require('../utils/jwt');

class UserService {
  /**
   * 사용자 회원가입 서비스
   */
  static async registerUser(userData) {
    console.log('📋 UserService.registerUser 시작:', { ...userData, password: '***' });
    const { username, email, password, nickname, gender, phone_number } = userData;

    try {
      // 연락처 필수 입력 및 유효성 검증
      if (!phone_number) {
        throw new Error('연락처는 필수 입력 항목입니다.');
      }
      
      if (!UserService.validatePhoneNumber(phone_number)) {
        throw new Error('올바른 연락처 형식을 입력해주세요 (예: 010-1234-5678)');
      }
      // 비밀번호 해싱
      console.log('🔐 비밀번호 해싱 시작...');
      const hashedPassword = await hashUtils.hashPassword(password);
      console.log('✅ 비밀번호 해싱 완료');

      // 사용자 데이터 준비
      console.log('📝 사용자 데이터 준비 중...');
      const userCreateData = {
        username,
        email,
        password_hash: hashedPassword,
        nickname: nickname || username,
        gender: gender || null,
        phone_number: phone_number || null
      };
      console.log('✅ 사용자 데이터 준비 완료');

      // 사용자 생성
      console.log('💾 데이터베이스에 사용자 생성 중...');
      const newUser = await User.createUser(userCreateData);
      console.log('✅ 사용자 생성 완료:', { userId: newUser.user_id, username: newUser.username });

      // JWT 토큰 생성
      console.log('🔑 JWT 토큰 생성 중...');
      const payload = {
        userId: newUser.user_id,
        email: newUser.email,
        username: newUser.username
      };

      const accessToken = jwtUtils.generateAccessToken(payload);
      const refreshToken = jwtUtils.generateRefreshToken(payload);
      console.log('✅ JWT 토큰 생성 완료');

      const result = {
        user: {
          id: newUser.user_id,
          username: newUser.username,
          email: newUser.email,
          nickname: newUser.nickname
        },
        tokens: {
          accessToken,
          refreshToken
        }
      };
      
      console.log('🎉 registerUser 성공 완료');
      return result;
    } catch (error) {
      console.error('💥 UserService.registerUser 에러:', error);
      console.error('에러 스택:', error.stack);
      throw error;
    }
  }

  /**
   * 사용자 로그인 서비스
   */
  static async loginUser(identifier, password) {
    // 사용자 검색
    const user = await User.findByUsernameOrEmail(identifier);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // 비밀번호 검증
    const isValidPassword = await hashUtils.comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // 로그인 시간 업데이트
    await User.updateLastLogin(user.user_id);

    // JWT 토큰 생성
    const payload = {
      userId: user.user_id,
      email: user.email,
      username: user.username
    };

    const accessToken = jwtUtils.generateAccessToken(payload);
    const refreshToken = jwtUtils.generateRefreshToken(payload);

    // 디버깅: 로그인 시 created_at 확인
    console.log('📅 로그인 사용자의 created_at 정보:');
    console.log('  - Raw created_at:', user.created_at);
    console.log('  - Type of created_at:', typeof user.created_at);
    console.log('  - created_at toString():', user.created_at ? user.created_at.toString() : 'null');
    console.log('  - JavaScript Date 변환:', user.created_at ? new Date(user.created_at) : 'null');
    console.log('  - toLocaleDateString(ko-KR):', user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : 'null');

    const userResponse = {
      id: user.user_id,
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      gender: user.gender,
      phone_number: user.phone_number,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login_at: user.last_login_at
    };

    console.log('📤 로그인 응답 사용자 데이터:', userResponse);
    console.log('📤 응답 데이터의 created_at:', userResponse.created_at);

    return {
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  /**
   * 사용자명 중복 확인 서비스
   */
  static async checkUsernameAvailability(username) {
    const existingUser = await User.findByUsername(username);
    return !existingUser; // 존재하지 않으면 true (사용 가능)
  }

  /**
   * 이메일 중복 확인 서비스
   */
  static async checkEmailAvailability(email) {
    const existingUser = await User.findByEmail(email);
    return !existingUser; // 존재하지 않으면 true (사용 가능)
  }

  /**
   * 이메일로 아이디 찾기 서비스
   */
  static async findIdByEmail(email, name, phone) {
    const user = await User.findOne({
      where: { 
        email,
        ...(phone && { phone_number: phone })
      }
    });
    return user;
  }

  /**
   * 닉네임으로 아이디 찾기 서비스
   */
  static async findIdByNickname(nickname, name, phone) {
    const user = await User.findOne({
      where: { 
        nickname,
        ...(phone && { phone_number: phone })
      }
    });
    return user;
  }

  /**
   * 연락처 유효성 검사 함수
   */
  static validatePhoneNumber(phone) {
    if (!phone) return false;
    
    // 한국 휴대폰 번호 패턴 (010, 011, 016, 017, 018, 019)
    const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
    
    // 숫자만 추출하여 길이 검사
    const digitsOnly = phone.replace(/[^0-9]/g, '');
    
    // 11자리 숫자여야 함
    if (digitsOnly.length !== 11) {
      return false;
    }
    
    // 유효한 통신사 번호로 시작하는지 확인
    if (!digitsOnly.startsWith('010') && 
        !digitsOnly.startsWith('011') && 
        !digitsOnly.startsWith('016') && 
        !digitsOnly.startsWith('017') && 
        !digitsOnly.startsWith('018') && 
        !digitsOnly.startsWith('019')) {
      return false;
    }
    
    return phoneRegex.test(phone);
  }

  /**
   * 사용자 프로필 조회 서비스
   */
  static async getUserProfile(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return {
      id: user.user_id,
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      gender: user.gender,
      phone_number: user.phone_number,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login_at: user.last_login_at
    };
  }

  /**
   * 사용자 프로필 업데이트 서비스
   */
  static async updateUserProfile(userId, updateData) {
    const { nickname, gender, phone_number, current_password, new_password } = updateData;

    // 현재 사용자 정보 조회
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // 비밀번호 변경 요청이 있는 경우
    if (new_password) {
      if (!current_password) {
        throw new Error('CURRENT_PASSWORD_REQUIRED');
      }

      // 현재 비밀번호 검증
      const isValidPassword = await hashUtils.comparePassword(current_password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('INVALID_CURRENT_PASSWORD');
      }

      // 새 비밀번호 해싱 및 업데이트
      const hashedNewPassword = await hashUtils.hashPassword(new_password);
      await User.updatePassword(userId, hashedNewPassword);
    }

    // 프로필 정보 업데이트
    const profileUpdateData = {};
    if (nickname !== undefined) profileUpdateData.nickname = nickname;
    if (gender !== undefined) profileUpdateData.gender = gender;
    if (phone_number !== undefined) profileUpdateData.phone_number = phone_number;

    if (Object.keys(profileUpdateData).length > 0) {
      await User.updateProfile(userId, profileUpdateData);
    }

    // 업데이트된 사용자 정보 반환
    return await this.getUserProfile(userId);
  }

  /**
   * 회원탈퇴 서비스
   */
  static async deleteUserAccount(userId, password) {
    // 현재 사용자 정보 조회
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // 비밀번호 검증
    const isValidPassword = await hashUtils.comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('INVALID_PASSWORD');
    }

    // 회원탈퇴 처리
    const deleted = await User.deleteAccount(userId);
    if (!deleted) {
      throw new Error('DELETE_FAILED');
    }

    return {
      deletedAt: new Date().toISOString()
    };
  }

  /**
   * 모든 사용자 조회 서비스 (관리자용)
   */
  static async getAllUsers() {
    return await User.findAllUsers();
  }

  /**
   * 특정 사용자 조회 서비스
   */
  static async getUserById(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }
    return user;
  }
}

module.exports = UserService;