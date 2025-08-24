// middleware/index.js - 중앙 집중식 middleware export

const { authMiddleware, optionalAuthMiddleware } = require('./auth');
const { errorHandler, notFoundHandler } = require('./errorHandler');
const { requestLogger, apiLogger } = require('./logger');

module.exports = {
  // Auth middlewares
  authMiddleware,
  optionalAuthMiddleware,
  
  // Error handling middlewares
  errorHandler,
  notFoundHandler,
  
  // Logging middlewares
  requestLogger,
  apiLogger
};