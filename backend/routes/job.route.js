import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getAdminJobs, getAllJobs, getJobById, postJob, updateJob, deleteJob, getDraftJobs, publishDraft, duplicateJob, getRecommendations, advancedJobSearch, getMatchedCandidates } from "../controllers/job.controller.js";
import { reportJob } from "../controllers/jobReport.controller.js";
import { postJobValidation, validate, mongoIdValidation, jobFilterValidation, paginationValidation } from "../middlewares/validation.js";
import { jobWriteLimiter, readLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.route("/post").post(isAuthenticated, jobWriteLimiter, postJobValidation, validate, postJob);
router.route("/get").get(isAuthenticated, readLimiter, jobFilterValidation, paginationValidation, validate, getAllJobs);
router.route("/advanced-search").get(readLimiter, advancedJobSearch);
router.route("/recommendations").get(isAuthenticated, readLimiter, getRecommendations);
router.route("/getadminjobs").get(isAuthenticated, readLimiter, getAdminJobs);
router.route("/drafts").get(isAuthenticated, readLimiter, getDraftJobs);
router.route("/:id/matched-candidates").get(isAuthenticated, readLimiter, ...mongoIdValidation('id'), validate, getMatchedCandidates);
router.route("/:id/publish").put(isAuthenticated, jobWriteLimiter, ...mongoIdValidation('id'), validate, publishDraft);
router.route("/:id/duplicate").post(isAuthenticated, jobWriteLimiter, ...mongoIdValidation('id'), validate, duplicateJob);
router.route("/get/:id").get(isAuthenticated, readLimiter, ...mongoIdValidation('id'), validate, getJobById);
router.route("/update/:id").put(isAuthenticated, jobWriteLimiter, ...mongoIdValidation('id'), validate, updateJob);
router.route("/delete/:id").delete(isAuthenticated, jobWriteLimiter, ...mongoIdValidation('id'), validate, deleteJob);
router.route("/:id/report").post(isAuthenticated, jobWriteLimiter, ...mongoIdValidation('id'), validate, reportJob);

export default router;

