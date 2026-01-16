import express from 'express';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import {
    createTemplate,
    getMyTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate
} from '../controllers/template.controller.js';

const router = express.Router();

// Create new template
router.post('/', isAuthenticated, createTemplate);

// Get all templates (user's own + public)
router.get('/', isAuthenticated, getMyTemplates);

// Get template by ID
router.get('/:id', isAuthenticated, getTemplateById);

// Update template
router.put('/:id', isAuthenticated, updateTemplate);

// Delete template
router.delete('/:id', isAuthenticated, deleteTemplate);

export default router;
