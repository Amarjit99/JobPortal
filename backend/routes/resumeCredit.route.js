import express from "express";
import {
    checkResumeAccess,
    unlockResume,
    getUnlockedResumes,
    getCreditBalance
} from "../controllers/resumeCredit.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.get("/check/:candidateId", isAuthenticated, checkResumeAccess);
router.post("/unlock", isAuthenticated, unlockResume);
router.get("/unlocked", isAuthenticated, getUnlockedResumes);
router.get("/balance", isAuthenticated, getCreditBalance);

export default router;
