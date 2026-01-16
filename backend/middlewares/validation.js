import { body, validationResult, param, query } from 'express-validator';

// Validation middleware to check for errors
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validation failed",
            errors: errors.array(),
            success: false
        });
    }
    next();
};

// Custom validator to detect MongoDB injection operators
const noMongoOperators = (value) => {
    if (typeof value === 'object' && value !== null) {
        return false; // Reject objects
    }
    if (typeof value === 'string') {
        const mongoOperators = /(\$ne|\$gt|\$gte|\$lt|\$lte|\$in|\$nin|\$regex|\$where|\$exists|\$type|\$expr|\$jsonSchema|\$mod|\$text|\$search|\$lookup|\$group|\$project)/i;
        if (mongoOperators.test(value)) {
            throw new Error('Invalid characters detected');
        }
    }
    return true;
};

// User registration validation
export const registerValidation = [
    body('fullname')
        .trim()
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Full name must be between 2 and 50 characters')
        .custom(noMongoOperators),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .custom(noMongoOperators),
    body('phoneNumber')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
        .withMessage('Invalid phone number format. Use formats like +1234567890, (123) 456-7890, or 123-456-7890')
        .custom(noMongoOperators),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .custom(noMongoOperators),
    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['student', 'recruiter', 'admin']).withMessage('Role must be student, recruiter, or admin')
];

// User login validation
export const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .custom(noMongoOperators),
    body('password')
        .notEmpty().withMessage('Password is required')
        .custom(noMongoOperators),
    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['student', 'recruiter', 'admin']).withMessage('Role must be student, recruiter, or admin')
];

// Job posting validation
export const postJobValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Job title is required')
        .isLength({ min: 3, max: 100 }).withMessage('Job title must be between 3 and 100 characters'),
    body('description')
        .trim()
        .notEmpty().withMessage('Job description is required')
        .isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
    body('requirements')
        .notEmpty().withMessage('Requirements are required'),
    body('salary')
        .notEmpty().withMessage('Salary is required')
        .isNumeric().withMessage('Salary must be a number'),
    body('location')
        .trim()
        .notEmpty().withMessage('Location is required'),
    body('jobType')
        .trim()
        .notEmpty().withMessage('Job type is required'),
    body('experience')
        .notEmpty().withMessage('Experience level is required')
        .isNumeric().withMessage('Experience must be a number'),
    body('position')
        .notEmpty().withMessage('Position is required')
        .isNumeric().withMessage('Position must be a number'),
    body('companyId')
        .notEmpty().withMessage('Company ID is required')
];

// Company registration validation
export const registerCompanyValidation = [
    body('companyName')
        .trim()
        .notEmpty().withMessage('Company name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Company name must be between 2 and 100 characters')
];

// Company update validation
export const updateCompanyValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Company name must be between 2 and 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('website')
        .optional()
        .trim()
        .isURL().withMessage('Please provide a valid URL'),
    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Location must not exceed 100 characters')
];

// Application status update validation
export const updateStatusValidation = [
    body('status')
        .trim()
        .notEmpty().withMessage('Status is required')
        .isIn(['pending', 'accepted', 'rejected']).withMessage('Status must be pending, accepted, or rejected'),
    body('message')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Message must not exceed 500 characters')
];

// MongoDB ObjectId validation
// MongoDB ID validation
export const mongoIdValidation = (paramName = 'id') => [
    param(paramName)
        .notEmpty().withMessage(`${paramName} is required`)
        .isMongoId().withMessage(`Invalid ${paramName} format`)
];

// Update profile validation
export const updateProfileValidation = [
    body('fullname')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Full name must be between 2 and 50 characters'),
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Please provide a valid email'),
    body('phoneNumber')
        .optional()
        .trim()
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
        .withMessage('Invalid phone number format. Use formats like +1234567890, (123) 456-7890, or 123-456-7890'),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Bio must not exceed 500 characters'),
    body('skills')
        .optional()
        .isArray().withMessage('Skills must be an array')
];

// Email validation
export const emailValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
];

// Password reset validation
export const resetPasswordValidation = [
    body('token')
        .notEmpty().withMessage('Token is required'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

// Notification preferences validation
export const notificationPreferencesValidation = [
    body('jobAlerts')
        .optional()
        .isBoolean().withMessage('jobAlerts must be a boolean'),
    body('applicationUpdates')
        .optional()
        .isBoolean().withMessage('applicationUpdates must be a boolean'),
    body('newApplicants')
        .optional()
        .isBoolean().withMessage('newApplicants must be a boolean')
];

// Job alert preferences validation
export const jobAlertPreferencesValidation = [
    body('jobTypes')
        .optional()
        .isArray().withMessage('jobTypes must be an array'),
    body('jobTypes.*')
        .optional()
        .isIn(['Full Time', 'Part Time', 'Contract', 'Internship']).withMessage('Invalid job type'),
    body('locations')
        .optional()
        .isArray().withMessage('locations must be an array'),
    body('minSalary')
        .optional()
        .isNumeric().withMessage('minSalary must be a number')
        .isInt({ min: 0 }).withMessage('minSalary must be non-negative'),
    body('maxSalary')
        .optional()
        .isNumeric().withMessage('maxSalary must be a number')
        .isInt({ min: 0 }).withMessage('maxSalary must be non-negative')
];

// Pagination query validation
export const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Job search/filter validation
export const jobFilterValidation = [
    query('keyword')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Keyword must not exceed 100 characters'),
    query('location')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Location must not exceed 100 characters'),
    query('jobType')
        .optional()
        .trim(),
    query('minExperience')
        .optional()
        .isInt({ min: 0 }).withMessage('minExperience must be non-negative'),
    query('maxExperience')
        .optional()
        .isInt({ min: 0 }).withMessage('maxExperience must be non-negative'),
    query('minSalary')
        .optional()
        .isInt({ min: 0 }).withMessage('minSalary must be non-negative'),
    query('maxSalary')
        .optional()
        .isInt({ min: 0 }).withMessage('maxSalary must be non-negative')
];

// Cache pattern validation
export const cachePatternValidation = [
    body('pattern')
        .notEmpty().withMessage('Pattern is required')
        .isString().withMessage('Pattern must be a string')
        .matches(/^[a-zA-Z0-9:*_-]+$/).withMessage('Pattern contains invalid characters')
];
