import { User } from "../models/user.model.js";
import logger from "../utils/logger.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

// @desc    Upload new resume
// @route   POST /api/v1/user/resume/upload
// @access  Private
export const uploadResume = async (req, res) => {
    try {
        const userId = req.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                message: "No file uploaded",
                success: false
            });
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({
                message: "Invalid file type. Only PDF, DOC, and DOCX are allowed",
                success: false
            });
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            return res.status(400).json({
                message: "File size exceeds 5MB limit",
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

        // Check if user already has 5 resumes
        if (user.resumes && user.resumes.length >= 5) {
            return res.status(400).json({
                message: "Maximum 5 resumes allowed. Please delete an existing resume to upload a new one",
                success: false
            });
        }

        // Upload to Cloudinary
        const fileUri = getDataUri(file);
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
            folder: 'job-portal/resumes',
            resource_type: 'auto'
        });

        // If this is the first resume, make it default
        const isFirstResume = !user.resumes || user.resumes.length === 0;

        const newResume = {
            fileName: file.filename,
            originalName: file.originalname,
            cloudinaryUrl: cloudResponse.secure_url,
            uploadedAt: new Date(),
            isDefault: isFirstResume,
            fileSize: file.size
        };

        user.resumes.push(newResume);

        // Also update the old profile.resume field for backward compatibility
        if (isFirstResume) {
            user.profile.resume = cloudResponse.secure_url;
            user.profile.resumeOriginalName = file.originalname;
        }

        await user.save();

        const addedResume = user.resumes[user.resumes.length - 1];

        logger.info(`Resume uploaded for user ${userId}: ${file.originalname}`);

        return res.status(201).json({
            message: "Resume uploaded successfully",
            success: true,
            resume: addedResume
        });

    } catch (error) {
        logger.error(`Error uploading resume: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// @desc    Get all resumes for current user
// @route   GET /api/v1/user/resume
// @access  Private
export const getAllResumes = async (req, res) => {
    try {
        const userId = req.id;

        const user = await User.findById(userId).select('resumes');
        if (!user) {
            logger.error(`User not found: ${userId}`);
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Sort resumes by uploadedAt (most recent first)
        const sortedResumes = (user.resumes || []).sort((a, b) => {
            return new Date(b.uploadedAt) - new Date(a.uploadedAt);
        });

        logger.info(`Resumes fetched for user ${userId}: ${sortedResumes.length} entries`);

        return res.status(200).json({
            message: "Resumes retrieved successfully",
            success: true,
            resumes: sortedResumes
        });

    } catch (error) {
        logger.error(`Error fetching resumes: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// @desc    Set default resume
// @route   PUT /api/v1/user/resume/:id/default
// @access  Private
export const setDefaultResume = async (req, res) => {
    try {
        const userId = req.id;
        const resumeId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            logger.error(`User not found: ${userId}`);
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Find the resume
        const resume = user.resumes.id(resumeId);
        if (!resume) {
            logger.warn(`Resume not found: ${resumeId} for user ${userId}`);
            return res.status(404).json({
                message: "Resume not found",
                success: false
            });
        }

        // Set all resumes to non-default
        user.resumes.forEach(r => r.isDefault = false);

        // Set the selected resume as default
        resume.isDefault = true;

        // Update old profile fields for backward compatibility
        user.profile.resume = resume.cloudinaryUrl;
        user.profile.resumeOriginalName = resume.originalName;

        await user.save();

        logger.info(`Default resume set for user ${userId}: ${resumeId}`);

        return res.status(200).json({
            message: "Default resume updated successfully",
            success: true,
            resume
        });

    } catch (error) {
        logger.error(`Error setting default resume: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// @desc    Delete resume
// @route   DELETE /api/v1/user/resume/:id
// @access  Private
export const deleteResume = async (req, res) => {
    try {
        const userId = req.id;
        const resumeId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            logger.error(`User not found: ${userId}`);
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Find the resume
        const resume = user.resumes.id(resumeId);
        if (!resume) {
            logger.warn(`Resume not found: ${resumeId} for user ${userId}`);
            return res.status(404).json({
                message: "Resume not found",
                success: false
            });
        }

        const wasDefault = resume.isDefault;

        // Delete from Cloudinary
        try {
            const publicId = resume.cloudinaryUrl.split('/').slice(-2).join('/').split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        } catch (cloudinaryError) {
            logger.warn(`Failed to delete from Cloudinary: ${cloudinaryError.message}`);
            // Continue with database deletion even if Cloudinary deletion fails
        }

        // Remove the resume
        resume.deleteOne();

        // If deleted resume was default, set first remaining resume as default
        if (wasDefault && user.resumes.length > 0) {
            user.resumes[0].isDefault = true;
            user.profile.resume = user.resumes[0].cloudinaryUrl;
            user.profile.resumeOriginalName = user.resumes[0].originalName;
        } else if (user.resumes.length === 0) {
            // No resumes left, clear old profile fields
            user.profile.resume = null;
            user.profile.resumeOriginalName = null;
        }

        await user.save();

        logger.info(`Resume deleted for user ${userId}: ${resumeId}`);

        return res.status(200).json({
            message: "Resume deleted successfully",
            success: true
        });

    } catch (error) {
        logger.error(`Error deleting resume: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// @desc    Download resume
// @route   GET /api/v1/user/resume/:id/download
// @access  Private
export const downloadResume = async (req, res) => {
    try {
        const userId = req.id;
        const resumeId = req.params.id;

        const user = await User.findById(userId).select('resumes');
        if (!user) {
            logger.error(`User not found: ${userId}`);
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Find the resume
        const resume = user.resumes.id(resumeId);
        if (!resume) {
            logger.warn(`Resume not found: ${resumeId} for user ${userId}`);
            return res.status(404).json({
                message: "Resume not found",
                success: false
            });
        }

        logger.info(`Resume download requested for user ${userId}: ${resumeId}`);

        return res.status(200).json({
            message: "Resume URL retrieved successfully",
            success: true,
            url: resume.cloudinaryUrl,
            filename: resume.originalName
        });

    } catch (error) {
        logger.error(`Error downloading resume: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};
