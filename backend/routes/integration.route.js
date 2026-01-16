import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { sendSMS, sendEmail, processPayment } from '../controllers/integration.controller.js';

const router = express.Router();

router.post('/sms', isAuthenticated, sendSMS);
router.post('/email', isAuthenticated, sendEmail);
router.post('/payment', isAuthenticated, processPayment);

export default router;
