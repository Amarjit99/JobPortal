import { SubAdmin } from '../models/subAdmin.model.js';
import { User } from '../models/user.model.js';
import logger from '../utils/logger.js';

/**
 * Check if user has required permission for a module/action
 * Works for both admin (full access) and sub-admin (permission-based)
 */
export const checkPermission = (module, action) => {
    return async (req, res, next) => {
        try {
            const userId = req.id;
            const user = req.user; // Assuming user is attached by isAuthenticated middleware
            
            // Check if user exists
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - No user ID found'
                });
            }

            // Admin has full access to everything
            if (user?.role === 'admin') {
                logger.info(`Admin access granted for ${module}:${action}`, { userId });
                return next();
            }

            // Sub-admin needs permission check
            if (user?.role === 'sub-admin') {
                const subAdmin = await SubAdmin.findOne({ 
                    userId,
                    isActive: true 
                });

                if (!subAdmin) {
                    logger.warn(`Inactive or non-existent sub-admin attempted access`, { userId });
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied - Sub-admin account not found or inactive'
                    });
                }

                // Check if sub-admin has the required permission
                if (subAdmin.hasPermission(module, action)) {
                    logger.info(`Sub-admin permission granted for ${module}:${action}`, { userId });
                    return next();
                }

                logger.warn(`Sub-admin permission denied for ${module}:${action}`, { userId });
                return res.status(403).json({
                    success: false,
                    message: `Access denied - You don't have permission to ${action} ${module}`
                });
            }

            // Neither admin nor sub-admin
            logger.warn(`Non-admin user attempted admin action`, { userId, role: user?.role });
            return res.status(403).json({
                success: false,
                message: 'Access denied - Admin or Sub-admin role required'
            });

        } catch (error) {
            logger.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error checking permissions',
                error: error.message
            });
        }
    };
};

/**
 * Check if user is admin (strict check, sub-admin not allowed)
 */
export const isAdmin = async (req, res, next) => {
    try {
        const userId = req.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - No user ID found'
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'admin') {
            return next();
        }

        logger.warn(`Non-admin user attempted admin-only action`, { 
            userId, 
            role: user.role 
        });

        return res.status(403).json({
            success: false,
            message: 'Access denied - Admin role required'
        });
    } catch (error) {
        logger.error('Admin check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking admin status',
            error: error.message
        });
    }
};

/**
 * Check if user is admin or sub-admin (any admin role)
 */
export const isAdminOrSubAdmin = async (req, res, next) => {
    try {
        const userId = req.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - No user ID found'
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'admin' || user.role === 'sub-admin') {
            return next();
        }

        logger.warn(`Non-admin user attempted admin/sub-admin action`, { 
            userId, 
            role: user.role 
        });

        return res.status(403).json({
            success: false,
            message: 'Access denied - Admin or Sub-admin role required'
        });
    } catch (error) {
        logger.error('Admin/Sub-admin check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking admin/sub-admin status',
            error: error.message
        });
    }
};

