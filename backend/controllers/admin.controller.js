import { User } from "../models/user.model.js";
import { Company } from "../models/company.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { ActivityLog } from "../models/activityLog.model.js";
import logger from "../utils/logger.js";
import { logActivity, getRequestMetadata } from "../utils/activityLogger.js";
import { sendCompanyVerificationEmail } from "../utils/emailService.js";
import { calculateQualityScore, calculateSpamScore } from "../utils/jobModeration.js";

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
    try {
        logger.info('getAllUsers called by user:', req.id);
        const { 
            role, 
            search, 
            status, 
            verified, 
            startDate, 
            endDate, 
            page = 1, 
            limit = 10 
        } = req.query;
        
        let query = {};
        
        // Filter by role if provided
        if (role && ['student', 'recruiter', 'admin', 'sub-admin'].includes(role)) {
            query.role = role;
        }
        
        // Filter by status (blocked/active)
        if (status === 'blocked') {
            query.isBlocked = true;
        } else if (status === 'active') {
            query.isBlocked = { $ne: true };
        }
        
        // Filter by verification status
        if (verified === 'true') {
            query.isVerified = true;
        } else if (verified === 'false') {
            query.isVerified = false;
        }
        
        // Filter by registration date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }
        
        // Search by name or email
        if (search) {
            query.$or = [
                { fullname: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        const skip = (page - 1) * limit;
        
        const users = await User.find(query)
            .select('-password -verificationToken -passwordResetToken -refreshToken -twoFactorSecret -backupCodes')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        
        const total = await User.countDocuments(query);
        
        // Get summary stats
        const stats = {
            total,
            blocked: await User.countDocuments({ ...query, isBlocked: true }),
            active: await User.countDocuments({ ...query, isBlocked: { $ne: true } }),
            verified: await User.countDocuments({ ...query, isVerified: true }),
            unverified: await User.countDocuments({ ...query, isVerified: false })
        };
        
        return res.status(200).json({
            success: true,
            users,
            stats,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Error getting all users:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get all companies (admin sees all, recruiter sees only their own)
export const getAllCompaniesAdmin = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const userRole = req.userRole;
        const userId = req.id;
        
        let query = {};
        
        // Recruiters only see their own companies
        if (userRole === 'recruiter') {
            query.userId = userId;
        }
        // Admin sees all companies (no filter)
        
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        
        const skip = (page - 1) * limit;
        
        const companies = await Company.find(query)
            .populate('userId', 'fullname email')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        
        const total = await Company.countDocuments(query);
        
        return res.status(200).json({
            success: true,
            companies,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Error getting companies:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get all jobs (admin sees all, recruiter sees only their own)
export const getAllJobsAdmin = async (req, res) => {
    try {
        const { search, location, page = 1, limit = 10 } = req.query;
        const userRole = req.userRole;
        const userId = req.id;
        
        let query = {};
        
        // Recruiters only see jobs from their companies
        if (userRole === 'recruiter') {
            const companies = await Company.find({ userId }).select('_id');
            const companyIds = companies.map(c => c._id);
            query.company = { $in: companyIds };
        }
        // Admin sees all jobs (no filter)
        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }
        
        const skip = (page - 1) * limit;
        
        const jobs = await Job.find(query)
            .populate('company', 'name location logo')
            .populate('created_by', 'fullname email')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        
        const total = await Job.countDocuments(query);
        
        return res.status(200).json({
            success: true,
            jobs,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Error getting jobs:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get all applications (admin sees all, recruiter sees only for their jobs)
export const getAllApplicationsAdmin = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const userRole = req.userRole;
        const userId = req.id;
        
        let query = {};
        
        // Recruiters only see applications for their jobs
        if (userRole === 'recruiter') {
            const companies = await Company.find({ userId }).select('_id');
            const companyIds = companies.map(c => c._id);
            const jobs = await Job.find({ company: { $in: companyIds } }).select('_id');
            const jobIds = jobs.map(j => j._id);
            query.job = { $in: jobIds };
        }
        // Admin sees all applications (no filter)
        
        if (status) {
            query.status = status;
        }
        
        const skip = (page - 1) * limit;
        
        const applications = await Application.find(query)
            .populate('applicant', 'fullname email phoneNumber')
            .populate({
                path: 'job',
                populate: {
                    path: 'company',
                    select: 'name'
                }
            })
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        
        const total = await Application.countDocuments(query);
        
        return res.status(200).json({
            success: true,
            applications,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Error getting applications:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get admin statistics
export const getAdminStats = async (req, res) => {
    try {
        logger.info('getAdminStats called by user:', req.id);
        const totalUsers = await User.countDocuments();
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalRecruiters = await User.countDocuments({ role: 'recruiter' });
        const totalCompanies = await Company.countDocuments();
        const totalJobs = await Job.countDocuments();
        const totalApplications = await Application.countDocuments();
        
        // Recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
        const newJobs = await Job.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
        const newApplications = await Application.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
        
        return res.status(200).json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    students: totalStudents,
                    recruiters: totalRecruiters,
                    newThisMonth: newUsers
                },
                companies: {
                    total: totalCompanies
                },
                jobs: {
                    total: totalJobs,
                    newThisMonth: newJobs
                },
                applications: {
                    total: totalApplications,
                    newThisMonth: newApplications
                }
            }
        });
    } catch (error) {
        logger.error('Error getting admin stats:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }
        
        // Don't allow deleting admin users
        if (user.role === 'admin') {
            return res.status(403).json({
                message: "Cannot delete admin users",
                success: false
            });
        }
        
        await User.findByIdAndDelete(id);
        
        logger.info(`User ${id} deleted by admin ${req.id}`);
        
        return res.status(200).json({
            message: "User deleted successfully",
            success: true
        });
    } catch (error) {
        logger.error('Error deleting user:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Update user role (admin only)
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, reason } = req.body;
        
        if (!['student', 'recruiter', 'admin', 'sub-admin'].includes(role)) {
            return res.status(400).json({
                message: "Invalid role",
                success: false
            });
        }
        
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }
        
        const previousRole = user.role;
        
        // Update role and add to history
        user.role = role;
        user.roleChangeHistory.push({
            previousRole,
            newRole: role,
            changedBy: req.id,
            changedAt: new Date(),
            reason: reason || 'Role changed by admin'
        });
        
        await user.save();
        
        // Log activity
        const metadata = getRequestMetadata(req);
        await logActivity({
            performedBy: req.id,
            action: 'user_role_changed',
            targetType: 'User',
            targetId: user._id,
            targetName: user.fullname,
            details: {
                previousRole,
                newRole: role,
                reason
            },
            ...metadata
        });
        
        logger.info(`User ${id} role updated from ${previousRole} to ${role} by admin ${req.id}`);
        
        return res.status(200).json({
            message: "User role updated successfully",
            success: true,
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Error updating user role:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Block user (admin only)
export const blockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        
        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                message: "Block reason is required",
                success: false
            });
        }
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }
        
        if (user.isBlocked) {
            return res.status(400).json({
                message: "User is already blocked",
                success: false
            });
        }
        
        // Prevent blocking admins
        if (user.role === 'admin') {
            return res.status(403).json({
                message: "Cannot block admin users",
                success: false
            });
        }
        
        user.isBlocked = true;
        user.blockReason = reason;
        user.blockedBy = req.id;
        user.blockedAt = new Date();
        
        await user.save();
        
        // Log activity
        const metadata = getRequestMetadata(req);
        await logActivity({
            performedBy: req.id,
            action: 'user_blocked',
            targetType: 'User',
            targetId: user._id,
            targetName: user.fullname,
            details: { reason },
            ...metadata
        });
        
        logger.info(`User ${userId} blocked by admin ${req.id}. Reason: ${reason}`);
        
        return res.status(200).json({
            message: "User blocked successfully",
            success: true,
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                isBlocked: user.isBlocked,
                blockReason: user.blockReason
            }
        });
    } catch (error) {
        logger.error('Error blocking user:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Unblock user (admin only)
export const unblockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }
        
        if (!user.isBlocked) {
            return res.status(400).json({
                message: "User is not blocked",
                success: false
            });
        }
        
        user.isBlocked = false;
        user.blockReason = undefined;
        user.blockedBy = undefined;
        user.blockedAt = undefined;
        
        await user.save();
        
        // Log activity
        const metadata = getRequestMetadata(req);
        await logActivity({
            performedBy: req.id,
            action: 'user_unblocked',
            targetType: 'User',
            targetId: user._id,
            targetName: user.fullname,
            details: {},
            ...metadata
        });
        
        logger.info(`User ${userId} unblocked by admin ${req.id}`);
        
        return res.status(200).json({
            message: "User unblocked successfully",
            success: true,
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                isBlocked: user.isBlocked
            }
        });
    } catch (error) {
        logger.error('Error unblocking user:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get activity logs (admin only)
export const getActivityLogs = async (req, res) => {
    try {
        const { 
            action, 
            performedBy, 
            targetType,
            startDate, 
            endDate, 
            page = 1, 
            limit = 50 
        } = req.query;
        
        let query = {};
        
        if (action) {
            query.action = action;
        }
        
        if (performedBy) {
            query.performedBy = performedBy;
        }
        
        if (targetType) {
            query.targetType = targetType;
        }
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }
        
        const skip = (page - 1) * limit;
        
        const logs = await ActivityLog.find(query)
            .populate('performedBy', 'fullname email role')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        
        const total = await ActivityLog.countDocuments(query);
        
        return res.status(200).json({
            success: true,
            logs,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Error getting activity logs:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Bulk block users (admin only)
export const bulkBlockUsers = async (req, res) => {
    try {
        const { userIds, reason } = req.body;
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                message: "userIds array is required",
                success: false
            });
        }
        
        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                message: "Block reason is required",
                success: false
            });
        }
        
        // Prevent blocking admins
        const users = await User.find({ 
            _id: { $in: userIds },
            role: { $ne: 'admin' },
            isBlocked: false
        });
        
        const blockedCount = users.length;
        
        await User.updateMany(
            { _id: { $in: users.map(u => u._id) } },
            {
                $set: {
                    isBlocked: true,
                    blockReason: reason,
                    blockedBy: req.id,
                    blockedAt: new Date()
                }
            }
        );
        
        // Log activity
        const metadata = getRequestMetadata(req);
        await logActivity({
            performedBy: req.id,
            action: 'bulk_action_performed',
            targetType: 'User',
            targetId: req.id,
            targetName: 'Bulk Block',
            details: {
                action: 'block',
                count: blockedCount,
                reason,
                userIds: users.map(u => u._id)
            },
            ...metadata
        });
        
        logger.info(`Bulk blocked ${blockedCount} users by admin ${req.id}`);
        
        return res.status(200).json({
            message: `Successfully blocked ${blockedCount} users`,
            success: true,
            blockedCount
        });
    } catch (error) {
        logger.error('Error bulk blocking users:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Bulk unblock users (admin only)
export const bulkUnblockUsers = async (req, res) => {
    try {
        const { userIds } = req.body;
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                message: "userIds array is required",
                success: false
            });
        }
        
        const result = await User.updateMany(
            { 
                _id: { $in: userIds },
                isBlocked: true
            },
            {
                $set: { isBlocked: false },
                $unset: { blockReason: '', blockedBy: '', blockedAt: '' }
            }
        );
        
        // Log activity
        const metadata = getRequestMetadata(req);
        await logActivity({
            performedBy: req.id,
            action: 'bulk_action_performed',
            targetType: 'User',
            targetId: req.id,
            targetName: 'Bulk Unblock',
            details: {
                action: 'unblock',
                count: result.modifiedCount,
                userIds
            },
            ...metadata
        });
        
        logger.info(`Bulk unblocked ${result.modifiedCount} users by admin ${req.id}`);
        
        return res.status(200).json({
            message: `Successfully unblocked ${result.modifiedCount} users`,
            success: true,
            unblockedCount: result.modifiedCount
        });
    } catch (error) {
        logger.error('Error bulk unblocking users:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get company verification queue
export const getVerificationQueue = async (req, res) => {
    try {
        const { status = 'pending', page = 1, limit = 20 } = req.query;
        
        const validStatuses = ['pending', 'resubmitted', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status",
                success: false
            });
        }
        
        const skip = (page - 1) * limit;
        
        const companies = await Company.find({ 'verification.status': status })
            .populate('userId', 'fullname email phoneNumber')
            .populate('verification.verifiedBy', 'fullname email')
            .select('name website location industry companySize verification createdAt')
            .sort({ 'verification.submittedAt': -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Company.countDocuments({ 'verification.status': status });
        
        logger.info(`Verification queue fetched by admin ${req.id}: ${companies.length} companies with status ${status}`);
        
        return res.status(200).json({
            success: true,
            companies,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        logger.error('Error getting verification queue:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Approve company verification
export const approveCompanyVerification = async (req, res) => {
    try {
        const { id: companyId } = req.params;
        const adminId = req.id;
        
        const company = await Company.findById(companyId).populate('userId', 'fullname email');
        if (!company) {
            return res.status(404).json({
                message: "Company not found",
                success: false
            });
        }
        
        if (company.verification.status === 'approved') {
            return res.status(400).json({
                message: "Company is already verified",
                success: false
            });
        }
        
        // Update verification status
        company.verification.status = 'approved';
        company.verification.verifiedAt = new Date();
        company.verification.verifiedBy = adminId;
        company.verification.rejectionReason = undefined; // Clear any previous rejection reason
        
        await company.save();
        
        // Log activity
        const metadata = getRequestMetadata(req);
        await logActivity({
            userId: adminId,
            action: 'approve_company_verification',
            targetType: 'Company',
            targetId: companyId,
            changes: {
                companyName: company.name,
                previousStatus: 'pending',
                newStatus: 'approved'
            },
            ...metadata
        });
        
        // Send email notification to company owner
        try {
            await sendCompanyVerificationEmail(
                company.userId.email,
                company.userId.fullname,
                company.name,
                'approved'
            );
        } catch (emailError) {
            logger.error('Failed to send approval email:', emailError);
            // Don't fail the request if email fails
        }
        
        logger.info(`Company ${companyId} verified by admin ${adminId}`);
        
        return res.status(200).json({
            message: "Company verification approved successfully",
            company,
            success: true
        });
    } catch (error) {
        logger.error('Error approving company verification:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Reject company verification
export const rejectCompanyVerification = async (req, res) => {
    try {
        const { id: companyId } = req.params;
        const { reason } = req.body;
        const adminId = req.id;
        
        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                message: "Rejection reason is required",
                success: false
            });
        }
        
        const company = await Company.findById(companyId).populate('userId', 'fullname email');
        if (!company) {
            return res.status(404).json({
                message: "Company not found",
                success: false
            });
        }
        
        // Update verification status
        const previousStatus = company.verification.status;
        company.verification.status = 'rejected';
        company.verification.rejectionReason = reason;
        company.verification.verifiedBy = adminId;
        company.verification.verifiedAt = new Date();
        
        await company.save();
        
        // Log activity
        const metadata = getRequestMetadata(req);
        await logActivity({
            userId: adminId,
            action: 'reject_company_verification',
            targetType: 'Company',
            targetId: companyId,
            changes: {
                companyName: company.name,
                previousStatus,
                newStatus: 'rejected',
                rejectionReason: reason
            },
            ...metadata
        });
        
        // Send email notification to company owner
        try {
            await sendCompanyVerificationEmail(
                company.userId.email,
                company.userId.fullname,
                company.name,
                'rejected',
                reason
            );
        } catch (emailError) {
            logger.error('Failed to send rejection email:', emailError);
            // Don't fail the request if email fails
        }
        
        logger.info(`Company ${companyId} verification rejected by admin ${adminId}`);
        
        return res.status(200).json({
            message: "Company verification rejected",
            company,
            success: true
        });
    } catch (error) {
        logger.error('Error rejecting company verification:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get job moderation queue
export const getJobModerationQueue = async (req, res) => {
    try {
        const { status = 'pending', page = 1, limit = 20 } = req.query;
        
        const validStatuses = ['pending', 'approved', 'rejected', 'flagged'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status",
                success: false
            });
        }
        
        const skip = (page - 1) * limit;
        
        const jobs = await Job.find({ 'moderation.status': status })
            .populate('company', 'name logo verification')
            .populate('created_by', 'fullname email')
            .populate('moderation.reviewedBy', 'fullname email')
            .select('title description salary location jobType experienceLevel position moderation createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Job.countDocuments({ 'moderation.status': status });
        
        logger.info(`Job moderation queue fetched by admin ${req.id}: ${jobs.length} jobs with status ${status}`);
        
        return res.status(200).json({
            success: true,
            jobs,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        logger.error('Error getting job moderation queue:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Approve job
export const approveJob = async (req, res) => {
    try {
        const { id: jobId } = req.params;
        const adminId = req.id;
        
        const job = await Job.findById(jobId)
            .populate('company', 'name')
            .populate('created_by', 'fullname email');
            
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }
        
        if (job.moderation.status === 'approved') {
            return res.status(400).json({
                message: "Job is already approved",
                success: false
            });
        }
        
        // Update moderation status
        job.moderation.status = 'approved';
        job.moderation.reviewedBy = adminId;
        job.moderation.reviewedAt = new Date();
        job.moderation.rejectionReason = undefined;
        job.isActive = true;
        
        // Calculate quality score if not already done
        if (!job.moderation.qualityScore) {
            job.moderation.qualityScore = calculateQualityScore(job);
        }
        
        await job.save();
        
        // Log activity
        const metadata = getRequestMetadata(req);
        await logActivity({
            userId: adminId,
            action: 'approve_job',
            targetType: 'Job',
            targetId: jobId,
            changes: {
                jobTitle: job.title,
                company: job.company.name,
                previousStatus: 'pending',
                newStatus: 'approved'
            },
            ...metadata
        });
        
        logger.info(`Job ${jobId} approved by admin ${adminId}`);
        
        return res.status(200).json({
            message: "Job approved successfully",
            job,
            success: true
        });
    } catch (error) {
        logger.error('Error approving job:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Reject job
export const rejectJob = async (req, res) => {
    try {
        const { id: jobId } = req.params;
        const { reason } = req.body;
        const adminId = req.id;
        
        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                message: "Rejection reason is required",
                success: false
            });
        }
        
        const job = await Job.findById(jobId)
            .populate('company', 'name')
            .populate('created_by', 'fullname email');
            
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }
        
        // Update moderation status
        const previousStatus = job.moderation.status;
        job.moderation.status = 'rejected';
        job.moderation.reviewedBy = adminId;
        job.moderation.reviewedAt = new Date();
        job.moderation.rejectionReason = reason;
        job.isActive = false;
        
        await job.save();
        
        // Log activity
        const metadata = getRequestMetadata(req);
        await logActivity({
            userId: adminId,
            action: 'reject_job',
            targetType: 'Job',
            targetId: jobId,
            changes: {
                jobTitle: job.title,
                company: job.company.name,
                previousStatus,
                newStatus: 'rejected',
                rejectionReason: reason
            },
            ...metadata
        });
        
        logger.info(`Job ${jobId} rejected by admin ${adminId}`);
        
        return res.status(200).json({
            message: "Job rejected successfully",
            job,
            success: true
        });
    } catch (error) {
        logger.error('Error rejecting job:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Admin edit job
export const adminEditJob = async (req, res) => {
    try {
        const { id: jobId } = req.params;
        const adminId = req.id;
        const updates = req.body;
        
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }
        
        // Store old values for logging
        const oldValues = {
            title: job.title,
            description: job.description,
            salary: job.salary,
            location: job.location
        };
        
        // Allow admin to edit specific fields
        const allowedFields = ['title', 'description', 'requirements', 'salary', 'location', 'jobType', 'position', 'experienceLevel'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                job[field] = updates[field];
            }
        });
        
        // Recalculate quality and spam scores after edit
        job.moderation.qualityScore = calculateQualityScore(job);
        const { score: spamScore } = calculateSpamScore(job);
        job.moderation.spamScore = spamScore;
        
        await job.save();
        
        // Log activity
        const metadata = getRequestMetadata(req);
        await logActivity({
            userId: adminId,
            action: 'admin_edit_job',
            targetType: 'Job',
            targetId: jobId,
            changes: {
                jobTitle: job.title,
                oldValues,
                newValues: updates
            },
            ...metadata
        });
        
        logger.info(`Job ${jobId} edited by admin ${adminId}`);
        
        return res.status(200).json({
            message: "Job updated successfully",
            job,
            success: true
        });
    } catch (error) {
        logger.error('Error editing job:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};
