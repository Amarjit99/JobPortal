import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { 
    applyJob, 
    getApplicants, 
    getAppliedJobs, 
    updateStatus, 
    withdrawApplication,
    updateApplicationStage,
    getApplicationHistory,
    addApplicationNote,
    scheduleInterview,
    makeJobOffer
} from "../controllers/application.controller.js";
import { updateStatusValidation, validate, mongoIdValidation, paginationValidation } from "../middlewares/validation.js";
import { applicationLimiter, readLimiter, writeLimiter } from "../middlewares/rateLimiter.js";
 
const router = express.Router();

router.route("/apply/:id").get(isAuthenticated, applicationLimiter, ...mongoIdValidation('id'), validate, applyJob);
router.route("/get").get(isAuthenticated, readLimiter, paginationValidation, validate, getAppliedJobs);
router.route("/:id/applicants").get(isAuthenticated, readLimiter, ...mongoIdValidation('id'), validate, getApplicants);
router.route("/status/:id/update").post(isAuthenticated, ...mongoIdValidation('id'), updateStatusValidation, validate, updateStatus);
router.route("/withdraw/:id").delete(isAuthenticated, ...mongoIdValidation('id'), validate, withdrawApplication);

// Application Stage Management Routes
router.route("/:id/stage").put(isAuthenticated, writeLimiter, ...mongoIdValidation('id'), validate, updateApplicationStage);
router.route("/:id/history").get(isAuthenticated, readLimiter, ...mongoIdValidation('id'), validate, getApplicationHistory);
router.route("/:id/notes").post(isAuthenticated, writeLimiter, ...mongoIdValidation('id'), validate, addApplicationNote);
router.route("/:id/interview").post(isAuthenticated, writeLimiter, ...mongoIdValidation('id'), validate, scheduleInterview);
router.route("/:id/offer").post(isAuthenticated, writeLimiter, ...mongoIdValidation('id'), validate, makeJobOffer);
 

export default router;

