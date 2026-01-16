import express from 'express';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import {
    saveSearch,
    getMySavedSearches,
    getSavedSearchById,
    updateSavedSearch,
    deleteSavedSearch
} from '../controllers/savedSearch.controller.js';

const router = express.Router();

// Save a new search
router.post('/', isAuthenticated, saveSearch);

// Get all saved searches for user
router.get('/', isAuthenticated, getMySavedSearches);

// Get saved search by ID
router.get('/:id', isAuthenticated, getSavedSearchById);

// Update saved search
router.put('/:id', isAuthenticated, updateSavedSearch);

// Delete saved search
router.delete('/:id', isAuthenticated, deleteSavedSearch);

export default router;
