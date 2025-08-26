// 요청 로깅 미들웨어

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // 응답 완료 시 로그 출력
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? '🔴' : '🟢';
    
    console.log(
      `${logLevel} ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

// API 요청만 로깅하는 미들웨어
const apiLogger = (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return requestLogger(req, res, next);
  }
  next();
};

module.exports = {
  requestLogger,
  apiLogger
};