import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { getPersonalizedRecommendations, getSimilarJobs, getCandidateMatches, getPersonalizedFeed } from '../controllers/aiRecommendation.controller.js';

const router = express.Router();

router.get('/personalized', isAuthenticated, getPersonalizedRecommendations);
router.get('/similar/:jobId', isAuthenticated, getSimilarJobs);
router.get('/candidates/:jobId', isAuthenticated, getCandidateMatches);
router.get('/feed', isAuthenticated, getPersonalizedFeed);

export default router;
