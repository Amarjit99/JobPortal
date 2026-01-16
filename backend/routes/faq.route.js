import express from "express";
import {
    getPublicFAQs,
    getAllFAQs,
    getFAQById,
    createFAQ,
    updateFAQ,
    deleteFAQ,
    toggleFAQStatus,
    recordFAQView,
    recordFAQFeedback,
    reorderFAQs
} from "../controllers/faq.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

// Public routes
router.get("/public", getPublicFAQs);
router.post("/:id/view", recordFAQView);
router.post("/:id/feedback", recordFAQFeedback);

// Admin routes
router.get("/", isAuthenticated, isAdmin, getAllFAQs);
router.get("/:id", isAuthenticated, isAdmin, getFAQById);
router.post("/create", isAuthenticated, isAdmin, createFAQ);
router.put("/:id", isAuthenticated, isAdmin, updateFAQ);
router.delete("/:id", isAuthenticated, isAdmin, deleteFAQ);
router.patch("/:id/toggle", isAuthenticated, isAdmin, toggleFAQStatus);
router.post("/reorder", isAuthenticated, isAdmin, reorderFAQs);

export default router;
