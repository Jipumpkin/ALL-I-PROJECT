const { User } = require('../models');
const hashUtils = require('../utils/hash');
const jwtUtils = require('../utils/jwt');

class UserService {
  /**
   * 사용자 회원가입 서비스
   */
  static async registerUser(userData) {
    const { username, email, password, nickname, gender, phone_number } = userData;

    // 비밀번호 해싱
    const hashedPassword = await hashUtils.hashPassword(password);

    // 사용자 데이터 준비
    const userCreateData = {
      username,
      email,
      password_hash: hashedPassword,
      nickname: nickname || username,
      gender: gender || null,
      phone_number: phone_number || null
    };

    // 사용자 생성
    const newUser = await User.createUser(userCreateData);

    // JWT 토큰 생성
    const payload = {
      userId: newUser.user_id,
      email: newUser.email,
      username: newUser.username
    };

    const accessToken = jwtUtils.generateAccessToken(payload);
    const refreshToken = jwtUtils.generateRefreshToken(payload);

    return {
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

    return {
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        nickname: user.nickname
      },
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