import express from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated.js';
import { exportUserData, deleteUserAccount, getDataAccessLog } from '../controllers/gdpr.controller.js';

const router = express.Router();

router.get('/export-data', isAuthenticated, exportUserData);
router.delete('/delete-account', isAuthenticated, deleteUserAccount);
router.get('/access-log', isAuthenticated, getDataAccessLog);

export default router;
