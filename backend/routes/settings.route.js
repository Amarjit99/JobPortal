import express from "express";
import {
    getPublicSettings,
    getAllSettings,
    updateSettings,
    resetSettings,
    testEmailConfig
} from "../controllers/settings.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

// Public route
router.get("/public", getPublicSettings);

// Admin routes
router.get("/", isAuthenticated, isAdmin, getAllSettings);
router.put("/", isAuthenticated, isAdmin, updateSettings);
router.post("/reset", isAuthenticated, isAdmin, resetSettings);
router.post("/test-email", isAuthenticated, isAdmin, testEmailConfig);

export default router;
