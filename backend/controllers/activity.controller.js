import { Activity } from "../models/activity.model.js";
import { User } from "../models/user.model.js";
import { Company } from "../models/company.model.js";
import logger from "../utils/logger.js";

/**
 * Get my activity feed/timeline
 * @route GET /api/v1/activity/my-activity
 */
export const getMyActivity = async (req, res) => {
    try {
        const userId = req.id;
        const {
            page = 1,
            limit = 50,
            types,
            groupBy = 'date', // date, type, none
            startDate,
            endDate
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Parse types filter
        const typeFilter = types ? types.split(',') : [];

        const result = await Activity.getTimeline(userId, {
            limit: parseInt(limit),
            skip,
            types: typeFilter,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        });

        // Get activity stats
        const stats = await Activity.getUserStats(
            userId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined
        );

        return res.status(200).json({
            message: "Activity timeline retrieved successfully",
            activities: groupBy === 'date' ? result.grouped : result.activities,
            pagination: {
                total: result.total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(result.total / parseInt(limit)),
                hasMore: result.hasMore
            },
            stats,
            success: true
        });

    } catch (error) {
        logger.error('Error getting activity timeline:', error);
        return res.status(500).json({
            message: "Failed to get activity timeline",
            success: false
        });
    }
};

/**
 * Get company activity (for recruiters)
 * @route GET /api/v1/activity/company/:companyId
 */
export const getCompanyActivity = async (req, res) => {
    try {
        const { companyId } = req.params;
        const userId = req.id;
        const { startDate, endDate, limit = 100 } = req.query;

        // Verify user is recruiter for this company
        const user = await User.findById(userId).select('role company');
        
        if (user.role !== 'recruiter' || user.company?.toString() !== companyId) {
            if (user.role !== 'admin' && user.role !== 'sub-admin') {
                return res.status(403).json({
                    message: "You don't have permission to view this company's activity",
                    success: false
                });
            }
        }

        const activities = await Activity.getCompanyActivity(
            companyId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined
        );

        // Group by date
        const groupedByDate = activities.reduce((acc, activity) => {
            const date = new Date(activity.createdAt).toDateString();
            if (!acc[date]) {
                acc[date] = {
                    date,
                    count: 0,
                    activities: []
                };
            }
            acc[date].count++;
            acc[date].activities.push(activity);
            return acc;
        }, {});

        // Get activity type distribution
        const byType = activities.reduce((acc, activity) => {
            acc[activity.type] = (acc[activity.type] || 0) + 1;
            return acc;
        }, {});

        return res.status(200).json({
            message: "Company activity retrieved successfully",
            activities: Object.values(groupedByDate),
            stats: {
                total: activities.length,
                byType,
                dateRange: {
                    start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    end: endDate || new Date()
                }
            },
            success: true
        });

    } catch (error) {
        logger.error('Error getting company activity:', error);
        return res.status(500).json({
            message: "Failed to get company activity",
            success: false
        });
    }
};

/**
 * Get user activity (for admins)
 * @route GET /api/v1/activity/user/:targetUserId
 */
export const getUserActivity = async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const {
            page = 1,
            limit = 50,
            startDate,
            endDate
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const match = {
            user: targetUserId,
            createdAt: {}
        };

        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) match.createdAt.$lte = new Date(endDate);

        if (Object.keys(match.createdAt).length === 0) {
            delete match.createdAt;
        }

        const activities = await Activity.find(match)
            .populate('relatedJob', 'title company')
            .populate('relatedCompany', 'name logo')
            .populate('relatedApplication', 'status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Activity.countDocuments(match);

        // Get user stats
        const stats = await Activity.getUserStats(
            targetUserId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined
        );

        return res.status(200).json({
            message: "User activity retrieved successfully",
            activities,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            },
            stats,
            success: true
        });

    } catch (error) {
        logger.error('Error getting user activity:', error);
        return res.status(500).json({
            message: "Failed to get user activity",
            success: false
        });
    }
};

/**
 * Get activity statistics
 * @route GET /api/v1/activity/stats
 */
export const getActivityStats = async (req, res) => {
    try {
        const userId = req.id;
        const { period = '30d' } = req.query;

        // Calculate date range
        let startDate;
        if (period === '7d') {
            startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        } else if (period === '30d') {
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        } else if (period === '90d') {
            startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        } else if (period === 'year') {
            startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        }

        const stats = await Activity.getUserStats(userId, startDate);

        // Get daily activity count
        const dailyActivity = await Activity.aggregate([
            {
                $match: {
                    user: mongoose.Types.ObjectId(userId),
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return res.status(200).json({
            message: "Activity statistics retrieved successfully",
            stats,
            dailyActivity,
            period,
            success: true
        });

    } catch (error) {
        logger.error('Error getting activity stats:', error);
        return res.status(500).json({
            message: "Failed to get activity statistics",
            success: false
        });
    }
};

/**
 * Log a new activity (internal use by other controllers)
 * Can also be used as webhook endpoint
 * @route POST /api/v1/activity/log
 */
export const logActivity = async (req, res) => {
    try {
        const {
            type,
            description,
            relatedJob,
            relatedApplication,
            relatedCompany,
            relatedUser,
            relatedInterview,
            relatedAssessment,
            metadata,
            isPublic = true
        } = req.body;

        if (!type || !description) {
            return res.status(400).json({
                message: "Type and description are required",
                success: false
            });
        }

        const activityData = {
            user: req.id,
            type,
            description,
            relatedJob,
            relatedApplication,
            relatedCompany,
            relatedUser,
            relatedInterview,
            relatedAssessment,
            metadata,
            isPublic,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        };

        const activity = await Activity.logActivity(activityData);

        return res.status(201).json({
            message: "Activity logged successfully",
            activity,
            success: true
        });

    } catch (error) {
        logger.error('Error logging activity:', error);
        return res.status(500).json({
            message: "Failed to log activity",
            success: false
        });
    }
};

/**
 * Delete old activities (cleanup)
 * @route DELETE /api/v1/activity/cleanup
 */
export const cleanupOldActivities = async (req, res) => {
    try {
        const userId = req.id;
        const { daysOld = 90 } = req.body;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

        const result = await Activity.deleteMany({
            user: userId,
            createdAt: { $lte: cutoffDate }
        });

        logger.info(`User ${userId} cleaned up ${result.deletedCount} old activities`);

        return res.status(200).json({
            message: `Deleted ${result.deletedCount} old activities`,
            deletedCount: result.deletedCount,
            success: true
        });

    } catch (error) {
        logger.error('Error cleaning up activities:', error);
        return res.status(500).json({
            message: "Failed to cleanup activities",
            success: false
        });
    }
};

export default {
    getMyActivity,
    getCompanyActivity,
    getUserActivity,
    getActivityStats,
    logActivity,
    cleanupOldActivities
};
