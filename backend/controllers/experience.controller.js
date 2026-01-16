import { User } from "../models/user.model.js";
import logger from "../utils/logger.js";

// @desc    Add new work experience
// @route   POST /api/v1/user/experience
// @access  Private
export const addExperience = async (req, res) => {
    try {
        const userId = req.id; // from isAuthenticated middleware
        const { title, company, location, startDate, endDate, current, description, skills } = req.body;

        // Validation
        if (!title || !company || !startDate) {
            logger.warn(`Experience add validation failed for user ${userId}`);
            return res.status(400).json({
                message: "Title, company, and start date are required",
                success: false
            });
        }

        // Validate dates
        if (endDate && new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({
                message: "Start date cannot be after end date",
                success: false
            });
        }

        // If current is true, endDate should not be provided
        if (current && endDate) {
            return res.status(400).json({
                message: "Cannot specify end date for current position",
                success: false
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            logger.error(`User not found: ${userId}`);
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Create new experience entry
        const newExperience = {
            title,
            company,
            location,
            startDate,
            endDate: current ? null : endDate,
            current: current || false,
            description,
            skills: skills || []
        };

        user.experience.push(newExperience);
        await user.save();

        // Get the newly created experience (last item in array)
        const addedExperience = user.experience[user.experience.length - 1];

        logger.info(`Experience added for user ${userId}: ${title} at ${company}`);

        return res.status(201).json({
            message: "Work experience added successfully",
            success: true,
            experience: addedExperience
        });

    } catch (error) {
        logger.error(`Error adding experience: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// @desc    Update work experience
// @route   PUT /api/v1/user/experience/:id
// @access  Private
export const updateExperience = async (req, res) => {
    try {
        const userId = req.id;
        const experienceId = req.params.id;
        const { title, company, location, startDate, endDate, current, description, skills } = req.body;

        // Validate dates if provided
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({
                message: "Start date cannot be after end date",
                success: false
            });
        }

        // If current is true, endDate should not be provided
        if (current && endDate) {
            return res.status(400).json({
                message: "Cannot specify end date for current position",
                success: false
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            logger.error(`User not found: ${userId}`);
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Find the experience subdocument
        const experience = user.experience.id(experienceId);
        if (!experience) {
            logger.warn(`Experience not found: ${experienceId} for user ${userId}`);
            return res.status(404).json({
                message: "Work experience not found",
                success: false
            });
        }

        // Update fields if provided
        if (title !== undefined) experience.title = title;
        if (company !== undefined) experience.company = company;
        if (location !== undefined) experience.location = location;
        if (startDate !== undefined) experience.startDate = startDate;
        if (current !== undefined) {
            experience.current = current;
            if (current) {
                experience.endDate = null;
            }
        }
        if (endDate !== undefined && !experience.current) experience.endDate = endDate;
        if (description !== undefined) experience.description = description;
        if (skills !== undefined) experience.skills = skills;

        await user.save();

        logger.info(`Experience updated for user ${userId}: ${experienceId}`);

        return res.status(200).json({
            message: "Work experience updated successfully",
            success: true,
            experience
        });

    } catch (error) {
        logger.error(`Error updating experience: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// @desc    Delete work experience
// @route   DELETE /api/v1/user/experience/:id
// @access  Private
export const deleteExperience = async (req, res) => {
    try {
        const userId = req.id;
        const experienceId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            logger.error(`User not found: ${userId}`);
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Find the experience subdocument
        const experience = user.experience.id(experienceId);
        if (!experience) {
            logger.warn(`Experience not found: ${experienceId} for user ${userId}`);
            return res.status(404).json({
                message: "Work experience not found",
                success: false
            });
        }

        // Remove the experience
        experience.deleteOne();
        await user.save();

        logger.info(`Experience deleted for user ${userId}: ${experienceId}`);

        return res.status(200).json({
            message: "Work experience deleted successfully",
            success: true
        });

    } catch (error) {
        logger.error(`Error deleting experience: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// @desc    Get all work experiences for current user
// @route   GET /api/v1/user/experience
// @access  Private
export const getExperience = async (req, res) => {
    try {
        const userId = req.id;

        const user = await User.findById(userId).select('experience');
        if (!user) {
            logger.error(`User not found: ${userId}`);
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Sort experience by start date (most recent first)
        const sortedExperience = user.experience.sort((a, b) => {
            return new Date(b.startDate) - new Date(a.startDate);
        });

        logger.info(`Experience fetched for user ${userId}: ${sortedExperience.length} entries`);

        return res.status(200).json({
            message: "Work experience retrieved successfully",
            success: true,
            experience: sortedExperience
        });

    } catch (error) {
        logger.error(`Error fetching experience: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};
