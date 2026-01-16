import { SubAdmin } from '../models/subAdmin.model.js';
import logger from '../utils/logger.js';

/**
 * Middleware to check if user has specific permission
 * @param {string} module - The module to check (users, jobs, companies, etc.)
 * @param {string} action - The action to check (view, create, edit, delete, approve, reject)
 */
export const requirePermission = (module, action) => {
    return async (req, res, next) => {
        try {
            const userId = req.id;
            const userRole = req.userRole;
            
            // Full admins always have access
            if (userRole === 'admin') {
                return next();
            }
            
            // Sub-admins need to check permissions
            if (userRole === 'sub-admin') {
                const subAdmin = await SubAdmin.findOne({ userId, isActive: true });
                
                if (!subAdmin) {
                    logger.warn(`Sub-admin permissions not found for user ${userId}`);
                    return res.status(403).json({
                        success: false,
                        message: 'Sub-admin permissions not configured'
                    });
                }
                
                // Check if sub-admin has the required permission
                if (subAdmin.hasPermission(module, action)) {
                    return next();
                }
                
                logger.warn(`Permission denied for user ${userId}: ${module}.${action}`);
                return res.status(403).json({
                    success: false,
                    message: `You don't have permission to ${action} ${module}`,
                    required: { module, action }
                });
            }
            
            // Other roles don't have admin permissions
            return res.status(403).json({
                success: false,
                message: 'Admin or sub-admin access required'
            });
            
        } catch (error) {
            logger.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to verify permissions'
            });
        }
    };
};

/**
 * Middleware to check if user has any of the specified permissions
 * @param {Array} permissions - Array of {module, action} objects
 */
export const requireAnyPermission = (permissions) => {
    return async (req, res, next) => {
        try {
            const userId = req.id;
            const userRole = req.userRole;
            
            // Full admins always have access
            if (userRole === 'admin') {
                return next();
            }
            
            // Sub-admins need to check permissions
            if (userRole === 'sub-admin') {
                const subAdmin = await SubAdmin.findOne({ userId, isActive: true });
                
                if (!subAdmin) {
                    return res.status(403).json({
                        success: false,
                        message: 'Sub-admin permissions not configured'
                    });
                }
                
                // Check if sub-admin has any of the required permissions
                const hasAnyPermission = permissions.some(({ module, action }) => 
                    subAdmin.hasPermission(module, action)
                );
                
                if (hasAnyPermission) {
                    return next();
                }
                
                logger.warn(`Permission denied for user ${userId}: requires one of`, permissions);
                return res.status(403).json({
                    success: false,
                    message: 'You don\'t have any of the required permissions',
                    requiredAny: permissions
                });
            }
            
            // Other roles don't have admin permissions
            return res.status(403).json({
                success: false,
                message: 'Admin or sub-admin access required'
            });
            
        } catch (error) {
            logger.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to verify permissions'
            });
        }
    };
};

/**
 * Middleware to check if user has all of the specified permissions
 * @param {Array} permissions - Array of {module, action} objects
 */
export const requireAllPermissions = (permissions) => {
    return async (req, res, next) => {
        try {
            const userId = req.id;
            const userRole = req.userRole;
            
            // Full admins always have access
            if (userRole === 'admin') {
                return next();
            }
            
            // Sub-admins need to check permissions
            if (userRole === 'sub-admin') {
                const subAdmin = await SubAdmin.findOne({ userId, isActive: true });
                
                if (!subAdmin) {
                    return res.status(403).json({
                        success: false,
                        message: 'Sub-admin permissions not configured'
                    });
                }
                
                // Check if sub-admin has all required permissions
                const hasAllPermissions = permissions.every(({ module, action }) => 
                    subAdmin.hasPermission(module, action)
                );
                
                if (hasAllPermissions) {
                    return next();
                }
                
                logger.warn(`Permission denied for user ${userId}: requires all of`, permissions);
                return res.status(403).json({
                    success: false,
                    message: 'You don\'t have all the required permissions',
                    requiredAll: permissions
                });
            }
            
            // Other roles don't have admin permissions
            return res.status(403).json({
                success: false,
                message: 'Admin or sub-admin access required'
            });
            
        } catch (error) {
            logger.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to verify permissions'
            });
        }
    };
};

/**
 * Attach sub-admin permissions to request object for easy access
 */
export const attachPermissions = async (req, res, next) => {
    try {
        const userId = req.id;
        const userRole = req.userRole;
        
        if (userRole === 'admin') {
            req.permissions = 'all'; // Admins have all permissions
            return next();
        }
        
        if (userRole === 'sub-admin') {
            const subAdmin = await SubAdmin.findOne({ userId, isActive: true });
            if (subAdmin) {
                req.permissions = subAdmin.permissions;
                req.subAdminId = subAdmin._id;
            } else {
                req.permissions = [];
            }
        } else {
            req.permissions = [];
        }
        
        next();
    } catch (error) {
        logger.error('Attach permissions error:', error);
        req.permissions = [];
        next();
    }
};
