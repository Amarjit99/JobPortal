import express from 'express';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import { isAdmin, isAdminOrSubAdmin } from '../middlewares/checkPermission.js';
import {
    createSubAdmin,
    getAllSubAdmins,
    getSubAdminById,
    updateSubAdminPermissions,
    deleteSubAdmin,
    getMyPermissions,
    getPermissionTemplates
} from '../controllers/subAdmin.controller.js';

const router = express.Router();

// Get permission templates (admin only)
router.get('/templates', isAuthenticated, isAdmin, getPermissionTemplates);

// Admin-only routes - strict admin access
router.post('/', isAuthenticated, isAdmin, createSubAdmin);
router.get('/', isAuthenticated, isAdmin, getAllSubAdmins);
router.get('/:id', isAuthenticated, isAdmin, getSubAdminById);
router.put('/:id', isAuthenticated, isAdmin, updateSubAdminPermissions);
router.delete('/:id', isAuthenticated, isAdmin, deleteSubAdmin);

// Sub-admin can view their own permissions
router.get('/me/permissions', isAuthenticated, isAdminOrSubAdmin, getMyPermissions);

export default router;
