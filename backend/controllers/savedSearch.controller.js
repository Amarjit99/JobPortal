import { SavedSearch } from "../models/savedSearch.model.js";
import logger from "../utils/logger.js";

// Save a search
export const saveSearch = async (req, res) => {
    try {
        const userId = req.id;
        const { name, searchParams, alertsEnabled } = req.body;

        if (!name || !searchParams) {
            return res.status(400).json({
                message: "Name and search parameters are required",
                success: false
            });
        }

        // Check if name already exists for this user
        const existing = await SavedSearch.findOne({ userId, name });
        if (existing) {
            return res.status(400).json({
                message: "You already have a saved search with this name",
                success: false
            });
        }

        const savedSearch = await SavedSearch.create({
            userId,
            name,
            searchParams,
            alertsEnabled: alertsEnabled || false
        });

        logger.info(`Search saved: ${savedSearch._id} by user ${userId}`);

        return res.status(201).json({
            message: "Search saved successfully",
            savedSearch,
            success: true
        });

    } catch (error) {
        logger.error('Error saving search:', error);
        return res.status(500).json({
            message: "Failed to save search",
            success: false
        });
    }
};

// Get all saved searches for user
export const getMySavedSearches = async (req, res) => {
    try {
        const userId = req.id;

        const savedSearches = await SavedSearch.find({ userId })
            .populate('searchParams.company', 'name logo')
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            savedSearches,
            success: true
        });

    } catch (error) {
        logger.error('Error fetching saved searches:', error);
        return res.status(500).json({
            message: "Failed to fetch saved searches",
            success: false
        });
    }
};

// Get saved search by ID
export const getSavedSearchById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;

        const savedSearch = await SavedSearch.findOne({ _id: id, userId })
            .populate('searchParams.company', 'name logo');

        if (!savedSearch) {
            return res.status(404).json({
                message: "Saved search not found",
                success: false
            });
        }

        // Increment usage count
        savedSearch.usageCount += 1;
        await savedSearch.save();

        return res.status(200).json({
            savedSearch,
            success: true
        });

    } catch (error) {
        logger.error('Error fetching saved search:', error);
        return res.status(500).json({
            message: "Failed to fetch saved search",
            success: false
        });
    }
};

// Update saved search
export const updateSavedSearch = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;
        const updates = req.body;

        const savedSearch = await SavedSearch.findOne({ _id: id, userId });

        if (!savedSearch) {
            return res.status(404).json({
                message: "Saved search not found",
                success: false
            });
        }

        // Check if new name conflicts with existing
        if (updates.name && updates.name !== savedSearch.name) {
            const existing = await SavedSearch.findOne({ 
                userId, 
                name: updates.name,
                _id: { $ne: id }
            });
            if (existing) {
                return res.status(400).json({
                    message: "You already have a saved search with this name",
                    success: false
                });
            }
        }

        Object.assign(savedSearch, updates);
        await savedSearch.save();

        logger.info(`Saved search ${id} updated by user ${userId}`);

        return res.status(200).json({
            message: "Saved search updated successfully",
            savedSearch,
            success: true
        });

    } catch (error) {
        logger.error('Error updating saved search:', error);
        return res.status(500).json({
            message: "Failed to update saved search",
            success: false
        });
    }
};

// Delete saved search
export const deleteSavedSearch = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;

        const savedSearch = await SavedSearch.findOneAndDelete({ _id: id, userId });

        if (!savedSearch) {
            return res.status(404).json({
                message: "Saved search not found",
                success: false
            });
        }

        logger.info(`Saved search ${id} deleted by user ${userId}`);

        return res.status(200).json({
            message: "Saved search deleted successfully",
            success: true
        });

    } catch (error) {
        logger.error('Error deleting saved search:', error);
        return res.status(500).json({
            message: "Failed to delete saved search",
            success: false
        });
    }
};

export default {
    saveSearch,
    getMySavedSearches,
    getSavedSearchById,
    updateSavedSearch,
    deleteSavedSearch
};
