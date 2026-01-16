import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { getCourseRecommendations, getAssessments, submitAssessment, requestMentorship, getMentorships } from '../controllers/careerDevelopment.controller.js';

const router = express.Router();

router.get('/courses', isAuthenticated, getCourseRecommendations);
router.get('/assessments', isAuthenticated, getAssessments);
router.post('/assessments/submit', isAuthenticated, submitAssessment);
router.post('/mentorship/request', isAuthenticated, requestMentorship);
router.get('/mentorships', isAuthenticated, getMentorships);

export default router;
