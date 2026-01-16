import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import { isAdmin } from "../middlewares/checkPermission.js";
import {
    getModerationQueue,
    approveJob,
    rejectJob,
    flagJob,
    reportJob,
    getJobReports,
    updateReportStatus
} from "../controllers/moderation.controller.js";

const router = express.Router();

// Admin routes - Job moderation
router.get("/queue", isAuthenticated, isAdmin, getModerationQueue);
router.put("/approve/:jobId", isAuthenticated, isAdmin, approveJob);
router.put("/reject/:jobId", isAuthenticated, isAdmin, rejectJob);
router.put("/flag/:jobId", isAuthenticated, isAdmin, flagJob);
router.get("/reports/:jobId", isAuthenticated, isAdmin, getJobReports);
router.put("/reports/:jobId/:reportId", isAuthenticated, isAdmin, updateReportStatus);

// User routes - Report job
router.post("/report/:jobId", isAuthenticated, reportJob);

export default router;
