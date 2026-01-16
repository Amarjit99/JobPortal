import crypto from 'crypto';

// Store for CSRF tokens (in production, use Redis)
const csrfTokens = new Map();

// Token expiration time (15 minutes)
const TOKEN_EXPIRY = 15 * 60 * 1000;

/**
 * Generate a CSRF token
 */
export const generateCsrfToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Middleware to generate and attach CSRF token to session
 */
export const csrfProtection = (req, res, next) => {
    // Skip CSRF for GET, HEAD, OPTIONS requests (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Get token from header or body
    const token = req.headers['x-csrf-token'] || req.body._csrf;

    if (!token) {
        return res.status(403).json({
            success: false,
            message: 'CSRF token missing'
        });
    }

    // Verify token exists and is valid
    const storedTokenData = csrfTokens.get(token);

    if (!storedTokenData) {
        return res.status(403).json({
            success: false,
            message: 'Invalid CSRF token'
        });
    }

    // Check if token has expired
    if (Date.now() - storedTokenData.createdAt > TOKEN_EXPIRY) {
        csrfTokens.delete(token);
        return res.status(403).json({
            success: false,
            message: 'CSRF token expired'
        });
    }

    // Verify token belongs to this session/user
    if (storedTokenData.userId && req.id && storedTokenData.userId !== req.id) {
        return res.status(403).json({
            success: false,
            message: 'CSRF token mismatch'
        });
    }

    // Token is valid, proceed
    next();
};

/**
 * Create and store a new CSRF token
 */
export const createCsrfToken = (userId = null) => {
    const token = generateCsrfToken();
    
    csrfTokens.set(token, {
        userId,
        createdAt: Date.now()
    });

    // Clean up expired tokens periodically
    cleanupExpiredTokens();

    return token;
};

/**
 * Clean up expired tokens
 */
const cleanupExpiredTokens = () => {
    const now = Date.now();
    
    for (const [token, data] of csrfTokens.entries()) {
        if (now - data.createdAt > TOKEN_EXPIRY) {
            csrfTokens.delete(token);
        }
    }
};

/**
 * Invalidate a CSRF token
 */
export const invalidateCsrfToken = (token) => {
    csrfTokens.delete(token);
};

/**
 * Get CSRF token endpoint handler
 */
export const getCsrfToken = (req, res) => {
    const userId = req.id || null;
    const token = createCsrfToken(userId);

    return res.status(200).json({
        success: true,
        csrfToken: token
    });
};

// Cleanup expired tokens every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);

export default {
    csrfProtection,
    generateCsrfToken,
    createCsrfToken,
    invalidateCsrfToken,
    getCsrfToken
};
