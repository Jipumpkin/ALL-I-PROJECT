const express = require('express');
const router = express.Router();

// 분할된 컨트롤러들 import
const AuthController = require('../controllers/auth/AuthController');
const UserProfileController = require('../controllers/user/UserProfileController');
const UserCrudController = require('../controllers/user/UserCrudController');
const TestController = require('../controllers/test/TestController');

// 미들웨어 import
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

// Validators import - 임시 주석 처리 (validators 파일 누락)
// const {
//   validateRegister,
//   validateLogin,
//   validateCheckUsername,
//   validateProfileUpdate,
//   validateDeleteAccount,
//   validateUserId
// } = require('../validators');

// === 인증 관련 라우트 (우선순위 높음) ===
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/check-username', AuthController.checkUsername);
router.post('/auth/find-id', AuthController.findId);

// === 사용자 프로필 관련 라우트 (인증 필요) ===
router.get('/profile', authMiddleware, UserProfileController.getUserProfile);
router.put('/profile', authMiddleware, UserProfileController.updateUserProfile);
router.delete('/account', authMiddleware, UserProfileController.deleteAccount);

// === 테스트 라우트 (개발용) ===
router.post('/test/generate-token', TestController.generateTestToken);
router.get('/test/protected', authMiddleware, TestController.testProtectedRoute);
router.get('/test/optional-auth', optionalAuthMiddleware, TestController.testOptionalAuth);

// === 기본 테스트 라우트 ===
router.get('/test-route', (req, res) => {
    res.json({ message: 'Test route working' });
});

