// 글로벌 에러 핸들러 미들웨어

const errorHandler = (error, req, res, next) => {
  console.error('🔴 Error:', error);

  // Sequelize 에러 처리
  if (error.name === 'SequelizeValidationError') {
    const formattedErrors = {};
    error.errors.forEach(err => {
      formattedErrors[err.path] = err.message;
    });

    return res.status(400).json({
      success: false,
      message: '데이터 검증 오류',
      errors: formattedErrors
    });
  }

  // Sequelize 중복 키 에러
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0]?.path || 'field';
    return res.status(409).json({
      success: false,
      message: '중복된 데이터입니다.',
      errors: { [field]: '이미 사용 중인 값입니다.' }
    });
  }

  // JWT 에러 처리
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다.',
      errors: { token: '토큰이 유효하지 않습니다.' }
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '토큰이 만료되었습니다.',
      errors: { token: '토큰이 만료되었습니다.' }
    });
  }

  // 기본 에러
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || '서버 내부 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'production' ? undefined : error.stack
  });
};

// 404 핸들러
const notFoundHandler = (req, res, next) => {
  const error = new Error(`요청한 경로 ${req.originalUrl}를 찾을 수 없습니다.`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFoundHandler
};