import express from 'express';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import {
    getAvailableAssessments,
    startAssessment,
    submitAssessment,
    getAssessmentResults,
    getMyAssessments
} from '../controllers/assessment.controller.js';
import { readLimiter, writeLimiter } from '../middlewares/rateLimiter.js';
import { mongoIdValidation, validate } from '../middlewares/validation.js';

const router = express.Router();

// Get available assessments with optional filtering
router.get('/available', readLimiter, getAvailableAssessments);

// Start an assessment (requires authentication)
router.post('/:id/start', isAuthenticated, writeLimiter, ...mongoIdValidation('id'), validate, startAssessment);

// Submit assessment answers
router.post('/:id/submit', isAuthenticated, writeLimiter, ...mongoIdValidation('id'), validate, submitAssessment);

// Get detailed assessment results
router.get('/results/:id', isAuthenticated, readLimiter, ...mongoIdValidation('id'), validate, getAssessmentResults);

// Get user's assessment history
router.get('/my-assessments', isAuthenticated, readLimiter, getMyAssessments);

export default router;
