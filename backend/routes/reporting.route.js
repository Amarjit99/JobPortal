import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { generateCustomReport, getReportTemplates } from '../controllers/reporting.controller.js';

const router = express.Router();

router.post('/generate', isAuthenticated, generateCustomReport);
router.get('/templates', isAuthenticated, getReportTemplates);

export default router;
