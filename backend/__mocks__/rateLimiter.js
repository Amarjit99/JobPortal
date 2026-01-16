// Mock rate limiters for testing - bypass all rate limiting
export const authLimiter = (req, res, next) => next();
export const uploadLimiter = (req, res, next) => next();
export const apiLimiter = (req, res, next) => next();
export const jobLimiter = (req, res, next) => next();
export const applicationLimiter = (req, res, next) => next();
