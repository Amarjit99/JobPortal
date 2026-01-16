import express from 'express';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import {
    addEducation,
    updateEducation,
    deleteEducation,
    getEducation
} from '../controllers/education.controller.js';

const router = express.Router();

// All routes require authentication
router.post('/', isAuthenticated, addEducation);
router.put('/:id', isAuthenticated, updateEducation);
router.delete('/:id', isAuthenticated, deleteEducation);
router.get('/', isAuthenticated, getEducation);

export default router;
