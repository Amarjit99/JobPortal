import express from 'express';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import {
    setup2FA,
    verify2FA,
    enable2FA,
    disable2FA,
    regenerateBackupCodes,
    get2FAStatus
} from '../controllers/twoFactor.controller.js';

const router = express.Router();

// All routes require authentication
router.get('/status', isAuthenticated, get2FAStatus);
router.get('/setup', isAuthenticated, setup2FA);
router.post('/verify', isAuthenticated, verify2FA);
router.post('/enable', isAuthenticated, enable2FA);
router.post('/disable', isAuthenticated, disable2FA);
router.post('/regenerate-backup-codes', isAuthenticated, regenerateBackupCodes);

export default router;
