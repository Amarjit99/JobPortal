import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";
import logger from "../utils/logger.js";
import { emitToUser } from "../utils/socket.js";

/**
 * Get all notifications for logged-in user
 * @route GET /api/v1/notifications
 */
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.id;
        const {
            page = 1,
            limit = 20,
            type,
            priority,
            isRead,
            isArchived = false
        } = req.query;

        // Build filter query
        const filter = {
            recipient: userId,
            isArchived: isArchived === 'true'
        };

        if (type) filter.type = type;
        if (priority) filter.priority = priority;
        if (isRead !== undefined) filter.isRead = isRead === 'true';

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notifications = await Notification.find(filter)
            .populate('sender', 'fullname profile.profilePhoto')
            .populate('relatedJob', 'title company')
            .populate('relatedCompany', 'name logo')
            .sort({ priority: -1, createdAt: -1 }) // High priority first, then newest
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Notification.countDocuments(filter);

        // Get unread count
        const unreadCount = await Notification.getUnreadCount(userId);

        return res.status(200).json({
            message: "Notifications retrieved successfully",
            notifications,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
                hasMore: skip + notifications.length < total
            },
            unreadCount,
            success: true
        });

    } catch (error) {
        logger.error('Error fetching notifications:', error);
        return res.status(500).json({
            message: "Failed to fetch notifications",
            success: false
        });
    }
};

/**
 * Get unread notification count
 * @route GET /api/v1/notifications/unread-count
 */
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.id;

        const unreadCount = await Notification.getUnreadCount(userId);
        const unreadByType = await Notification.getUnreadCountByType(userId);

        return res.status(200).json({
            message: "Unread count retrieved successfully",
            unreadCount,
            unreadByType,
            success: true
        });

    } catch (error) {
        logger.error('Error getting unread count:', error);
        return res.status(500).json({
            message: "Failed to get unread count",
            success: false
        });
    }
};

/**
 * Mark a notification as read
 * @route PUT /api/v1/notifications/:id/read
 */
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;

        const notification = await Notification.findOne({
            _id: id,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found",
                success: false
            });
        }

        await notification.markAsRead();

        // Get updated unread count
        const unreadCount = await Notification.getUnreadCount(userId);

        // Emit updated count via WebSocket
        emitToUser(userId, 'notification_count', { unreadCount });

        return res.status(200).json({
            message: "Notification marked as read",
            notification,
            unreadCount,
            success: true
        });

    } catch (error) {
        logger.error('Error marking notification as read:', error);
        return res.status(500).json({
            message: "Failed to mark notification as read",
            success: false
        });
    }
};

/**
 * Mark all notifications as read
 * @route PUT /api/v1/notifications/read-all
 */
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.id;
        const { type, priority } = req.body;

        const filters = {};
        if (type) filters.type = type;
        if (priority) filters.priority = priority;

        const result = await Notification.markAllAsRead(userId, filters);

        // Get updated unread count
        const unreadCount = await Notification.getUnreadCount(userId);

        // Emit updated count via WebSocket
        emitToUser(userId, 'notification_count', { unreadCount });

        logger.info(`User ${userId} marked ${result.modifiedCount} notifications as read`);

        return res.status(200).json({
            message: `${result.modifiedCount} notifications marked as read`,
            modifiedCount: result.modifiedCount,
            unreadCount,
            success: true
        });

    } catch (error) {
        logger.error('Error marking all notifications as read:', error);
        return res.status(500).json({
            message: "Failed to mark all notifications as read",
            success: false
        });
    }
};

/**
 * Archive a notification
 * @route PUT /api/v1/notifications/:id/archive
 */
export const archiveNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;

        const notification = await Notification.findOne({
            _id: id,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found",
                success: false
            });
        }

        await notification.archive();

        return res.status(200).json({
            message: "Notification archived",
            notification,
            success: true
        });

    } catch (error) {
        logger.error('Error archiving notification:', error);
        return res.status(500).json({
            message: "Failed to archive notification",
            success: false
        });
    }
};

