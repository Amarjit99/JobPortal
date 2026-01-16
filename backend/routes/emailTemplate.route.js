import express from "express";
import {
    getAllTemplates,
    getTemplateById,
    getTemplateByName,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateStatus,
    previewTemplate,
    duplicateTemplate
} from "../controllers/emailTemplate.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

// Admin routes
router.get("/", isAuthenticated, isAdmin, getAllTemplates);
router.get("/:id", isAuthenticated, isAdmin, getTemplateById);
router.get("/name/:name", isAuthenticated, getTemplateByName); // For internal use
router.post("/create", isAuthenticated, isAdmin, createTemplate);
router.put("/:id", isAuthenticated, isAdmin, updateTemplate);
router.delete("/:id", isAuthenticated, isAdmin, deleteTemplate);
router.patch("/:id/toggle", isAuthenticated, isAdmin, toggleTemplateStatus);
router.post("/:id/preview", isAuthenticated, isAdmin, previewTemplate);
router.post("/:id/duplicate", isAuthenticated, isAdmin, duplicateTemplate);

export default router;
