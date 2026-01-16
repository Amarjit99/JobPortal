import { body, param, query, validationResult } from 'express-validator';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitize HTML content to prevent XSS
 */
export const sanitizeHtml = (html) => {
    if (!html || typeof html !== 'string') return html;
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [], // Strip ALL HTML tags for maximum security
        ALLOWED_ATTR: []
    });
};

/**
 * Universal XSS Protection Middleware
 * Sanitizes all string inputs in req.body, req.query, req.params
 */
export const xssProtection = (req, res, next) => {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params);
    }
    
    next();
};

/**
 * Recursively sanitize all string properties in an object
 */
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => {
            if (typeof item === 'string') {
                return sanitizeHtml(item);
            } else if (typeof item === 'object' && item !== null) {
                return sanitizeObject(item);
            }
            return item;
        });
    }
    
    const sanitized = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            
            if (typeof value === 'string') {
                sanitized[key] = sanitizeHtml(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
    }
    
    return sanitized;
}

/**
 * Common sanitization chains
 */
export const sanitizers = {
    // Sanitize string: trim, escape HTML
    string: (field) => body(field).trim().escape(),
    
    // Sanitize email
    email: (field) => body(field).trim().normalizeEmail().isEmail(),
    
    // Sanitize URL
    url: (field) => body(field).trim().isURL({
        protocols: ['http', 'https'],
        require_protocol: true
    }),
    
    // Sanitize phone number
    phone: (field) => body(field).trim().isMobilePhone(),
    
    // Sanitize integer
    integer: (field) => body(field).toInt().isInt(),
    
    // Sanitize float
    float: (field) => body(field).toFloat().isFloat(),
    
    // Sanitize boolean
    boolean: (field) => body(field).toBoolean(),
    
    // Sanitize MongoDB ObjectId
    mongoId: (field) => param(field).trim().isMongoId(),
    
    // Sanitize query string
    queryString: (field) => query(field).trim().escape(),
};

/**
 * Enhanced validation middleware with sanitization
 */
export const enhancedValidators = {
    // User registration
    register: [
        body('fullname')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Full name must be between 2 and 100 characters')
            .matches(/^[a-zA-Z\s]+$/)
            .withMessage('Full name can only contain letters and spaces'),
        
        body('email')
            .trim()
            .normalizeEmail()
            .isEmail()
            .withMessage('Invalid email format')
            .isLength({ max: 255 })
            .withMessage('Email is too long'),
        
        body('phoneNumber')
            .optional()
            .trim()
            .isMobilePhone()
            .withMessage('Invalid phone number'),
        
        body('password')
            .isLength({ min: 8, max: 128 })
            .withMessage('Password must be between 8 and 128 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain uppercase, lowercase, number, and special character'),
        
        body('role')
            .trim()
            .isIn(['student', 'recruiter'])
            .withMessage('Invalid role')
    ],

    // Job posting
    jobPost: [
        body('title')
            .trim()
            .isLength({ min: 3, max: 200 })
            .withMessage('Job title must be between 3 and 200 characters')
            .escape(),
        
        body('description')
            .trim()
            .isLength({ min: 50, max: 5000 })
            .withMessage('Description must be between 50 and 5000 characters')
            .customSanitizer(value => sanitizeHtml(value)),
        
        body('requirements')
            .isString()
            .isLength({ max: 2000 })
            .withMessage('Requirements are too long'),
        
        body('salary')
            .toInt()
            .isInt({ min: 0, max: 10000000 })
            .withMessage('Invalid salary range'),
        
        body('location')
            .trim()
            .isLength({ min: 2, max: 200 })
            .withMessage('Location must be between 2 and 200 characters')
            .escape(),
        
        body('jobType')
            .trim()
            .isLength({ max: 100 })
            .escape(),
        
        body('position')
            .toInt()
            .isInt({ min: 1, max: 1000 })
            .withMessage('Invalid position count'),
        
        body('experienceLevel')
            .toInt()
            .isInt({ min: 0, max: 50 })
            .withMessage('Invalid experience level')
    ],

    // Company registration
    companyRegister: [
        body('companyName')
            .trim()
            .isLength({ min: 2, max: 200 })
            .withMessage('Company name must be between 2 and 200 characters')
            .escape(),
        
        body('description')
            .optional()
            .trim()
            .isLength({ max: 2000 })
            .withMessage('Description is too long')
            .customSanitizer(value => sanitizeHtml(value)),
        
        body('website')
            .optional()
            .trim()
            .isURL({ protocols: ['http', 'https'], require_protocol: true })
            .withMessage('Invalid website URL')
            .isLength({ max: 500 })
    ],

    // Message sending
    sendMessage: [
        body('content')
            .trim()
            .isLength({ min: 1, max: 5000 })
            .withMessage('Message must be between 1 and 5000 characters')
            .escape(),
        
        body('receiverId')
            .trim()
            .isMongoId()
            .withMessage('Invalid receiver ID')
    ],

    // Application note
    addNote: [
        body('noteText')
            .trim()
            .isLength({ min: 1, max: 2000 })
            .withMessage('Note must be between 1 and 2000 characters')
            .escape()
    ],

    // Search query
    searchQuery: [
        query('keyword')
            .optional()
            .trim()
            .isLength({ max: 200 })
            .withMessage('Search keyword is too long')
            .escape(),
        
        query('location')
            .optional()
            .trim()
            .isLength({ max: 200 })
            .escape(),
        
        query('page')
            .optional()
            .toInt()
            .isInt({ min: 1, max: 1000 })
            .withMessage('Invalid page number'),
        
        query('limit')
            .optional()
            .toInt()
            .isInt({ min: 1, max: 100 })
            .withMessage('Invalid limit')
    ]
};

/**
 * Validation result handler
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => ({
            field: err.path,
            message: err.msg
        }));
        
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errorMessages
        });
    }
    
    next();
};

/**
 * Sanitize all string inputs in request body
 */
export const sanitizeAllInputs = (req, res, next) => {
    const sanitizeObject = (obj) => {
        Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'string') {
                obj[key] = obj[key].trim();
                // Remove null bytes
                obj[key] = obj[key].replace(/\0/g, '');
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        });
    };

    if (req.body && typeof req.body === 'object') {
        sanitizeObject(req.body);
    }

    next();
};

export default {
    sanitizeHtml,
    sanitizers,
    enhancedValidators,
    handleValidationErrors,
    sanitizeAllInputs
};
