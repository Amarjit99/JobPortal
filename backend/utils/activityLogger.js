import { ActivityLog } from "../models/activityLog.model.js";

/**
 * Helper function to log admin activities
 * @param {Object} logData - Activity log data
 * @param {String} logData.performedBy - Admin user ID
 * @param {String} logData.action - Action performed
 * @param {String} logData.targetType - Type of target (User, Company, Job, etc.)
 * @param {String} logData.targetId - ID of the target
 * @param {String} logData.targetName - Name of target for quick reference
 * @param {Object} logData.details - Additional details
 * @param {String} logData.ipAddress - IP address
 * @param {String} logData.userAgent - User agent string
 */
export const logActivity = async (logData) => {
    try {
        await ActivityLog.create({
            performedBy: logData.performedBy,
            action: logData.action,
            targetType: logData.targetType,
            targetId: logData.targetId,
            targetName: logData.targetName,
            details: logData.details || {},
            ipAddress: logData.ipAddress,
            userAgent: logData.userAgent,
            status: 'success'
        });
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw - logging failures shouldn't break the main operation
    }
};

/**
 * Middleware to extract IP and user agent from request
 */
export const getRequestMetadata = (req) => {
    return {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
    };
};

export default {
    logActivity,
    getRequestMetadata
};
