import { HomeContent } from "../models/homeContent.model.js";
import logger from "../utils/logger.js";

// Get active homepage content (Public)
export const getActiveHomeContent = async (req, res) => {
    try {
        const content = await HomeContent.getActiveContent();

        if (!content) {
            // Return default content if none exists
            return res.status(200).json({
                success: true,
                content: {
                    hero: {
                        title: 'Find Your Dream Job Today',
                        subtitle: 'Connect with top employers and discover exciting career opportunities',
                        ctaText: 'Get Started',
                        ctaLink: '/jobs',
                        showSearchBar: true
                    },
                    features: [],
                    statistics: { enabled: false, stats: [] },
                    testimonials: { enabled: false, items: [] },
                    ctaBlocks: [],
                    howItWorks: { enabled: false, steps: [] }
                }
            });
        }

        return res.status(200).json({
            success: true,
            content
        });
    } catch (error) {
        logger.error('Get active home content error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch homepage content",
            error: error.message
        });
    }
};

// Get all homepage content versions (Admin)
export const getAllHomeContent = async (req, res) => {
    try {
        const contents = await HomeContent.find()
            .populate('lastModifiedBy', 'fullname email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            contents,
            count: contents.length
        });
    } catch (error) {
        logger.error('Get all home content error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch content versions",
            error: error.message
        });
    }
};

// Get specific content version by ID (Admin)
export const getHomeContentById = async (req, res) => {
    try {
        const { id } = req.params;

        const content = await HomeContent.findById(id)
            .populate('lastModifiedBy', 'fullname email');

        if (!content) {
            return res.status(404).json({
                success: false,
                message: "Content not found"
            });
        }

        return res.status(200).json({
            success: true,
            content
        });
    } catch (error) {
        logger.error('Get home content by ID error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch content",
            error: error.message
        });
    }
};

// Create new homepage content (Admin)
export const createHomeContent = async (req, res) => {
    try {
        const contentData = req.body;
        contentData.lastModifiedBy = req.id;

        const content = await HomeContent.create(contentData);

        logger.info(`Homepage content created: ${content._id} by admin ${req.id}`);

        return res.status(201).json({
            success: true,
            message: "Homepage content created successfully",
            content
        });
    } catch (error) {
        logger.error('Create home content error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to create content",
            error: error.message
        });
    }
};

// Update homepage content (Admin)
export const updateHomeContent = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        updates.lastModifiedBy = req.id;

        const content = await HomeContent.findByIdAndUpdate(
            id,
            { $set: updates, $inc: { version: 1 } },
            { new: true, runValidators: true }
        ).populate('lastModifiedBy', 'fullname email');

        if (!content) {
            return res.status(404).json({
                success: false,
                message: "Content not found"
            });
        }

        logger.info(`Homepage content updated: ${content._id} by admin ${req.id}`);

        return res.status(200).json({
            success: true,
            message: "Content updated successfully",
            content
        });
    } catch (error) {
        logger.error('Update home content error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to update content",
            error: error.message
        });
    }
};

// Set content as active (Admin)
export const setActiveHomeContent = async (req, res) => {
    try {
        const { id } = req.params;

        // Deactivate all other contents
        await HomeContent.updateMany({}, { $set: { isActive: false } });

        // Activate the selected content
        const content = await HomeContent.findByIdAndUpdate(
            id,
            { $set: { isActive: true } },
            { new: true }
        ).populate('lastModifiedBy', 'fullname email');

        if (!content) {
            return res.status(404).json({
                success: false,
                message: "Content not found"
            });
        }

        logger.info(`Homepage content activated: ${id} by admin ${req.id}`);

        return res.status(200).json({
            success: true,
            message: "Content activated successfully",
            content
        });
    } catch (error) {
        logger.error('Set active home content error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to activate content",
            error: error.message
        });
    }
};

// Delete homepage content version (Admin)
export const deleteHomeContent = async (req, res) => {
    try {
        const { id } = req.params;

        const content = await HomeContent.findById(id);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: "Content not found"
            });
        }

        if (content.isActive) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete active content. Please activate another version first."
            });
        }

        await content.deleteOne();

        logger.info(`Homepage content deleted: ${id} by admin ${req.id}`);

        return res.status(200).json({
            success: true,
            message: "Content deleted successfully"
        });
    } catch (error) {
        logger.error('Delete home content error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete content",
            error: error.message
        });
    }
};

// Duplicate content version (Admin)
export const duplicateHomeContent = async (req, res) => {
    try {
        const { id } = req.params;

        const originalContent = await HomeContent.findById(id).lean();

        if (!originalContent) {
            return res.status(404).json({
                success: false,
                message: "Content not found"
            });
        }

        // Remove _id and timestamps to create new document
        delete originalContent._id;
        delete originalContent.createdAt;
        delete originalContent.updatedAt;
        delete originalContent.__v;

        // Set as inactive and update modifier
        originalContent.isActive = false;
        originalContent.lastModifiedBy = req.id;
        originalContent.version = 1;

        const duplicatedContent = await HomeContent.create(originalContent);

        logger.info(`Homepage content duplicated: ${id} -> ${duplicatedContent._id} by admin ${req.id}`);

        return res.status(201).json({
            success: true,
            message: "Content duplicated successfully",
            content: duplicatedContent
        });
    } catch (error) {
        logger.error('Duplicate home content error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to duplicate content",
            error: error.message
        });
    }
};
