import express from 'express';
import { createCampaign, getCampaigns, getCampaignById, updateCampaign, sendCampaign, getCampaignStats, deleteCampaign } from '../controllers/emailCampaign.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import { isRecruiterOrAdmin } from '../middlewares/isAdmin.js';
import { writeLimiter, readLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.route('/').post(isAuthenticated, isRecruiterOrAdmin, writeLimiter, createCampaign);
router.route('/').get(isAuthenticated, isRecruiterOrAdmin, readLimiter, getCampaigns);
router.route('/:id').get(isAuthenticated, isRecruiterOrAdmin, readLimiter, getCampaignById);
router.route('/:id').put(isAuthenticated, isRecruiterOrAdmin, writeLimiter, updateCampaign);
router.route('/:id').delete(isAuthenticated, isRecruiterOrAdmin, writeLimiter, deleteCampaign);
router.route('/:id/send').post(isAuthenticated, isRecruiterOrAdmin, writeLimiter, sendCampaign);
router.route('/:id/stats').get(isAuthenticated, isRecruiterOrAdmin, readLimiter, getCampaignStats);

export default router;
