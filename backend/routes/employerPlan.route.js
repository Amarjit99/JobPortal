import express from "express";
import {
    getAllPlans,
    getPlanById,
    comparePlans,
    getCurrentSubscription,
    checkUsageLimit,
    createPlan,
    updatePlan,
    deletePlan,
    togglePlanStatus
} from "../controllers/employerPlan.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

// Public routes
router.get("/", getAllPlans);
router.get("/compare", comparePlans);
router.get("/:id", getPlanById);

// User routes (authenticated)
router.get("/subscription/current", isAuthenticated, getCurrentSubscription);
router.post("/subscription/check-limit", isAuthenticated, checkUsageLimit);

// Admin routes
router.post("/create", isAuthenticated, isAdmin, createPlan);
router.put("/:id", isAuthenticated, isAdmin, updatePlan);
router.delete("/:id", isAuthenticated, isAdmin, deletePlan);
router.patch("/:id/toggle", isAuthenticated, isAdmin, togglePlanStatus);

export default router;
