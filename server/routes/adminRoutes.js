const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, UserImage, Animal, Sequelize } = require('../models');

// 관리자 인증 미들웨어
const adminAuth = (req, res, next) => {
  const token = req.headers['admin-token'];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '관리자 토큰이 필요합니다.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_SECRET_KEY);
    if (decoded.role === 'admin') {
      req.admin = decoded;
      next();
    } else {
      throw new Error('Invalid admin token');
    }
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: '유효하지 않은 관리자 토큰입니다.'
    });
  }
};

// 관리자 로그인
router.post('/login', async (req, res) => {
  const { password } = req.body;

  try {
    // 환경변수의 관리자 비밀번호와 비교
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: '관리자 비밀번호가 일치하지 않습니다.'
      });
    }

    // 관리자 토큰 생성 (24시간 유효)
    const token = jwt.sign(
      { role: 'admin', timestamp: Date.now() },
      process.env.ADMIN_SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: '관리자 인증 성공',
      token
    });
  } catch (error) {
    console.error('관리자 로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: '관리자 로그인 처리 중 오류가 발생했습니다.'
    });
  }
});

// 관리자 토큰 검증
router.get('/verify', adminAuth, (req, res) => {
  res.json({
    success: true,
    message: '유효한 관리자 토큰입니다.'
  });
});

// 전체 사용자 목록 조회
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        'user_id',
        'username',
        'email',
        'nickname',
        'gender',
        'phone_number',
        'created_at',
        'updated_at',
        'last_login_at'
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      users,
      total: users.length
    });
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 특정 사용자 상세 정보 조회
router.get('/users/:id', adminAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: UserImage,
          as: 'images',
          attributes: ['image_id', 'storage_type', 'filename', 'uploaded_at']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('사용자 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 삭제 (소프트 삭제)
router.delete('/users/:id', adminAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    // Sequelize의 paranoid 옵션을 사용한 소프트 삭제
    await user.destroy();

    res.json({
      success: true,
      message: '사용자가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 삭제 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 복원 기능은 deleted_at 컬럼이 없으므로 제거됨

// 입양 신청 내역 조회
router.get('/adoption-applications', adminAuth, async (req, res) => {
  try {
    // 임시 응답 (실제 입양 신청 테이블이 구현되면 수정 필요)
    const applications = [];
    
    // TODO: 실제 입양 신청 모델과 연동
    // const applications = await AdoptionApplication.findAll({
    //   include: [
    //     { model: User, as: 'user', attributes: ['user_id', 'username', 'email'] },
    //     { model: Animal, as: 'animal', attributes: ['animal_id', 'name', 'species'] }
    //   ],
    //   order: [['created_at', 'DESC']]
    // });

    res.json({
      success: true,
      applications,
      total: applications.length
    });
  } catch (error) {
    console.error('입양 신청 내역 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '입양 신청 내역 조회 중 오류가 발생했습니다.'
    });
  }
});

// 특정 사용자의 입양 신청 내역 조회
router.get('/users/:id/adoption-applications', adminAuth, async (req, res) => {
  const { id } = req.params;

  try {
    // 임시 응답 (실제 입양 신청 테이블이 구현되면 수정 필요)
    const applications = [];
    
    // TODO: 실제 입양 신청 모델과 연동
    // const applications = await AdoptionApplication.findAll({
    //   where: { user_id: id },
    //   include: [
    //     { model: Animal, as: 'animal', attributes: ['animal_id', 'name', 'species'] }
    //   ],
    //   order: [['created_at', 'DESC']]
    // });

    res.json({
      success: true,
      applications,
      userId: id,
      total: applications.length
    });
  } catch (error) {
    console.error('사용자 입양 신청 내역 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '입양 신청 내역 조회 중 오류가 발생했습니다.'
    });
  }
});

// 통계 데이터 조회
router.get('/statistics', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = totalUsers; // deleted_at 컬럼이 없으므로 모든 사용자가 활성 상태
    const deletedUsers = 0; // deleted_at 컬럼이 없으므로 삭제된 사용자는 0
    
    const totalAnimals = await Animal.count();
    
    // 최근 7일간 가입한 사용자 수
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { Op } = require('sequelize');
    const recentUsers = await User.count({
      where: {
        created_at: { [Op.gte]: sevenDaysAgo }
      }
    });

    res.json({
      success: true,
      statistics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          deleted: deletedUsers,
          recentSignups: recentUsers
        },
        animals: {
          total: totalAnimals
        }
      }
    });
  } catch (error) {
    console.error('통계 데이터 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '통계 데이터 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;