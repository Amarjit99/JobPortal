import expressRecaptcha from 'express-recaptcha';
const Recaptcha = expressRecaptcha.RecaptchaV2;
import logger from '../utils/logger.js';

// Check if reCAPTCHA is configured
const hasRecaptchaConfig = process.env.RECAPTCHA_SITE_KEY && process.env.RECAPTCHA_SECRET_KEY;

// Initialize reCAPTCHA only if configured
let recaptcha = null;
if (hasRecaptchaConfig) {
    recaptcha = new Recaptcha(
        process.env.RECAPTCHA_SITE_KEY,
        process.env.RECAPTCHA_SECRET_KEY,
        { 
            callback: 'cb',
            hl: 'en'
        }
    );
    logger.info('reCAPTCHA initialized successfully');
} else {
    logger.warn('reCAPTCHA not configured - RECAPTCHA_SITE_KEY and RECAPTCHA_SECRET_KEY not found');
}

// Middleware to verify reCAPTCHA token
export const verifyCaptcha = async (req, res, next) => {
    try {
        // Skip captcha in test environment
        if (process.env.NODE_ENV === 'test') {
            return next();
        }

        // Check if captcha is disabled
        if (process.env.RECAPTCHA_ENABLED === 'false' || !hasRecaptchaConfig) {
            logger.info('reCAPTCHA is disabled or not configured - skipping verification');
            return next();
        }

        const captchaToken = req.body.captchaToken || req.body['g-recaptcha-response'];

        if (!captchaToken) {
            return res.status(400).json({
                success: false,
                message: 'Please complete the CAPTCHA verification'
            });
        }

        // Verify the token with Google
        recaptcha.verify(req, async (error, data) => {
            if (error) {
                logger.error('reCAPTCHA verification error:', error);
                return res.status(400).json({
                    success: false,
                    message: 'CAPTCHA verification failed. Please try again.'
                });
            }

            if (data && data.success) {
                logger.info('reCAPTCHA verification successful');
                next();
            } else {
                logger.warn('reCAPTCHA verification failed:', data);
                return res.status(400).json({
                    success: false,
                    message: 'CAPTCHA verification failed. Please try again.'
                });
            }
        });
    } catch (error) {
        logger.error('reCAPTCHA middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during CAPTCHA verification'
        });
    }
};

// Alternative method using fetch (more modern approach)
export const verifyCaptchaToken = async (token) => {
    try {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

        const response = await fetch(verifyUrl, {
            method: 'POST'
        });

        const data = await response.json();
        
        if (data.success) {
            logger.info('reCAPTCHA token verified successfully');
            return { success: true };
        } else {
            logger.error('reCAPTCHA verification failed. Error codes:', data['error-codes']);
            logger.error('Full response:', JSON.stringify(data));
            logger.error('Check if localhost is added to your reCAPTCHA domain list at https://www.google.com/recaptcha/admin');
            return { 
                success: false, 
                errors: data['error-codes'],
                message: 'CAPTCHA verification failed. Common causes: domain not whitelisted, invalid keys, or network issue.'
            };
        }
    } catch (error) {
        logger.error('reCAPTCHA token verification error:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
};

// Middleware using fetch method
export const verifyCaptchaMiddleware = async (req, res, next) => {
    // Skip CAPTCHA verification in test environment
    if (process.env.NODE_ENV === 'test') {
        return next();
    }
    
    try {
        // Skip captcha in test environment
        if (process.env.NODE_ENV === 'test') {
            return next();
        }

        // Check if captcha is disabled or not configured
        if (process.env.RECAPTCHA_ENABLED === 'false' || !hasRecaptchaConfig) {
            logger.info('reCAPTCHA is disabled or not configured - skipping verification');
            return next();
        }

        const captchaToken = req.body.captchaToken;

        if (!captchaToken) {
            logger.error('No CAPTCHA token provided in request body');
            return res.status(400).json({
                success: false,
                message: 'Please complete the CAPTCHA verification'
            });
        }

        logger.info('Verifying CAPTCHA token...');
        const result = await verifyCaptchaToken(captchaToken);

        if (result.success) {
            logger.info('CAPTCHA verification successful');
            next();
        } else {
            logger.error('CAPTCHA verification failed:', result);
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA verification failed. Please try again.',
                errors: result.errors
            });
        }
    } catch (error) {
        logger.error('reCAPTCHA middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during CAPTCHA verification'
        });
    }
};

export default recaptcha;
