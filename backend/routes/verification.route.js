import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import { isAdmin } from "../middlewares/checkPermission.js";
import { upload } from "../middlewares/multer.js";
import {
    submitVerificationDocs,
    getVerificationStatus,
    approveCompany,
    rejectCompany,
    getVerificationQueue
} from "../controllers/verification.controller.js";

const router = express.Router();

// Recruiter routes
router.route("/submit").post(
    isAuthenticated,
    upload.fields([
        { name: 'gstCertificate', maxCount: 1 },
        { name: 'panCard', maxCount: 1 },
        { name: 'registrationCertificate', maxCount: 1 }
    ]),
    submitVerificationDocs
);
router.route("/status/:companyId").get(isAuthenticated, getVerificationStatus);

// Admin routes
router.route("/approve/:companyId").put(isAuthenticated, isAdmin, approveCompany);
router.route("/reject/:companyId").put(isAuthenticated, isAdmin, rejectCompany);
router.route("/queue").get(isAuthenticated, isAdmin, getVerificationQueue);

export default router;
