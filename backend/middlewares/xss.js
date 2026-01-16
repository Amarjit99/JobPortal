/**
 * XSS Protection Middleware
 * Sanitizes all string inputs to prevent cross-site scripting attacks
 */

let DOMPurify;
let purifyInitialized = false;

/**
 * Lazy-load DOMPurify to avoid Jest import issues
 */
async function initializePurify() {
    if (purifyInitialized) return;
    
    try {
        const { JSDOM } = await import('jsdom');
        const createDOMPurify = (await import('dompurify')).default;
        const window = new JSDOM('').window;
        DOMPurify = createDOMPurify(window);
        purifyInitialized = true;
    } catch (error) {
        console.warn('XSS Protection: Using fallback sanitization (DOMPurify unavailable)');
        purifyInitialized = true; // Mark as initialized to avoid retry
    }
}

/**
 * Sanitize HTML content to prevent XSS
 */
export const sanitizeHtml = (html) => {
    if (!html || typeof html !== 'string') return html;
    
    // Use DOMPurify if available
    if (DOMPurify) {
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: [], // Strip ALL HTML tags
            ALLOWED_ATTR: []
        });
    }
    
    // Fallback: Basic HTML entity encoding
    return html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
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
 * Universal XSS Protection Middleware
 * Sanitizes all string inputs in req.body, req.query, req.params
 */
export const xssProtection = async (req, res, next) => {
    try {
        // Initialize DOMPurify on first use
        await initializePurify();
        
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
    } catch (error) {
        console.error('XSS Protection error:', error);
        next(); // Continue even if sanitization fails
    }
};

export default {
    sanitizeHtml,
    xssProtection,
    sanitizeObject
};
