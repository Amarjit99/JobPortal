import express from 'express';
import { getCacheStats, clearAllCaches, clearCachePattern } from '../controllers/cache.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import { adminLimiter } from '../middlewares/rateLimiter.js';
import { cachePatternValidation, validate } from '../middlewares/validation.js';

const router = express.Router();

// Cache management routes (admin only - add role check if needed)
router.route('/stats').get(isAuthenticated, adminLimiter, getCacheStats);
router.route('/clear-all').post(isAuthenticated, adminLimiter, clearAllCaches);
router.route('/clear-pattern').post(isAuthenticated, adminLimiter, cachePatternValidation, validate, clearCachePattern);

export default router;
