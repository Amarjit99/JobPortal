/**
 * @swagger
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: token
 */

import express from "express";
import { 
    login, 
    logout, 
    register, 
    updateProfile, 
    verifyEmail, 
    resendVerification, 
    forgotPassword, 
    resetPassword,
    refreshAccessToken,
    saveJob,
    unsaveJob,
    getSavedJobs,
    updateEmailNotifications,
    updateJobAlertPreferences,
    getNotificationPreferences,
    getAllUsers,
    getProfileCompletion
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload } from "../middlewares/multer.js";
import { verifyCaptchaMiddleware } from "../middlewares/recaptcha.js";
import { isAdmin } from "../middlewares/checkPermission.js";
import { 
    registerValidation, 
    loginValidation, 
    validate, 
    mongoIdValidation,
    updateProfileValidation,
    emailValidation,
    resetPasswordValidation,
    notificationPreferencesValidation,
    jobAlertPreferencesValidation
} from "../middlewares/validation.js";
import { authLimiter, uploadLimiter } from "../middlewares/rateLimiter.js";
 
const router = express.Router();

/**
 * @swagger
 * /api/v1/user/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [fullname, email, phoneNumber, password, role]
 *             properties:
 *               fullname: { type: string }
 *               email: { type: string, format: email }
 *               phoneNumber: { type: string }
 *               password: { type: string, format: password }
 *               role: { type: string, enum: [student, recruiter] }
 *               file: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Account created successfully, verification email sent
 */
router.route("/register").post(authLimiter, singleUpload, verifyCaptchaMiddleware, registerValidation, validate, register);

/**
 * @swagger
 * /api/v1/user/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *       403:
 *         description: Email not verified
 */
router.route("/login").post(authLimiter, verifyCaptchaMiddleware, loginValidation, validate, login);

router.route("/logout").get(logout);
router.route("/profile/update").post(isAuthenticated, uploadLimiter, singleUpload, updateProfileValidation, validate, updateProfile);

// Saved jobs routes
router.route("/save-job").post(isAuthenticated, saveJob);
router.route("/unsave-job").post(isAuthenticated, unsaveJob);
router.route("/saved-jobs").get(isAuthenticated, getSavedJobs);

/**
 * @swagger
 * /api/v1/user/verify-email:
 *   get:
 *     tags: [Email Verification]
 *     summary: Verify user email
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.route("/verify-email").get(verifyEmail);

/**
 * @swagger
 * /api/v1/user/resend-verification:
 *   post:
 *     tags: [Email Verification]
 *     summary: Resend verification email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Verification email sent
 */
router.route("/resend-verification").post(authLimiter, emailValidation, validate, resendVerification);

/**
 * @swagger
 * /api/v1/user/forgot-password:
 *   post:
 *     tags: [Email Verification]
 *     summary: Request password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Reset link sent if account exists
 */
router.route("/forgot-password").post(authLimiter, verifyCaptchaMiddleware, emailValidation, validate, forgotPassword);

/**
 * @swagger
 * /api/v1/user/reset-password:
 *   post:
 *     tags: [Email Verification]
 *     summary: Reset password
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.route("/reset-password").post(authLimiter, resetPasswordValidation, validate, resetPassword);

/**
 * @swagger
 * /api/v1/user/refresh-token:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     description: Get a new access token using refresh token from cookies
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *       401:
 *         description: Invalid or missing refresh token
 */
router.route("/refresh-token").post(refreshAccessToken);

// Email notification preference routes
router.route("/email-notifications").put(isAuthenticated, notificationPreferencesValidation, validate, updateEmailNotifications);
router.route("/job-alert-preferences").put(isAuthenticated, jobAlertPreferencesValidation, validate, updateJobAlertPreferences);
router.route("/notification-preferences").get(isAuthenticated, getNotificationPreferences);

// Get all users (for admin to create sub-admins) - admin only
router.route("/all").get(isAuthenticated, isAdmin, getAllUsers);

// Profile completion route
/**
 * @swagger
 * /api/v1/user/profile-completion:
 *   get:
 *     summary: Get profile completion status
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     description: Returns profile completion percentage, missing fields, tips, and badge
 *     responses:
 *       200:
 *         description: Profile completion data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 completion:
 *                   type: object
 *                   properties:
 *                     percentage:
 *                       type: number
 *                       example: 75
 *                     completedFields:
 *                       type: array
 *                       items:
 *                         type: string
 *                     missingFields:
 *                       type: array
 *                       items:
 *                         type: string
 *                     breakdown:
 *                       type: object
 *                     badge:
 *                       type: object
 *                       properties:
 *                         level:
 *                           type: string
 *                         color:
 *                           type: string
 *                         icon:
 *                           type: string
 *                         message:
 *                           type: string
 *                         benefit:
 *                           type: string
 *                     tips:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           priority:
 *                             type: string
 *                           points:
 *                             type: number
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
router.route("/profile-completion").get(isAuthenticated, getProfileCompletion);

export default router;

