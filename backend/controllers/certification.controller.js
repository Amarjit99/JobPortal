import { User } from "../models/user.model.js";
import logger from "../utils/logger.js";

// @desc    Add new certification
// @route   POST /api/v1/user/certifications
// @access  Private
export const addCertification = async (req, res) => {
    try {
        const userId = req.id; // from isAuthenticated middleware
        const { name, issuingOrganization, issueDate, expirationDate, credentialID, credentialURL, certificateFile } = req.body;

        // Validation
        if (!name || !issuingOrganization) {
            logger.warn(`Certification add validation failed for user ${userId}`);
            return res.status(400).json({
                message: "Certification name and issuing organization are required",
                success: false
            });
        }

        // Validate dates if provided
        if (issueDate && expirationDate && new Date(issueDate) > new Date(expirationDate)) {
            return res.status(400).json({
                message: "Issue date cannot be after expiration date",
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

        // Create new certification entry
        const newCertification = {
            name,
            issuingOrganization,
            issueDate,
            expirationDate,
            credentialID,
            credentialURL,
            certificateFile
        };

        user.certifications.push(newCertification);
        await user.save();

        // Get the newly created certification (last item in array)
        const addedCertification = user.certifications[user.certifications.length - 1];

        logger.info(`Certification added for user ${userId}: ${name} from ${issuingOrganization}`);

        return res.status(201).json({
            message: "Certification added successfully",
            success: true,
            certification: addedCertification
        });

    } catch (error) {
        logger.error(`Error adding certification: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// @desc    Update certification
// @route   PUT /api/v1/user/certifications/:id
// @access  Private
export const updateCertification = async (req, res) => {
    try {
        const userId = req.id;
        const certificationId = req.params.id;
        const { name, issuingOrganization, issueDate, expirationDate, credentialID, credentialURL, certificateFile } = req.body;

        // Validate dates if provided
        if (issueDate && expirationDate && new Date(issueDate) > new Date(expirationDate)) {
            return res.status(400).json({
                message: "Issue date cannot be after expiration date",
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

        // Find the certification subdocument
        const certification = user.certifications.id(certificationId);
        if (!certification) {
            logger.warn(`Certification not found: ${certificationId} for user ${userId}`);
            return res.status(404).json({
                message: "Certification not found",
                success: false
            });
        }

        // Update fields if provided
        if (name !== undefined) certification.name = name;
        if (issuingOrganization !== undefined) certification.issuingOrganization = issuingOrganization;
        if (issueDate !== undefined) certification.issueDate = issueDate;
        if (expirationDate !== undefined) certification.expirationDate = expirationDate;
        if (credentialID !== undefined) certification.credentialID = credentialID;
        if (credentialURL !== undefined) certification.credentialURL = credentialURL;
        if (certificateFile !== undefined) certification.certificateFile = certificateFile;

        await user.save();

        logger.info(`Certification updated for user ${userId}: ${certificationId}`);

        return res.status(200).json({
            message: "Certification updated successfully",
            success: true,
            certification
        });

    } catch (error) {
        logger.error(`Error updating certification: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// @desc    Delete certification
// @route   DELETE /api/v1/user/certifications/:id
// @access  Private
export const deleteCertification = async (req, res) => {
    try {
        const userId = req.id;
        const certificationId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            logger.error(`User not found: ${userId}`);
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Find the certification subdocument
        const certification = user.certifications.id(certificationId);
        if (!certification) {
            logger.warn(`Certification not found: ${certificationId} for user ${userId}`);
            return res.status(404).json({
                message: "Certification not found",
                success: false
            });
        }

        // Remove the certification
        certification.deleteOne();
        await user.save();

        logger.info(`Certification deleted for user ${userId}: ${certificationId}`);

        return res.status(200).json({
            message: "Certification deleted successfully",
            success: true
        });

    } catch (error) {
        logger.error(`Error deleting certification: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// @desc    Get all certifications for current user
// @route   GET /api/v1/user/certifications
// @access  Private
export const getCertifications = async (req, res) => {
    try {
        const userId = req.id;

        const user = await User.findById(userId).select('certifications');
        if (!user) {
            logger.error(`User not found: ${userId}`);
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Sort certifications by issue date (most recent first)
        const sortedCertifications = user.certifications.sort((a, b) => {
            if (!a.issueDate) return 1;
            if (!b.issueDate) return -1;
            return new Date(b.issueDate) - new Date(a.issueDate);
        });

        logger.info(`Certifications fetched for user ${userId}: ${sortedCertifications.length} entries`);

        return res.status(200).json({
            message: "Certifications retrieved successfully",
            success: true,
            certifications: sortedCertifications
        });

    } catch (error) {
        logger.error(`Error fetching certifications: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};
