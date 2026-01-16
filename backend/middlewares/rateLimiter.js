import rateLimit from 'express-rate-limit';

const isTestEnv = process.env.NODE_ENV === 'test';
const mockLimiter = (req, res, next) => next();

// General API rate limiter
export const apiLimiter = isTestEnv ? mockLimiter : rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        message: 'Too many requests from this IP, please try again later.',
        success: false
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for authentication routes
export const authLimiter = isTestEnv ? mockLimiter : rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs for login/register
    skipSuccessfulRequests: true, // Don't count successful requests
    message: {
        message: 'Too many authentication attempts, please try again after 15 minutes.',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for file uploads
export const uploadLimiter = isTestEnv ? mockLimiter : rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 uploads per hour
    message: {
        message: 'Too many file uploads, please try again later.',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for job operations (posting, updating)
export const jobWriteLimiter = isTestEnv ? mockLimiter : rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit to 20 job posts/updates per hour
    message: {
        message: 'Too many job operations, please try again later.',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for read operations (searching, browsing)
export const readLimiter = isTestEnv ? mockLimiter : rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit to 200 read requests per 15 minutes
    message: {
        message: 'Too many requests, please slow down.',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for application submissions
export const applicationLimiter = isTestEnv ? mockLimiter : rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit to 10 applications per hour
    message: {
        message: 'Too many job applications, please try again later.',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for company operations
export const companyWriteLimiter = isTestEnv ? mockLimiter : rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 15, // Limit to 15 company operations per hour
    message: {
        message: 'Too many company operations, please try again later.',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for analytics and cache operations
export const adminLimiter = isTestEnv ? mockLimiter : rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit to 50 admin operations per 15 minutes
    message: {
        message: 'Too many admin requests, please try again later.',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General write operations limiter
export const writeLimiter = isTestEnv ? mockLimiter : rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // Limit to 30 write operations per minute
    message: {
        message: 'Too many write requests, please try again later.',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
});
