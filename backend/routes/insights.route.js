import express from 'express';
import {
    getSalaryTrends,
    getMarketDemand,
    getSkillGapAnalysis,
    getHiringTrends,
    getCareerPathRecommendations,
    getCompanyReviewsSummary
} from '../controllers/insights.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import { readLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Job market insights routes
router.route('/salary-trends').get(isAuthenticated, readLimiter, getSalaryTrends);
router.route('/market-demand').get(isAuthenticated, readLimiter, getMarketDemand);
router.route('/skill-gap').get(isAuthenticated, readLimiter, getSkillGapAnalysis);
router.route('/hiring-trends').get(isAuthenticated, readLimiter, getHiringTrends);
router.route('/career-path').get(isAuthenticated, readLimiter, getCareerPathRecommendations);
router.route('/company-reviews').get(isAuthenticated, readLimiter, getCompanyReviewsSummary);

export default router;
