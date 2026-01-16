import express from "express";
import {
    getActiveHomeContent,
    getAllHomeContent,
    getHomeContentById,
    createHomeContent,
    updateHomeContent,
    setActiveHomeContent,
    deleteHomeContent,
    duplicateHomeContent
} from "../controllers/homeContent.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { isAdmin } from "../middlewares/checkPermission.js";

const router = express.Router();

// Public route
router.get("/active", getActiveHomeContent);

// Admin routes
router.get("/all", isAuthenticated, isAdmin, getAllHomeContent);
router.get("/:id", isAuthenticated, isAdmin, getHomeContentById);
router.post("/create", isAuthenticated, isAdmin, createHomeContent);
router.put("/:id", isAuthenticated, isAdmin, updateHomeContent);
router.patch("/:id/activate", isAuthenticated, isAdmin, setActiveHomeContent);
router.post("/:id/duplicate", isAuthenticated, isAdmin, duplicateHomeContent);
router.delete("/:id", isAuthenticated, isAdmin, deleteHomeContent);

export default router;
