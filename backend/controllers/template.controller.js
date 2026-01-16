import { JobTemplate } from "../models/jobTemplate.model.js";
import logger from "../utils/logger.js";

// Create job template
export const createTemplate = async (req, res) => {
    try {
        const userId = req.id;
        const { name, description, template, isPublic } = req.body;

        if (!name || !template) {
            return res.status(400).json({
                message: "Template name and template data are required",
                success: false
            });
        }

        const newTemplate = await JobTemplate.create({
            name,
            description,
            template,
            createdBy: userId,
            isPublic: isPublic || false
        });

        logger.info(`Job template created: ${newTemplate._id} by user ${userId}`);

        return res.status(201).json({
            message: "Template created successfully",
            template: newTemplate,
            success: true
        });

    } catch (error) {
        logger.error('Error creating template:', error);
        return res.status(500).json({
            message: "Failed to create template",
            success: false
        });
    }
};

// Get all templates for user
export const getMyTemplates = async (req, res) => {
    try {
        const userId = req.id;

        const templates = await JobTemplate.find({
            $or: [
                { createdBy: userId },
                { isPublic: true }
            ]
        }).sort({ updatedAt: -1 });

        return res.status(200).json({
            templates,
            success: true
        });

    } catch (error) {
        logger.error('Error fetching templates:', error);
        return res.status(500).json({
            message: "Failed to fetch templates",
            success: false
        });
    }
};

// Get template by ID
export const getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;

        const template = await JobTemplate.findById(id);

        if (!template) {
            return res.status(404).json({
                message: "Template not found",
                success: false
            });
        }

        // Check access (owner or public)
        if (template.createdBy.toString() !== userId && !template.isPublic) {
            return res.status(403).json({
                message: "You don't have access to this template",
                success: false
            });
        }

        // Increment usage count
        template.usageCount += 1;
        await template.save();

        return res.status(200).json({
            template,
            success: true
        });

    } catch (error) {
        logger.error('Error fetching template:', error);
        return res.status(500).json({
            message: "Failed to fetch template",
            success: false
        });
    }
};

// Update template
export const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;
        const updates = req.body;

        const template = await JobTemplate.findById(id);

        if (!template) {
            return res.status(404).json({
                message: "Template not found",
                success: false
            });
        }

        // Only owner can update
        if (template.createdBy.toString() !== userId) {
            return res.status(403).json({
                message: "You are not authorized to update this template",
                success: false
            });
        }

        Object.assign(template, updates);
        await template.save();

        logger.info(`Template ${id} updated by user ${userId}`);

        return res.status(200).json({
            message: "Template updated successfully",
            template,
            success: true
        });

    } catch (error) {
        logger.error('Error updating template:', error);
        return res.status(500).json({
            message: "Failed to update template",
            success: false
        });
    }
};

// Delete template
export const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;

        const template = await JobTemplate.findById(id);

        if (!template) {
            return res.status(404).json({
                message: "Template not found",
                success: false
            });
        }

        // Only owner can delete
        if (template.createdBy.toString() !== userId) {
            return res.status(403).json({
                message: "You are not authorized to delete this template",
                success: false
            });
        }

        await JobTemplate.findByIdAndDelete(id);

        logger.info(`Template ${id} deleted by user ${userId}`);

        return res.status(200).json({
            message: "Template deleted successfully",
            success: true
        });

    } catch (error) {
        logger.error('Error deleting template:', error);
        return res.status(500).json({
            message: "Failed to delete template",
            success: false
        });
    }
};

export default {
    createTemplate,
    getMyTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate
};
