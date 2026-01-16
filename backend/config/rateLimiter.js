import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        message: 'Too many requests from this IP, please try again later.',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limiter for authentication routes
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: {
        message: 'Too many authentication attempts, please try again after 15 minutes.',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for file uploads
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: {
        message: 'Too many upload requests, please try again later.',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for job/company write operations
export const jobWriteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: {
        message: 'Too many job posting requests, please try again later.',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const companyWriteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: {
        message: 'Too many company operations, please try again later.',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for application submissions
export const applicationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 30,
    message: {
        message: 'Too many application submissions, please try again later.',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Lenient rate limiter for read operations
export const readLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
        message: 'Too many requests, please slow down.',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Admin operations rate limiter
export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
        message: 'Too many admin requests, please try again later.',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
});
