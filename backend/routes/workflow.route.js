import express from 'express';
import { createWorkflow, getWorkflows, getWorkflowById, updateWorkflow, deleteWorkflow, applyWorkflowToApplication } from '../controllers/workflow.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import { isRecruiterOrAdmin } from '../middlewares/isAdmin.js';
import { readLimiter, writeLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.route('/').post(isAuthenticated, isRecruiterOrAdmin, writeLimiter, createWorkflow);
router.route('/').get(isAuthenticated, isRecruiterOrAdmin, readLimiter, getWorkflows);
router.route('/:id').get(isAuthenticated, isRecruiterOrAdmin, readLimiter, getWorkflowById);
router.route('/:id').put(isAuthenticated, isRecruiterOrAdmin, writeLimiter, updateWorkflow);
router.route('/:id').delete(isAuthenticated, isRecruiterOrAdmin, writeLimiter, deleteWorkflow);
router.route('/apply').post(isAuthenticated, isRecruiterOrAdmin, writeLimiter, applyWorkflowToApplication);

export default router;
