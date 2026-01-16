import express from "express";
import {
    featureJob,
    unfeatureJob,
    getFeaturedJobs,
    getMyFeaturedJobs
} from "../controllers/featuredJob.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Public routes
router.get("/", getFeaturedJobs);

// User routes
router.post("/feature", isAuthenticated, featureJob);
router.delete("/:jobId", isAuthenticated, unfeatureJob);
router.get("/my", isAuthenticated, getMyFeaturedJobs);

export default router;
