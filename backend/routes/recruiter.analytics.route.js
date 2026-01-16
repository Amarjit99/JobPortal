import express from 'express';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import { isRecruiterOrAdmin } from '../middlewares/isAdmin.js';
import { 
    getRecruiterStats,
    getRecruiterJobTrends,
    getRecruiterApplicationTrends,
    getRecruiterCompanyPerformance,
    getRecruiterTopJobs
} from '../controllers/recruiter.analytics.controller.js';

const router = express.Router();

// All routes require authentication and recruiter/admin role
router.get('/stats', isAuthenticated, isRecruiterOrAdmin, getRecruiterStats);
router.get('/job-trends', isAuthenticated, isRecruiterOrAdmin, getRecruiterJobTrends);
router.get('/application-trends', isAuthenticated, isRecruiterOrAdmin, getRecruiterApplicationTrends);
router.get('/company-performance', isAuthenticated, isRecruiterOrAdmin, getRecruiterCompanyPerformance);
router.get('/top-jobs', isAuthenticated, isRecruiterOrAdmin, getRecruiterTopJobs);

export default router;
