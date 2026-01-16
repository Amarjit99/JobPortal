import { User } from '../models/user.model.js';
import logger from '../utils/logger.js';

/**
 * Add new education entry
 * POST /api/v1/user/education
 */
export const addEducation = async (req, res) => {
    try {
        const userId = req.id;
        const { degree, institution, fieldOfStudy, startDate, endDate, grade, description, current } = req.body;

        // Validation
        if (!degree || !institution || !startDate) {
            return res.status(400).json({
                success: false,
                message: 'Degree, institution, and start date are required'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Add education entry
        const educationEntry = {
            degree,
            institution,
            fieldOfStudy: fieldOfStudy || '',
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            grade: grade || '',
            description: description || '',
            current: current || false
        };

        user.education.push(educationEntry);
        await user.save();

        logger.info(`Education added for user ${userId}`);

        return res.status(201).json({
            success: true,
            message: 'Education added successfully',
            education: user.education[user.education.length - 1]
        });
    } catch (error) {
        logger.error('Add education error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add education',
            error: error.message
        });
    }
};

/**
 * Update education entry
 * PUT /api/v1/user/education/:id
 */
export const updateEducation = async (req, res) => {
    try {
        const userId = req.id;
        const educationId = req.params.id;
        const { degree, institution, fieldOfStudy, startDate, endDate, grade, description, current } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Find education entry
        const education = user.education.id(educationId);
        if (!education) {
            return res.status(404).json({
                success: false,
                message: 'Education entry not found'
            });
        }

        // Update fields
        if (degree) education.degree = degree;
        if (institution) education.institution = institution;
        if (fieldOfStudy !== undefined) education.fieldOfStudy = fieldOfStudy;
        if (startDate) education.startDate = new Date(startDate);
        if (endDate !== undefined) education.endDate = endDate ? new Date(endDate) : null;
        if (grade !== undefined) education.grade = grade;
        if (description !== undefined) education.description = description;
        if (current !== undefined) education.current = current;

        await user.save();

        logger.info(`Education updated for user ${userId}, education ${educationId}`);

        return res.status(200).json({
            success: true,
            message: 'Education updated successfully',
            education
        });
    } catch (error) {
        logger.error('Update education error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update education',
            error: error.message
        });
    }
};

/**
 * Delete education entry
 * DELETE /api/v1/user/education/:id
 */
export const deleteEducation = async (req, res) => {
    try {
        const userId = req.id;
        const educationId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Find and remove education entry
        const education = user.education.id(educationId);
        if (!education) {
            return res.status(404).json({
                success: false,
                message: 'Education entry not found'
            });
        }

        education.deleteOne();
        await user.save();

        logger.info(`Education deleted for user ${userId}, education ${educationId}`);

        return res.status(200).json({
            success: true,
            message: 'Education deleted successfully'
        });
    } catch (error) {
        logger.error('Delete education error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete education',
            error: error.message
        });
    }
};

/**
 * Get all education entries for user
 * GET /api/v1/user/education
 */
export const getEducation = async (req, res) => {
    try {
        const userId = req.id;

        const user = await User.findById(userId).select('education');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Sort by start date (most recent first)
        const education = user.education.sort((a, b) => 
            new Date(b.startDate) - new Date(a.startDate)
        );

        return res.status(200).json({
            success: true,
            education
        });
    } catch (error) {
        logger.error('Get education error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch education',
            error: error.message
        });
    }
};
