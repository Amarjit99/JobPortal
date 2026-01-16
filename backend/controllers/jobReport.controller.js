import { Job } from "../models/job.model.js";
import logger from "../utils/logger.js";
import { cacheHelper } from "../utils/redis.js";

// Report a job
export const reportJob = async (req, res) => {
    try {
        const { id: jobId } = req.params;
        const { reason, description } = req.body;
        const userId = req.id;
        
        if (!reason) {
            return res.status(400).json({
                message: "Report reason is required",
                success: false
            });
        }
        
        const validReasons = ['spam', 'inappropriate', 'fraud', 'duplicate', 'other'];
        if (!validReasons.includes(reason)) {
            return res.status(400).json({
                message: "Invalid report reason",
                success: false
            });
        }
        
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }
        
        // Check if user already reported this job
        const existingReport = job.reports.find(
            report => report.reportedBy.toString() === userId && report.status === 'pending'
        );
        
        if (existingReport) {
            return res.status(400).json({
                message: "You have already reported this job",
                success: false
            });
        }
        
        // Add report
        job.reports.push({
            reportedBy: userId,
            reason,
            description: description || '',
            status: 'pending',
            createdAt: new Date()
        });
        
        // Flag job if it has 3 or more reports
        const pendingReportsCount = job.reports.filter(r => r.status === 'pending').length;
        if (pendingReportsCount >= 3 && job.moderation.status !== 'flagged') {
            job.moderation.status = 'flagged';
            job.isActive = false;
            logger.warn(`Job ${jobId} auto-flagged due to ${pendingReportsCount} reports`);
        }
        
        await job.save();
        
        // Invalidate cache
        await cacheHelper.delPattern('jobs:all:*');
        
        logger.info(`Job ${jobId} reported by user ${userId} for reason: ${reason}`);
        
        return res.status(200).json({
            message: "Job reported successfully. Our team will review it.",
            success: true
        });
    } catch (error) {
        logger.error('Error reporting job:', error);
        return res.status(500).json({
            message: "Failed to report job",
            success: false
        });
    }
};

// Get job reports (admin only)
export const getJobReports = async (req, res) => {
    try {
        const { status = 'pending', page = 1, limit = 20 } = req.query;
        
        const validStatuses = ['pending', 'resolved', 'dismissed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status",
                success: false
            });
        }
        
        const skip = (page - 1) * limit;
        
        // Find jobs that have reports with the specified status
        const jobs = await Job.find({
            'reports.status': status
        })
            .populate('company', 'name logo')
            .populate('created_by', 'fullname email')
            .populate('reports.reportedBy', 'fullname email')
            .select('title description reports moderation createdAt')
            .sort({ 'reports.createdAt': -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        // Filter reports by status for each job
        const jobsWithFilteredReports = jobs.map(job => {
            const jobObj = job.toObject();
            jobObj.reports = jobObj.reports.filter(r => r.status === status);
            jobObj.reportCount = jobObj.reports.length;
            return jobObj;
        });
        
        const total = await Job.countDocuments({ 'reports.status': status });
        
        logger.info(`Job reports fetched by admin ${req.id}: ${jobs.length} jobs with ${status} reports`);
        
        return res.status(200).json({
            success: true,
            jobs: jobsWithFilteredReports,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        logger.error('Error getting job reports:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Resolve/dismiss job report (admin only)
export const updateReportStatus = async (req, res) => {
    try {
        const { id: jobId, reportId } = req.params;
        const { status, action } = req.body;
        const adminId = req.id;
        
        if (!status || !['resolved', 'dismissed'].includes(status)) {
            return res.status(400).json({
                message: "Invalid status. Must be 'resolved' or 'dismissed'",
                success: false
            });
        }
        
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }
        
        const report = job.reports.id(reportId);
        if (!report) {
            return res.status(404).json({
                message: "Report not found",
                success: false
            });
        }
        
        report.status = status;
        
        // If resolved and action is to remove job, flag it
        if (status === 'resolved' && action === 'flag') {
            job.moderation.status = 'flagged';
            job.isActive = false;
        } else if (status === 'dismissed') {
            // If dismissed, check if we should unflag the job
            const pendingReports = job.reports.filter(r => r.status === 'pending').length;
            if (pendingReports === 0 && job.moderation.status === 'flagged') {
                job.moderation.status = 'approved';
                job.isActive = true;
            }
        }
        
        await job.save();
        
        logger.info(`Report ${reportId} for job ${jobId} ${status} by admin ${adminId}`);
        
        return res.status(200).json({
            message: `Report ${status} successfully`,
            job,
            success: true
        });
    } catch (error) {
        logger.error('Error updating report status:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};
