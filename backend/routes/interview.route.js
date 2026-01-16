import express from 'express';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import {
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    rescheduleInvitation,
    getUpcomingInterviews,
    getCompanyInterviews,
    submitDetailedFeedback,
    confirmInterview,
    addInternalNote,
    cancelInterview
} from '../controllers/interview.controller.js';
import { readLimiter, writeLimiter } from '../middlewares/rateLimiter.js';
import { mongoIdValidation, validate } from '../middlewares/validation.js';

const router = express.Router();

// Send interview invitation (recruiters only)
router.post('/send', isAuthenticated, writeLimiter, sendInvitation);

// Accept interview invitation
router.put('/:invitationId/accept', isAuthenticated, writeLimiter, acceptInvitation);

// Decline interview invitation
router.put('/:invitationId/decline', isAuthenticated, writeLimiter, declineInvitation);

// Reschedule interview (both recruiter and candidate)
router.put('/:invitationId/reschedule', isAuthenticated, writeLimiter, rescheduleInvitation);

// Get upcoming interviews for user
router.get('/upcoming', isAuthenticated, readLimiter, getUpcomingInterviews);

// Get company interviews with filters
router.get('/company/:companyId', isAuthenticated, readLimiter, ...mongoIdValidation('companyId'), validate, getCompanyInterviews);

// Submit detailed feedback
router.put('/:invitationId/feedback', isAuthenticated, writeLimiter, submitDetailedFeedback);

// Confirm interview attendance
router.put('/:invitationId/confirm', isAuthenticated, writeLimiter, confirmInterview);

// Add internal note
router.post('/:invitationId/notes', isAuthenticated, writeLimiter, addInternalNote);

// Cancel interview
router.delete('/:invitationId/cancel', isAuthenticated, writeLimiter, cancelInterview);

export default router;
