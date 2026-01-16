import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { Company } from "../models/company.model.js";
import logger from "../utils/logger.js";
import { logActivity, getRequestMetadata } from "../utils/activityLogger.js";

/**
 * Get moderation queue - Admin only
 * Returns jobs pending moderation, sorted by creation date
 */
export const getModerationQueue = async (req, res) => {
    try {
        const { status = 'pending,flagged' } = req.query;
        
        // Parse comma-separated statuses
        const statusArray = status.split(',').map(s => s.trim());
        
        const jobs = await Job.find({
            'moderation.status': { $in: statusArray }
        })
        .populate({
            path: 'company',
            select: 'name logo location verification'
        })
        .populate({
            path: 'created_by',
            select: 'fullname email phoneNumber'
        })
        .sort({ createdAt: 1 })  // Oldest first (FIFO)
        .lean();
        
        winston.info(`Admin ${req.id} fetched moderation queue: ${jobs.length} jobs`);
        
        return res.status(200).json({
            success: true,
            jobs,
            count: jobs.length
        });
        
    } catch (error) {
        winston.error('Error fetching moderation queue:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch moderation queue'
        });
    }
};

/**
 * Approve a job - Admin only
 * Sets job status to approved
 */
export const approveJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        
        const job = await Job.findById(jobId);
        
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        
        // Update moderation status
        job.moderation.status = 'approved';
        job.moderation.reviewedBy = req.id;  // Admin user ID
        job.moderation.reviewedAt = new Date();
        job.moderation.rejectionReason = undefined;  // Clear any previous rejection reason
        
        await job.save();
        
        winston.info(`Admin ${req.id} approved job ${jobId}`);
        
        // Log activity
        const metadata = getRequestMetadata(req);
        await logActivity({
            performedBy: req.id,
            action: 'job_approved',
            targetType: 'Job',
            targetId: job._id,
            targetName: job.title,
            details: {
                autoApproved: job.moderation.autoApproved
            },
            ...metadata
        });
        
        // TODO: Send email notification to job poster
        
        return res.status(200).json({
            success: true,
            message: 'Job approved successfully',
            job
        });
        
    } catch (error) {
        winston.error('Error approving job:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to approve job'
        });
    }
};

/**
 * Reject a job - Admin only
 * Sets job status to rejected with reason
 */
export const rejectJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { reason } = req.body;
        
        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }
        
        const job = await Job.findById(jobId);
        
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        
        // Update moderation status
        job.moderation.status = 'rejected';
        job.moderation.reviewedBy = req.id;
        job.moderation.reviewedAt = new Date();
        job.moderation.rejectionReason = reason;
        job.isActive = false;  // Deactivate rejected jobs
        
        await job.save();
        
        winston.info(`Admin ${req.id} rejected job ${jobId}: ${reason}`);
        
        // Log activity
        const metadata = getRequestMetadata(req);
        await logActivity({
            performedBy: req.id,
            action: 'job_rejected',
            targetType: 'Job',
            targetId: job._id,
            targetName: job.title,
            details: { reason },
            ...metadata
        });
        
        // TODO: Send email notification to job poster with reason
        
        return res.status(200).json({
            success: true,
            message: 'Job rejected successfully',
            job
        });
        
    } catch (error) {
        winston.error('Error rejecting job:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reject job'
        });
    }
};

/**
 * Flag a job as suspicious - Admin only
 * Marks job for further review
 */
export const flagJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { reason } = req.body;
        
        const job = await Job.findById(jobId);
        
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        
        job.moderation.status = 'flagged';
        job.moderation.reviewedBy = req.id;
        job.moderation.reviewedAt = new Date();
        if (reason) {
            job.moderation.rejectionReason = reason;
        }
        
        await job.save();
        
        winston.info(`Admin ${req.id} flagged job ${jobId} as suspicious`);
        
        // Log activity
        const metadata = getRequestMetadata(req);
        await logActivity({
            performedBy: req.id,
            action: 'job_flagged',
            targetType: 'Job',
            targetId: job._id,
            targetName: job.title,
            details: { reason: reason || 'Flagged for review' },
            ...metadata
        });
        
        return res.status(200).json({
            success: true,
            message: 'Job flagged for review',
            job
        });
        
    } catch (error) {
        winston.error('Error flagging job:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to flag job'
        });
    }
};

/**
 * Report a job - Users can report spam/inappropriate jobs
 */
export const reportJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { reason, description } = req.body;
        
        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Report reason is required'
            });
        }
        
        const validReasons = ['spam', 'inappropriate', 'fraud', 'duplicate', 'other'];
        if (!validReasons.includes(reason)) {
            return res.status(400).json({
                success: false,
                message: `Invalid reason. Must be one of: ${validReasons.join(', ')}`
            });
        }
        
        const job = await Job.findById(jobId);
        
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        
        // Check if user already reported this job
        const existingReport = job.reports.find(
            report => report.reportedBy.toString() === req.id
        );
        
        if (existingReport) {
            return res.status(400).json({
                success: false,
                message: 'You have already reported this job'
            });
        }
        
        // Add report
        job.reports.push({
            reportedBy: req.id,
            reason,
            description: description || '',
            status: 'pending',
            createdAt: new Date()
        });
        
        // Auto-flag if multiple reports (3+)
        if (job.reports.length >= 3 && job.moderation.status === 'approved') {
            job.moderation.status = 'flagged';
            job.moderation.rejectionReason = `Auto-flagged: ${job.reports.length} user reports`;
        }
        
        await job.save();
        
        winston.info(`User ${req.id} reported job ${jobId} for ${reason}`);
        
        return res.status(200).json({
            success: true,
            message: 'Job reported successfully. Our team will review it.',
            job
        });
        
    } catch (error) {
        winston.error('Error reporting job:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to report job'
        });
    }
};

/**
 * Get reports for a specific job - Admin only
 */
export const getJobReports = async (req, res) => {
    try {
        const { jobId } = req.params;
        
        const job = await Job.findById(jobId)
            .populate({
                path: 'reports.reportedBy',
                select: 'fullname email'
            })
            .lean();
        
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            reports: job.reports || [],
            count: job.reports?.length || 0
        });
        
    } catch (error) {
        winston.error('Error fetching job reports:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch reports'
        });
    }
};

/**
 * Update report status - Admin only
 * Mark report as resolved or dismissed
 */
export const updateReportStatus = async (req, res) => {
    try {
        const { jobId, reportId } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['pending', 'resolved', 'dismissed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }
        
        const job = await Job.findById(jobId);
        
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        
        const report = job.reports.id(reportId);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        
        report.status = status;
        await job.save();
        
        winston.info(`Admin ${req.id} updated report ${reportId} status to ${status}`);
        
        return res.status(200).json({
            success: true,
            message: 'Report status updated',
            report
        });
        
    } catch (error) {
        winston.error('Error updating report status:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update report status'
        });
    }
};

export default {
    getModerationQueue,
    approveJob,
    rejectJob,
    flagJob,
    reportJob,
    getJobReports,
    updateReportStatus
};
