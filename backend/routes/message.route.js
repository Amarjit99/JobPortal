import express from 'express';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import {
    getConversations,
    getMessages,
    sendMessage,
    markAsRead,
    deleteMessage,
    searchMessages,
    emitTyping
} from '../controllers/message.controller.js';
import { readLimiter, writeLimiter } from '../middlewares/rateLimiter.js';
import { validate, mongoIdValidation } from '../middlewares/validation.js';

const router = express.Router();

// Get all conversations for logged-in user
router.get('/conversations', isAuthenticated, readLimiter, getConversations);

// Search messages
router.get('/search', isAuthenticated, readLimiter, searchMessages);

// Get messages in a specific conversation
router.get('/:conversationId/messages', isAuthenticated, readLimiter, ...mongoIdValidation('conversationId'), validate, getMessages);

// Send a new message
router.post('/send', isAuthenticated, writeLimiter, sendMessage);

// Emit typing indicator
router.post('/typing', isAuthenticated, writeLimiter, emitTyping);

// Mark conversation as read
router.put('/:conversationId/read', isAuthenticated, writeLimiter, ...mongoIdValidation('conversationId'), validate, markAsRead);

// Delete a message
router.delete('/:id', isAuthenticated, writeLimiter, ...mongoIdValidation('id'), validate, deleteMessage);

export default router;
