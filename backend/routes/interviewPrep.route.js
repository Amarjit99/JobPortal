import express from 'express';
import {
    getInterviewQuestions,
    getCompanyQuestions,
    getInterviewTips,
    getPreparationGuide,
    submitInterviewQuestion,
    voteQuestion,
    markQuestionAsAsked
} from '../controllers/interviewPrep.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import { readLimiter, writeLimiter } from '../middlewares/rateLimiter.js';
import { mongoIdValidation, validate } from '../middlewares/validation.js';

const router = express.Router();

// Interview preparation routes
router.route('/questions').get(isAuthenticated, readLimiter, getInterviewQuestions);
router.route('/questions').post(isAuthenticated, writeLimiter, submitInterviewQuestion);
router.route('/questions/:id/vote').put(isAuthenticated, writeLimiter, mongoIdValidation('id'), validate, voteQuestion);
router.route('/questions/:id/mark-asked').put(isAuthenticated, writeLimiter, mongoIdValidation('id'), validate, markQuestionAsAsked);
router.route('/company/:companyId').get(isAuthenticated, readLimiter, mongoIdValidation('companyId'), validate, getCompanyQuestions);
router.route('/tips').get(isAuthenticated, readLimiter, getInterviewTips);
router.route('/guide').get(isAuthenticated, readLimiter, getPreparationGuide);

export default router;
