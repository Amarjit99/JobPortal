import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    deleteAllNotifications,
    getNotificationPreferences,
    updateNotificationPreferences
} from "../controllers/notification.controller.js";
import { validate, mongoIdValidation } from "../middlewares/validation.js";
import { readLimiter, writeLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Get notifications with filters
router.route("/")
    .get(isAuthenticated, readLimiter, getMyNotifications);

// Get unread count
router.route("/unread-count")
    .get(isAuthenticated, readLimiter, getUnreadCount);

// Mark all as read
router.route("/read-all")
    .put(isAuthenticated, writeLimiter, markAllAsRead);

// Delete all notifications
router.route("/delete-all")
    .delete(isAuthenticated, writeLimiter, deleteAllNotifications);

// Notification preferences
router.route("/preferences")
    .get(isAuthenticated, readLimiter, getNotificationPreferences)
    .put(isAuthenticated, writeLimiter, updateNotificationPreferences);

// Mark single notification as read
router.route("/:id/read")
    .put(isAuthenticated, writeLimiter, ...mongoIdValidation('id'), validate, markAsRead);

// Archive notification
router.route("/:id/archive")
    .put(isAuthenticated, writeLimiter, ...mongoIdValidation('id'), validate, archiveNotification);

// Delete single notification
router.route("/:id")
    .delete(isAuthenticated, writeLimiter, ...mongoIdValidation('id'), validate, deleteNotification);

export default router;
