import express from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import { singleUpload } from "../middlewares/multer.js";
import { 
    uploadResume, 
    getAllResumes, 
    setDefaultResume, 
    deleteResume, 
    downloadResume 
} from "../controllers/resume.controller.js";
import {
    parseUploadedResume,
    getResumeTemplates,
    buildResume,
    downloadResumePDF,
    analyzeResume
} from '../controllers/resumeBuilder.controller.js';
import { writeLimiter, readLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Existing resume upload/download routes
router.route("/upload").post(isAuthenticated, singleUpload, uploadResume);
router.route("/").get(isAuthenticated, getAllResumes);
router.route("/:id/default").put(isAuthenticated, setDefaultResume);
router.route("/:id").delete(isAuthenticated, deleteResume);
router.route("/:id/download").get(isAuthenticated, downloadResume);

// Resume parser & builder routes
router.route('/parse').post(isAuthenticated, singleUpload, writeLimiter, parseUploadedResume);
router.route('/templates').get(isAuthenticated, readLimiter, getResumeTemplates);
router.route('/build').post(isAuthenticated, writeLimiter, buildResume);
router.route('/build/download/:userId').get(isAuthenticated, downloadResumePDF);
router.route('/analyze').post(isAuthenticated, writeLimiter, analyzeResume);

export default router;
