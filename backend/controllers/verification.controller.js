import { Company } from "../models/company.model.js";
import { User } from "../models/user.model.js";
import logger from "../utils/logger.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { logActivity, getRequestMetadata } from "../utils/activityLogger.js";

// @desc    Submit verification documents
// @route   POST /api/v1/verification/submit
// @access  Private (Recruiter only)
export const submitVerificationDocs = async (req, res) => {
    try {
        const userId = req.id;
        const { companyId } = req.body;
        const files = req.files; // Multiple files: gstCertificate, panCard, registrationCertificate

        if (!companyId) {
            return res.status(400).json({
                message: "Company ID is required",
                success: false
            });
        }

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                message: "Company not found",
                success: false
            });
        }

        // Check if user owns this company
        if (company.userId.toString() !== userId) {
            return res.status(403).json({
                message: "You are not authorized to verify this company",
                success: false
            });
        }

        // Check if already approved
        if (company.verification?.status === 'approved') {
            return res.status(400).json({
                message: "Company is already verified",
                success: false
            });
        }

        // Upload documents to Cloudinary
        const uploadedDocs = {};

        if (files?.gstCertificate?.[0]) {
            const fileUri = getDataUri(files.gstCertificate[0]);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                folder: 'job-portal/verification/gst',
                resource_type: 'auto'
            });
            uploadedDocs.gstCertificate = {
                url: cloudResponse.secure_url,
                uploadedAt: new Date()
            };
        }

        if (files?.panCard?.[0]) {
            const fileUri = getDataUri(files.panCard[0]);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                folder: 'job-portal/verification/pan',
                resource_type: 'auto'
            });
            uploadedDocs.panCard = {
                url: cloudResponse.secure_url,
                uploadedAt: new Date()
            };
        }

        if (files?.registrationCertificate?.[0]) {
            const fileUri = getDataUri(files.registrationCertificate[0]);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                folder: 'job-portal/verification/registration',
                resource_type: 'auto'
            });
            uploadedDocs.registrationCertificate = {
                url: cloudResponse.secure_url,
                uploadedAt: new Date()
            };
        }

        // Require at least 2 documents
        if (Object.keys(uploadedDocs).length < 2) {
            return res.status(400).json({
                message: "Please upload at least 2 verification documents",
                success: false
            });
        }

        // Update company verification status
        const isResubmission = company.verification?.status === 'rejected';
        company.verification = {
            status: isResubmission ? 'resubmitted' : 'pending',
            documents: {
                ...company.verification?.documents,
                ...uploadedDocs
            },
            submittedAt: new Date(),
            resubmissionCount: isResubmission ? (company.verification.resubmissionCount || 0) + 1 : 0
        };

        await company.save();

        logger.info(`Verification documents submitted for company ${companyId} by user ${userId}`);

        return res.status(200).json({
            message: "Verification documents submitted successfully. Your request will be reviewed by admin.",
            success: true,
            company
        });

    } catch (error) {
        logger.error(`Error submitting verification documents: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// @desc    Get verification status
// @route   GET /api/v1/verification/status/:companyId
// @access  Private (Recruiter only)
export const getVerificationStatus = async (req, res) => {
    try {
        const userId = req.id;
        const { companyId } = req.params;

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                message: "Company not found",
                success: false
            });
        }

        // Check if user owns this company
        if (company.userId.toString() !== userId) {
            return res.status(403).json({
                message: "You are not authorized to view this company's verification status",
                success: false
            });
        }

        return res.status(200).json({
            message: "Verification status retrieved successfully",
            success: true,
            verification: company.verification || { status: 'pending' }
        });

    } catch (error) {
        logger.error(`Error getting verification status: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// @desc    Approve company verification
// @route   PUT /api/v1/verification/approve/:companyId
// @access  Private (Admin only)
export const approveCompany = async (req, res) => {
    try {
        const adminId = req.id;
        const { companyId } = req.params;

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                message: "Company not found",
                success: false
            });
        }

        if (company.verification?.status === 'approved') {
            return res.status(400).json({
                message: "Company is already verified",
                success: false
            });
        }

        company.verification.status = 'approved';
        company.verification.verifiedAt = new Date();
        company.verification.verifiedBy = adminId;
        company.verification.rejectionReason = undefined;

        await company.save();

        logger.info(`Company ${companyId} approved by admin ${adminId}`);

        // Log activity
        const metadata = getRequestMetadata(req);
        await logActivity({
            performedBy: adminId,
            action: 'company_approved',
            targetType: 'Company',
            targetId: company._id,
            targetName: company.name,
            details: {},
            ...metadata
        });

        // TODO: Send email notification to company owner

        return res.status(200).json({
            message: "Company verification approved successfully",
            success: true,
            company
        });

    } catch (error) {
        logger.error(`Error approving company: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// @desc    Reject company verification
// @route   PUT /api/v1/verification/reject/:companyId
// @access  Private (Admin only)
export const rejectCompany = async (req, res) => {
    try {
        const adminId = req.id;
        const { companyId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                message: "Rejection reason is required",
                success: false
            });
        }

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                message: "Company not found",
                success: false
            });
        }

        company.verification.status = 'rejected';
        company.verification.rejectionReason = reason;
        company.verification.verifiedAt = undefined;
        company.verification.verifiedBy = adminId;

        await company.save();

        logger.info(`Company ${companyId} rejected by admin ${adminId}`);

        // Log activity
        const metadata = getRequestMetadata(req);
        await logActivity({
            performedBy: adminId,
            action: 'company_rejected',
            targetType: 'Company',
            targetId: company._id,
            targetName: company.name,
            details: { reason },
            ...metadata
        });

        // TODO: Send email notification to company owner with rejection reason

        return res.status(200).json({
            message: "Company verification rejected",
            success: true,
            company
        });

    } catch (error) {
        logger.error(`Error rejecting company: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// @desc    Get verification queue (pending companies)
// @route   GET /api/v1/verification/queue
// @access  Private (Admin only)
export const getVerificationQueue = async (req, res) => {
    try {
        const { status = 'pending' } = req.query;

        const companies = await Company.find({
            'verification.status': { $in: status.split(',') }
        })
        .populate('userId', 'fullname email phoneNumber')
        .sort({ 'verification.submittedAt': 1 }); // Oldest first

        logger.info(`Verification queue fetched: ${companies.length} companies`);

        return res.status(200).json({
            message: "Verification queue retrieved successfully",
            success: true,
            companies,
            count: companies.length
        });

    } catch (error) {
        logger.error(`Error fetching verification queue: ${error.message}`, { stack: error.stack });
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};
