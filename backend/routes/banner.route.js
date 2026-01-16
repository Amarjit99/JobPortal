import express from "express";
import {
    createBanner,
    getAllBanners,
    getActiveBanners,
    getBannerById,
    updateBanner,
    toggleBannerStatus,
    deleteBanner,
    recordBannerClick,
    updateBannerOrder,
    getBannerAnalytics
} from "../controllers/banner.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { isAdmin } from "../middlewares/checkPermission.js";

const router = express.Router();

// Public routes
router.get("/active", getActiveBanners);
router.post("/:id/click", recordBannerClick);

// Admin routes
router.post("/create", isAuthenticated, isAdmin, createBanner);
router.get("/all", isAuthenticated, isAdmin, getAllBanners);
router.get("/analytics", isAuthenticated, isAdmin, getBannerAnalytics);
router.get("/:id", isAuthenticated, isAdmin, getBannerById);
router.put("/:id", isAuthenticated, isAdmin, updateBanner);
router.patch("/:id/toggle", isAuthenticated, isAdmin, toggleBannerStatus);
router.delete("/:id", isAuthenticated, isAdmin, deleteBanner);
router.post("/reorder", isAuthenticated, isAdmin, updateBannerOrder);

export default router;