/**
 * Delete a notification
 * @route DELETE /api/v1/notifications/:id
 */
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;

        const notification = await Notification.findOneAndDelete({
            _id: id,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found",
                success: false
            });
        }

        // Get updated unread count
        const unreadCount = await Notification.getUnreadCount(userId);

        logger.info(`User ${userId} deleted notification ${id}`);

        return res.status(200).json({
            message: "Notification deleted successfully",
            unreadCount,
            success: true
        });

    } catch (error) {
        logger.error('Error deleting notification:', error);
        return res.status(500).json({
            message: "Failed to delete notification",
            success: false
        });
    }
};

/**
 * Delete all notifications (with optional filters)
 * @route DELETE /api/v1/notifications/delete-all
 */
export const deleteAllNotifications = async (req, res) => {
    try {
        const userId = req.id;
        const { type, isRead } = req.query;

        const filter = { recipient: userId };
        if (type) filter.type = type;
        if (isRead !== undefined) filter.isRead = isRead === 'true';

        const result = await Notification.deleteMany(filter);

        logger.info(`User ${userId} deleted ${result.deletedCount} notifications`);

        return res.status(200).json({
            message: `${result.deletedCount} notifications deleted`,
            deletedCount: result.deletedCount,
            success: true
        });

    } catch (error) {
        logger.error('Error deleting all notifications:', error);
        return res.status(500).json({
            message: "Failed to delete notifications",
            success: false
        });
    }
};

/**
 * Get notification preferences
 * @route GET /api/v1/notifications/preferences
 */
export const getNotificationPreferences = async (req, res) => {
    try {
        const userId = req.id;

        const user = await User.findById(userId).select('emailNotifications pushNotifications');

        return res.status(200).json({
            message: "Notification preferences retrieved",
            preferences: {
                email: user.emailNotifications || {},
                push: user.pushNotifications || {}
            },
            success: true
        });

    } catch (error) {
        logger.error('Error getting notification preferences:', error);
        return res.status(500).json({
            message: "Failed to get notification preferences",
            success: false
        });
    }
};

/**
 * Update notification preferences
 * @route PUT /api/v1/notifications/preferences
 */
export const updateNotificationPreferences = async (req, res) => {
    try {
        const userId = req.id;
        const { emailNotifications, pushNotifications } = req.body;

        const updateData = {};
        if (emailNotifications) updateData.emailNotifications = emailNotifications;
        if (pushNotifications) updateData.pushNotifications = pushNotifications;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('emailNotifications pushNotifications');

        logger.info(`User ${userId} updated notification preferences`);

        return res.status(200).json({
            message: "Notification preferences updated",
            preferences: {
                email: user.emailNotifications,
                push: user.pushNotifications
            },
            success: true
        });

    } catch (error) {
        logger.error('Error updating notification preferences:', error);
        return res.status(500).json({
            message: "Failed to update notification preferences",
            success: false
        });
    }
};

/**
 * Helper function to create and emit notification
 * Used internally by other controllers
 */
export const createNotification = async (notificationData) => {
    try {
        const notification = await Notification.createNotification(notificationData);

        // Emit real-time notification via WebSocket
        emitToUser(notification.recipient, 'new_notification', {
            notification: await notification.populate([
                { path: 'sender', select: 'fullname profile.profilePhoto' },
                { path: 'relatedJob', select: 'title company' },
                { path: 'relatedCompany', select: 'name logo' }
            ])
        });

        // Get updated unread count
        const unreadCount = await Notification.getUnreadCount(notification.recipient);
        emitToUser(notification.recipient, 'notification_count', { unreadCount });

        logger.info(`Notification created: ${notification.type} for user ${notification.recipient}`);

        return notification;
    } catch (error) {
        logger.error('Error creating notification:', error);
        throw error;
    }
};

export default {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    deleteAllNotifications,
    getNotificationPreferences,
    updateNotificationPreferences,
    createNotification
};
