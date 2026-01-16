import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import {
    getMyActivity,
    getCompanyActivity,
    getUserActivity,
    getActivityStats,
    logActivity,
    cleanupOldActivities
} from "../controllers/activity.controller.js";
import { validate, mongoIdValidation } from "../middlewares/validation.js";
import { readLimiter, writeLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Get my activity timeline
router.route("/my-activity")
    .get(isAuthenticated, readLimiter, getMyActivity);

// Get activity statistics
router.route("/stats")
    .get(isAuthenticated, readLimiter, getActivityStats);

// Log activity (manual or webhook)
router.route("/log")
    .post(isAuthenticated, writeLimiter, logActivity);

// Cleanup old activities
router.route("/cleanup")
    .delete(isAuthenticated, writeLimiter, cleanupOldActivities);

// Get company activity (recruiter only)
router.route("/company/:companyId")
    .get(isAuthenticated, readLimiter, ...mongoIdValidation('companyId'), validate, getCompanyActivity);

// Get user activity (admin only)
router.route("/user/:targetUserId")
    .get(isAuthenticated, isAdmin, readLimiter, ...mongoIdValidation('targetUserId'), validate, getUserActivity);

export default router;