// === 사용자 이미지 관련 라우트 ===
router.get('/:id/images', async (req, res) => {
    const { id } = req.params;
    
    try {
        const { User, UserImage } = require('../models');
        let userId;
        const parsedId = parseInt(id, 10);

        if (isNaN(parsedId)) {
            // If 'id' is not a number, assume it's a username
            const user = await User.findOne({ where: { username: id } });
            if (user) {
                userId = user.user_id;
            } else {
                return res.status(404).json({ success: false, message: `사용자 '${id}'를 찾을 수 없습니다.` });
            }
        } else {
            // If 'id' is a number, use it directly
            userId = parsedId;
        }
        
        // 사용자의 모든 이미지 조회 (Base64 데이터 포함)
        const images = await UserImage.findAll({
            where: { user_id: userId },
            order: [['uploaded_at', 'DESC']]
        });
        
        console.log(`사용자 ${id}(ID: ${userId})의 이미지 ${images.length}개 조회`);
        
        res.json({
            success: true,
            data: images,
            count: images.length
        });
    } catch (error) {
        console.error('이미지 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '이미지 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

router.post('/:id/images', async (req, res) => {
    const { id } = req.params;
    const { image_url, image_data, filename, mime_type, file_size, storage_type } = req.body;
    
    try {
        // 이미지 데이터 검증
        if (!image_url && !image_data) {
            return res.status(400).json({
                success: false,
                message: 'image_url 또는 image_data가 필요합니다.'
            });
        }

        // Base64 데이터 크기 제한 (5MB)
        if (image_data && Buffer.byteLength(image_data, 'utf8') > 5 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                message: '이미지 크기가 너무 큽니다. (최대 5MB)'
            });
        }

        // UserImage 모델을 사용하여 데이터베이스에 실제 저장
        const { UserImage } = require('../models');
        
        const imageData = {
            user_id: parseInt(id),
            image_url,
            image_data,
            filename,
            mime_type,
            file_size: file_size ? parseInt(file_size) : null,
            storage_type: storage_type || (image_data ? 'base64' : 'url')
        };

        const savedImage = await UserImage.create(imageData);
        
        console.log(`사용자 ${id}의 이미지 저장 완료:`, {
            image_id: savedImage.image_id,
            storage_type: savedImage.storage_type,
            filename: savedImage.filename,
            size: savedImage.file_size ? `${savedImage.file_size} bytes` : 'unknown'
        });
        
        res.json({
            success: true,
            message: '이미지가 성공적으로 저장되었습니다.',
            image: {
                image_id: savedImage.image_id,
                user_id: savedImage.user_id,
                image_url: savedImage.image_url,
                filename: savedImage.filename,
                mime_type: savedImage.mime_type,
                file_size: savedImage.file_size,
                storage_type: savedImage.storage_type,
                uploaded_at: savedImage.uploaded_at
            }
        });
    } catch (error) {
        console.error('이미지 저장 오류:', error);
        res.status(500).json({
            success: false,
            message: '이미지 저장 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 특정 이미지 삭제
router.delete('/:id/images/:imageId', async (req, res) => {
    const { id, imageId } = req.params;
    
    try {
        const { UserImage } = require('../models');
        
        // 이미지가 해당 사용자의 것인지 확인
        const image = await UserImage.findOne({
            where: { 
                image_id: parseInt(imageId), 
                user_id: parseInt(id) 
            }
        });
        
        if (!image) {
            return res.status(404).json({
                success: false,
                message: '이미지를 찾을 수 없습니다.'
            });
        }
        
        // 이미지 삭제
        await UserImage.destroy({
            where: { 
                image_id: parseInt(imageId), 
                user_id: parseInt(id) 
            }
        });
        
        console.log(`사용자 ${id}의 이미지 ${imageId} 삭제 완료`);
        
        res.json({
            success: true,
            message: '이미지가 성공적으로 삭제되었습니다.'
        });
    } catch (error) {
        console.error('이미지 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '이미지 삭제 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 프로필 이미지 교체 (기존 이미지들을 모두 삭제하고 새 이미지 추가)
router.put('/:id/images/profile', async (req, res) => {
    const { id } = req.params;
    const { image_url, image_data, filename, mime_type, file_size, storage_type } = req.body;
    
    try {
        const { UserImage } = require('../models');
        
        // 이미지 데이터 검증
        if (!image_url && !image_data) {
            return res.status(400).json({
                success: false,
                message: 'image_url 또는 image_data가 필요합니다.'
            });
        }

        // Base64 데이터 크기 제한 (5MB)
        if (image_data && Buffer.byteLength(image_data, 'utf8') > 5 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                message: '이미지 크기가 너무 큽니다. (최대 5MB)'
            });
        }

        // 기존 이미지들 삭제
        await UserImage.destroy({
            where: { user_id: parseInt(id) }
        });
        
        console.log(`사용자 ${id}의 기존 이미지들 삭제 완료`);

        // 새 이미지 데이터 구성
        const imageData = {
            user_id: parseInt(id),
            image_url,
            image_data,
            filename,
            mime_type,
            file_size: file_size ? parseInt(file_size) : null,
            storage_type: storage_type || (image_data ? 'base64' : 'url')
        };

        // 새 이미지 저장
        const savedImage = await UserImage.create(imageData);
        
        console.log(`사용자 ${id}의 새 프로필 이미지 저장 완료:`, {
            image_id: savedImage.image_id,
            storage_type: savedImage.storage_type,
            filename: savedImage.filename
        });
        
        res.json({
            success: true,
            message: '프로필 이미지가 성공적으로 교체되었습니다.',
            image: {
                image_id: savedImage.image_id,
                user_id: savedImage.user_id,
                image_url: savedImage.image_url,
                filename: savedImage.filename,
                mime_type: savedImage.mime_type,
                file_size: savedImage.file_size,
                storage_type: savedImage.storage_type,
                uploaded_at: savedImage.uploaded_at
            }
        });
    } catch (error) {
        console.error('프로필 이미지 교체 오류:', error);
        res.status(500).json({
            success: false,
            message: '프로필 이미지 교체 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// === 기본 CRUD 라우트 (마지막에 배치하여 다른 라우트와 충돌 방지) ===
router.get('/', UserCrudController.getAllUsers);
router.get('/:id', UserCrudController.getUserById);
router.post('/', UserCrudController.createUser);
router.put('/:id', UserCrudController.updateUser);
router.delete('/:id', UserCrudController.deleteUser);

module.exports = router;