import { User } from "../models/user.model.js";
import logger from "../utils/logger.js";

// @desc    Update job preferences
// @route   PUT /api/v1/user/preferences
// @access  Private
export const updateJobPreferences = async (req, res) => {
    try {
        const userId = req.id;
        const { preferredJobLocations, expectedSalary, noticePeriod } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            logger.error(`User not found: ${userId}`);
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Update preferred job locations
        if (preferredJobLocations !== undefined) {
            user.preferredJobLocations = preferredJobLocations;
        }

        // Update expected salary
        if (expectedSalary !== undefined) {
            if (expectedSalary.min !== undefined) user.expectedSalary.min = expectedSalary.min;
            if (expectedSalary.max !== undefined) user.expectedSalary.max = expectedSalary.max;
            if (expectedSalary.currency !== undefined) user.expectedSalary.currency = expectedSalary.currency;
        }

        // Update notice period
        if (noticePeriod !== undefined) {
            if (noticePeriod.immediate !== undefined) {
                user.noticePeriod.immediate = noticePeriod.immediate;
                if (noticePeriod.immediate) {
                    user.noticePeriod.value = 0;
                }
            }
            if (noticePeriod.value !== undefined && !user.noticePeriod.immediate) {
                user.noticePeriod.value = noticePeriod.value;
            }
        }

        await user.save();

        logger.info(`Job preferences updated for user ${userId}`);

        return res.status(200).json({
            message: "Job preferences updated successfully",
            success: true,
            preferences: {
                preferredJobLocations: user.preferredJobLocations,
                expectedSalary: user.expectedSalary,
                noticePeriod: user.noticePeriod
            }
        });

    } catch (error) {
        logger.error(`Error updating job preferences: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// @desc    Get job preferences
// @route   GET /api/v1/user/preferences
// @access  Private
export const getJobPreferences = async (req, res) => {
    try {
        const userId = req.id;

        const user = await User.findById(userId).select('preferredJobLocations expectedSalary noticePeriod');
        if (!user) {
            logger.error(`User not found: ${userId}`);
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        logger.info(`Job preferences fetched for user ${userId}`);

        return res.status(200).json({
            message: "Job preferences retrieved successfully",
            success: true,
            preferences: {
                preferredJobLocations: user.preferredJobLocations || [],
                expectedSalary: user.expectedSalary || {},
                noticePeriod: user.noticePeriod || {}
            }
        });

    } catch (error) {
        logger.error(`Error fetching job preferences: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};
