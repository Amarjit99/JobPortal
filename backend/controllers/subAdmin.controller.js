import { User } from '../models/user.model.js';
import { SubAdmin } from '../models/subAdmin.model.js';
import logger from '../utils/logger.js';
import { PERMISSION_TEMPLATES, getTemplate, getTemplateNames, validatePermissions } from '../utils/permissionTemplates.js';

/**
 * Create a new sub-admin
 * POST /api/v1/admin/sub-admins
 */
export const createSubAdmin = async (req, res) => {
    try {
        const { userId, permissions, template, notes } = req.body;
        const adminId = req.id;

        // Validate input - either permissions or template must be provided
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        let finalPermissions;
        
        // If template is provided, use template permissions
        if (template) {
            const templateData = getTemplate(template);
            if (!templateData) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid template. Available templates: ${getTemplateNames().join(', ')}`
                });
            }
            finalPermissions = templateData.permissions;
        } else if (permissions && Array.isArray(permissions) && permissions.length > 0) {
            // Validate custom permissions
            const validation = validatePermissions(permissions);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    message: validation.error
                });
            }
            finalPermissions = permissions;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Either template or custom permissions array is required'
            });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is not already an admin or sub-admin
        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot assign sub-admin permissions to an admin user'
            });
        }

        // Check if user already has sub-admin permissions
        const existingSubAdmin = await SubAdmin.findOne({ userId });
        if (existingSubAdmin) {
            return res.status(400).json({
                success: false,
                message: 'User already has sub-admin permissions. Use update endpoint to modify.'
            });
        }

        // Create sub-admin entry
        const subAdmin = await SubAdmin.create({
            userId,
            permissions: finalPermissions,
            assignedBy: adminId,
            notes: notes || (template ? `Created with template: ${template}` : '')
        });

        // Update user role to sub-admin
        user.role = 'sub-admin';
        await user.save();

        logger.info(`Sub-admin created: ${user.email} by admin: ${adminId}${template ? ` with template: ${template}` : ''}`);

        res.status(201).json({
            success: true,
            message: 'Sub-admin created successfully',
            data: {
                subAdmin,
                user: {
                    _id: user._id,
                    fullname: user.fullname,
                    email: user.email,
                    role: user.role
                },
                template: template || 'custom'
            }
        });
    } catch (error) {
        logger.error('Create sub-admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create sub-admin',
            error: error.message
        });
    }
};

/**
 * Get all sub-admins
 * GET /api/v1/admin/sub-admins
 */
export const getAllSubAdmins = async (req, res) => {
    try {
        const { isActive } = req.query;

        const filter = {};
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        const subAdmins = await SubAdmin.find(filter)
            .populate('userId', 'fullname email phoneNumber createdAt')
            .populate('assignedBy', 'fullname email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: subAdmins.length,
            data: subAdmins
        });
    } catch (error) {
        logger.error('Get all sub-admins error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sub-admins',
            error: error.message
        });
    }
};

/**
 * Get sub-admin by ID
 * GET /api/v1/admin/sub-admins/:id
 */
export const getSubAdminById = async (req, res) => {
    try {
        const { id } = req.params;

        const subAdmin = await SubAdmin.findById(id)
            .populate('userId', 'fullname email phoneNumber role createdAt')
            .populate('assignedBy', 'fullname email');

        if (!subAdmin) {
            return res.status(404).json({
                success: false,
                message: 'Sub-admin not found'
            });
        }

        res.status(200).json({
            success: true,
            data: subAdmin
        });
    } catch (error) {
        logger.error('Get sub-admin by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sub-admin',
            error: error.message
        });
    }
};

/**
 * Update sub-admin permissions
 * PUT /api/v1/admin/sub-admins/:id
 */
export const updateSubAdminPermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions, isActive, notes } = req.body;

        const subAdmin = await SubAdmin.findById(id);
        if (!subAdmin) {
            return res.status(404).json({
                success: false,
                message: 'Sub-admin not found'
            });
        }

        // Update permissions if provided
        if (permissions) {
            // Validate permissions structure
            for (const perm of permissions) {
                if (!perm.module || !perm.actions || !Array.isArray(perm.actions)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid permission structure'
                    });
                }
            }
            subAdmin.permissions = permissions;
        }

        // Update active status if provided
        if (isActive !== undefined) {
            subAdmin.isActive = isActive;
        }

        // Update notes if provided
        if (notes !== undefined) {
            subAdmin.notes = notes;
        }

        await subAdmin.save();

        logger.info(`Sub-admin updated: ${subAdmin.userId} by admin: ${req.id}`);

        res.status(200).json({
            success: true,
            message: 'Sub-admin updated successfully',
            data: subAdmin
        });
    } catch (error) {
        logger.error('Update sub-admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update sub-admin',
            error: error.message
        });
    }
};

/**
 * Delete/Remove sub-admin
 * DELETE /api/v1/admin/sub-admins/:id
 */
export const deleteSubAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const subAdmin = await SubAdmin.findById(id);
        if (!subAdmin) {
            return res.status(404).json({
                success: false,
                message: 'Sub-admin not found'
            });
        }

        // Get user and revert role
        const user = await User.findById(subAdmin.userId);
        if (user && user.role === 'sub-admin') {
            // Revert to student role (or let admin choose)
            user.role = 'student';
            await user.save();
        }

        // Delete sub-admin record
        await SubAdmin.findByIdAndDelete(id);

        logger.info(`Sub-admin deleted: ${subAdmin.userId} by admin: ${req.id}`);

        res.status(200).json({
            success: true,
            message: 'Sub-admin removed successfully'
        });
    } catch (error) {
        logger.error('Delete sub-admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete sub-admin',
            error: error.message
        });
    }
};

/**
 * Get sub-admin's own permissions (for logged-in sub-admin)
 * GET /api/v1/admin/sub-admins/me/permissions
 */
export const getMyPermissions = async (req, res) => {
    try {
        const userId = req.id;

        const subAdmin = await SubAdmin.findOne({ userId, isActive: true });

        if (!subAdmin) {
            return res.status(404).json({
                success: false,
                message: 'Sub-admin permissions not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                permissions: subAdmin.permissions,
                accessibleModules: subAdmin.getAccessibleModules()
            }
        });
    } catch (error) {
        logger.error('Get my permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch permissions',
            error: error.message
        });
    }
};

/**
 * Get available permission templates
 * GET /api/v1/admin/sub-admins/templates
 */
export const getPermissionTemplates = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                templates: PERMISSION_TEMPLATES,
                available: getTemplateNames()
            }
        });
    } catch (error) {
        logger.error('Get permission templates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch templates',
            error: error.message
        });
    }
};
