const UserService = require('../../services/userService');
const { User, UserImage } = require('../../models');
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
                data: {
                    profile: userProfile
                }
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
            const user = await User.findByPk(userId);
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
                console.log('🔍 User.updateProfile 호출 - updateData:', updateData);
                const [affectedRows] = await User.update(updateData, {
                    where: { user_id: userId }
                });
                console.log('🔍 User.updateProfile 결과 - affectedRows:', affectedRows);
                if (affectedRows === 0) {
                    console.warn('⚠️ User.updateProfile: 변경된 행이 없습니다. 데이터가 동일하거나 사용자 ID가 잘못되었을 수 있습니다.');
                }
            } else {
                console.log('🔍 User.updateProfile 호출 스킵 - updateData가 비어 있습니다.');
            }

            // 업데이트된 사용자 정보 조회
            const updatedUser = await User.findByPk(userId);
            console.log('🔍 업데이트 후 조회된 사용자 정보:', updatedUser ? updatedUser.toJSON() : '사용자를 찾을 수 없음');
            
            const userProfile = {
                id: updatedUser.user_id,
                username: updatedUser.username,
                email: updatedUser.email,
                nickname: updatedUser.nickname,
                gender: updatedUser.gender,
                phone_number: updatedUser.phone_number,
                created_at: updatedUser.created_at,
                updated_at: updatedUser.updated_at,
                last_login_at: updatedUser.last_login_at
            };

            res.json({
                success: true,
                message: '프로필이 성공적으로 업데이트되었습니다.',
                data: {
                    profile: userProfile
                }
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
            const user = await User.findByPk(userId);
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
    },

    /**
     * 사용자 이미지 저장 (회원가입 시 집 이미지를 프로필 이미지로 저장)
     * POST /api/users/:userId/images
     */
    saveUserImage: async (req, res) => {
        try {
            const { userId } = req.params;
            const { image_url, image_data, filename, mime_type, file_size, storage_type } = req.body;

            console.log('🔍 saveUserImage - userId:', userId);
            console.log('🔍 saveUserImage - image_url:', image_url ? image_url.substring(0, 50) + '...' : 'null');
            console.log('🔍 saveUserImage - storage_type:', storage_type);

            // 필수 입력값 검증
            if (!image_url && !image_data) {
                return res.status(400).json({
                    success: false,
                    message: '이미지 URL 또는 이미지 데이터가 필요합니다.',
                    errors: { image: '이미지 정보를 제공해주세요.' }
                });
            }

            // 사용자 존재 확인
            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.',
                    errors: { user: '존재하지 않는 사용자입니다.' }
                });
            }

            // 기존 이미지가 있는지 확인 (프로필 이미지는 하나만 유지)
            const existingImages = await UserImage.findAll({
                where: { user_id: userId },
                order: [['uploaded_at', 'DESC']]
            });

            // 새 이미지 저장
            const newImage = await UserImage.create({
                user_id: userId,
                image_url: image_url || null,
                image_data: image_data || null,
                filename: filename || null,
                mime_type: mime_type || 'image/jpeg',
                file_size: file_size || null,
                storage_type: storage_type || (image_url ? 'url' : 'base64'),
                uploaded_at: new Date()
            });

            // 기존 이미지들 삭제 (최신 하나만 유지)
            if (existingImages.length > 0) {
                const imageIdsToDelete = existingImages.map(img => img.image_id);
                await UserImage.destroy({
                    where: { image_id: imageIdsToDelete }
                });
                console.log('🗑️ 기존 이미지', imageIdsToDelete.length, '개 삭제 완료');
            }

            res.json({
                success: true,
                message: '사용자 이미지가 성공적으로 저장되었습니다.',
                data: {
                    image_id: newImage.image_id,
                    image_url: newImage.image_url,
                    storage_type: newImage.storage_type,
                    uploaded_at: newImage.uploaded_at
                }
            });

        } catch (error) {
            console.error('Save user image error:', error);
            res.status(500).json({
                success: false,
                message: '이미지 저장 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },

    /**
     * 사용자 이미지 조회
     * GET /api/users/:userId/images
     */
    getUserImages: async (req, res) => {
        try {
            const { userId } = req.params;

            console.log('🔍 getUserImages - userId:', userId);

            // 사용자 존재 확인
            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.',
                    errors: { user: '존재하지 않는 사용자입니다.' }
                });
            }

            // 사용자 이미지 조회
            const userImages = await UserImage.findAll({
                where: { user_id: userId },
                order: [['uploaded_at', 'DESC']]
            });

            console.log(`사용자 ${userId}의 이미지 ${userImages.length}개 조회`);

            res.json({
                success: true,
                message: '사용자 이미지를 성공적으로 조회했습니다.',
                data: {
                    images: userImages.map(image => ({
                        image_id: image.image_id,
                        image_url: image.image_url,
                        image_data: image.image_data,
                        filename: image.filename,
                        mime_type: image.mime_type,
                        file_size: image.file_size,
                        storage_type: image.storage_type,
                        uploaded_at: image.uploaded_at
                    }))
                }
            });

        } catch (error) {
            console.error('Get user images error:', error);
            res.status(500).json({
                success: false,
                message: '이미지 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
};

module.exports = UserProfileController;