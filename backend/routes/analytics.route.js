import express from 'express';
import {
    getOverallStats,
    getApplicationStats,
    getJobTrends,
    getApplicationTrends,
    getPopularCompanies,
    getPopularSkills,
    getJobTypeDistribution,
    getLocationDistribution,
    getRecentActivities,
    getJobStatistics,
    getCandidateAnalytics,
    getRevenueAnalytics,
    getSystemMetrics,
    exportToCSV
} from '../controllers/analytics.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import { isRecruiterOrAdmin } from '../middlewares/isAdmin.js';
import { adminLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Analytics routes (admin and recruiter only)
router.route('/overall').get(isAuthenticated, isRecruiterOrAdmin, adminLimiter, getOverallStats);
router.route('/applications').get(isAuthenticated, isRecruiterOrAdmin, adminLimiter, getApplicationStats);
router.route('/job-trends').get(isAuthenticated, isRecruiterOrAdmin, adminLimiter, getJobTrends);
router.route('/application-trends').get(isAuthenticated, isRecruiterOrAdmin, adminLimiter, getApplicationTrends);
router.route('/popular-companies').get(isAuthenticated, isRecruiterOrAdmin, adminLimiter, getPopularCompanies);
router.route('/popular-skills').get(isAuthenticated, isRecruiterOrAdmin, adminLimiter, getPopularSkills);
router.route('/job-types').get(isAuthenticated, isRecruiterOrAdmin, adminLimiter, getJobTypeDistribution);
router.route('/locations').get(isAuthenticated, isRecruiterOrAdmin, adminLimiter, getLocationDistribution);
router.route('/recent-activities').get(isAuthenticated, isRecruiterOrAdmin, adminLimiter, getRecentActivities);

// Advanced analytics routes
router.route('/job-statistics').get(isAuthenticated, isRecruiterOrAdmin, adminLimiter, getJobStatistics);
router.route('/candidate-analytics').get(isAuthenticated, isRecruiterOrAdmin, adminLimiter, getCandidateAnalytics);
router.route('/revenue-analytics').get(isAuthenticated, isRecruiterOrAdmin, adminLimiter, getRevenueAnalytics);
router.route('/system-metrics').get(isAuthenticated, isRecruiterOrAdmin, adminLimiter, getSystemMetrics);

// Export routes
router.route('/export/csv').get(isAuthenticated, isRecruiterOrAdmin, exportToCSV);

export default router;
