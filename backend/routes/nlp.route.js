import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { extractKeywords, optimizeJobDescription, autoTagJobs, normalizeSkills } from '../controllers/nlp.controller.js';

const router = express.Router();

router.post('/extract-keywords', isAuthenticated, extractKeywords);
router.post('/optimize-description', isAuthenticated, optimizeJobDescription);
router.post('/auto-tag-jobs', isAuthenticated, autoTagJobs);
router.post('/normalize-skills', isAuthenticated, normalizeSkills);

export default router;
