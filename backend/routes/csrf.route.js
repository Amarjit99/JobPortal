import express from 'express';
import { getCsrfToken } from '../middlewares/csrf.js';

const router = express.Router();

/**
 * GET /api/v1/csrf-token
 * Generate and return a CSRF token
 * This endpoint should be called before making state-changing requests
 */
router.get('/csrf-token', getCsrfToken);

export default router;
