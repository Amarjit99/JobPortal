import express from 'express';
import { getMyReferralInfo, applyReferralCode, getLeaderboard, redeemRewards } from '../controllers/referral.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import { readLimiter, writeLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.route('/my-info').get(isAuthenticated, readLimiter, getMyReferralInfo);
router.route('/apply').post(isAuthenticated, writeLimiter, applyReferralCode);
router.route('/leaderboard').get(isAuthenticated, readLimiter, getLeaderboard);
router.route('/redeem').post(isAuthenticated, writeLimiter, redeemRewards);

export default router;
