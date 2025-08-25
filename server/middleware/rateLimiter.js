// Rate limiter temporarily disabled - empty middleware functions

const noOpMiddleware = (req, res, next) => next();

module.exports = {
    apiLimiter: noOpMiddleware,
    authLimiter: noOpMiddleware,
    sensitiveActionLimiter: noOpMiddleware,
    uploadLimiter: noOpMiddleware
};