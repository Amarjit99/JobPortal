import express from 'express';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import { isAdmin, isRecruiterOrAdmin } from '../middlewares/isAdmin.js';
import { 
    getAllUsers, 
    getAllCompaniesAdmin, 
    getAllJobsAdmin, 
    getAllApplicationsAdmin,
    getAdminStats,
    deleteUser,
    updateUserRole,
    blockUser,
    unblockUser,
    getActivityLogs,
    bulkBlockUsers,
    bulkUnblockUsers,
    getVerificationQueue,
    approveCompanyVerification,
    rejectCompanyVerification,
    getJobModerationQueue,
    approveJob,
    rejectJob,
    adminEditJob
} from '../controllers/admin.controller.js';
import { getJobReports, updateReportStatus } from '../controllers/jobReport.controller.js';

const router = express.Router();

// Admin only routes
router.get('/users', isAuthenticated, isAdmin, getAllUsers);
router.get('/stats', isAuthenticated, isAdmin, getAdminStats);
router.delete('/users/:id', isAuthenticated, isAdmin, deleteUser);
router.put('/users/:id/role', isAuthenticated, isAdmin, updateUserRole);
router.post('/users/:userId/block', isAuthenticated, isAdmin, blockUser);
router.post('/users/:userId/unblock', isAuthenticated, isAdmin, unblockUser);
router.post('/users/bulk-block', isAuthenticated, isAdmin, bulkBlockUsers);
router.post('/users/bulk-unblock', isAuthenticated, isAdmin, bulkUnblockUsers);
router.get('/activity-logs', isAuthenticated, isAdmin, getActivityLogs);

// Company verification routes (admin only)
router.get('/verification-queue', isAuthenticated, isAdmin, getVerificationQueue);
router.post('/verify-company/:id', isAuthenticated, isAdmin, approveCompanyVerification);
router.post('/reject-company/:id', isAuthenticated, isAdmin, rejectCompanyVerification);

// Job moderation routes (admin only)
router.get('/moderation-queue', isAuthenticated, isAdmin, getJobModerationQueue);
router.post('/approve-job/:id', isAuthenticated, isAdmin, approveJob);
router.post('/reject-job/:id', isAuthenticated, isAdmin, rejectJob);
router.put('/edit-job/:id', isAuthenticated, isAdmin, adminEditJob);

// Job reporting routes (admin only)
router.get('/job-reports', isAuthenticated, isAdmin, getJobReports);
router.put('/job-reports/:id/:reportId', isAuthenticated, isAdmin, updateReportStatus);

// Admin and Recruiter routes (with role-based filtering)
router.get('/companies', isAuthenticated, isRecruiterOrAdmin, getAllCompaniesAdmin);
router.get('/jobs', isAuthenticated, isRecruiterOrAdmin, getAllJobsAdmin);
router.get('/applications', isAuthenticated, isRecruiterOrAdmin, getAllApplicationsAdmin);

export default router;
