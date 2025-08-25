const UserService = require('../../services/userService');
const { User } = require('../../models');
const hashUtils = require('../../utils/hash');

const UserProfileController = {
    /**
     * 사용자 프로필 조회
     * GET /api/users/profile
     */
    getUserProfile: async (req, res) => {
        try {
            const userId = req.user.userId;
            console.log('🔍 getUserProfile - userId:', userId);

            const userProfile = await UserService.getUserProfile(userId);

            res.json({
                success: true,
                message: '사용자 프로필을 성공적으로 조회했습니다.',
                user: userProfile
            });

        } catch (error) {
            console.error('Get user profile error:', error);
            
            if (error.message === 'USER_NOT_FOUND') {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.',
                    errors: { user: '존재하지 않는 사용자입니다.' }
                });
            }

            res.status(500).json({
                success: false,
                message: '프로필 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    /**
     * 사용자 프로필 수정
     * PUT /api/users/profile
     */
    updateUserProfile: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { nickname, gender, phone_number, current_password, new_password } = req.body;
            
            console.log('🔍 updateUserProfile - userId:', userId);
            console.log('🔍 updateUserProfile - body:', { nickname, gender, phone_number, current_password: current_password ? '***' : undefined, new_password: new_password ? '***' : undefined });

            // 현재 사용자 정보 조회
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.',
                    errors: { user: '존재하지 않는 사용자입니다.' }
                });
            }

            // 비밀번호 변경 요청이 있는 경우
            if (new_password) {
                if (!current_password) {
                    return res.status(400).json({
                        success: false,
                        message: '비밀번호 변경시 현재 비밀번호가 필요합니다.',
                        errors: { current_password: '현재 비밀번호를 입력해주세요.' }
                    });
                }

                // 현재 비밀번호 검증
                const isValidPassword = await hashUtils.comparePassword(current_password, user.password_hash);
                if (!isValidPassword) {
                    return res.status(401).json({
                        success: false,
                        message: '현재 비밀번호가 올바르지 않습니다.',
                        errors: { current_password: '현재 비밀번호를 정확히 입력해주세요.' }
                    });
                }

                // 새 비밀번호 유효성 검사
                if (!hashUtils.validatePassword(new_password)) {
                    return res.status(400).json({
                        success: false,
                        message: '새 비밀번호가 보안 요구사항을 충족하지 않습니다.',
                        errors: { 
                            new_password: '비밀번호는 8자 이상, 영문자, 숫자, 특수문자를 포함해야 합니다.' 
                        }
                    });
                }

                // 새 비밀번호 해싱
                const hashedNewPassword = await hashUtils.hashPassword(new_password);
                
                // 비밀번호 업데이트
                await User.updatePassword(userId, hashedNewPassword);
            }

            // 프로필 정보 업데이트
            const updateData = {};
            if (nickname !== undefined) updateData.nickname = nickname;
            if (gender !== undefined) updateData.gender = gender;
            if (phone_number !== undefined) updateData.phone_number = phone_number;

            if (Object.keys(updateData).length > 0) {
                await User.updateProfile(userId, updateData);
            }

            // 업데이트된 사용자 정보 조회
            const updatedUser = await User.findById(userId);
            
            const userProfile = {
                id: updatedUser.user_id,
                username: updatedUser.username,
                email: updatedUser.email,
                nickname: updatedUser.nickname,
                gender: updatedUser.gender,
                phone_number: updatedUser.phone_number,
                updated_at: updatedUser.updated_at
            };

            res.json({
                success: true,
                message: '프로필이 성공적으로 업데이트되었습니다.',
                user: userProfile
            });

        } catch (error) {
            console.error('Update user profile error:', error);
            res.status(500).json({
                success: false,
                message: '프로필 업데이트 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    /**
     * 회원탈퇴
     * DELETE /api/users/account
     */
    deleteAccount: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { password } = req.body;

            console.log('🔍 deleteAccount - userId:', userId);

            // 필수 입력값 검증
            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: '회원탈퇴를 위해 비밀번호 확인이 필요합니다.',
                    errors: { password: '비밀번호를 입력해주세요.' }
                });
            }

            // 현재 사용자 정보 조회
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.',
                    errors: { user: '존재하지 않는 사용자입니다.' }
                });
            }

            // 비밀번호 검증
            const isValidPassword = await hashUtils.comparePassword(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: '비밀번호가 올바르지 않습니다.',
                    errors: { password: '현재 비밀번호를 정확히 입력해주세요.' }
                });
            }

            // 회원탈퇴 처리
            await User.deleteAccount(userId);

            res.json({
                success: true,
                message: '회원탈퇴가 완료되었습니다.',
                data: {
                    deletedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({
                success: false,
                message: '회원탈퇴 처리 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
};

module.exports = UserProfileController;