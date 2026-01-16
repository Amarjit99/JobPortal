import { User } from '../models/user.model.js';
import { Job } from '../models/job.model.js';
import { Application } from '../models/application.model.js';
import { Company } from '../models/company.model.js';
import { Payment } from '../models/payment.model.js';
import { Subscription } from '../models/subscription.model.js';
import { InterviewInvitation } from '../models/interviewInvitation.model.js';
import logger from '../utils/logger.js';
import { createObjectCsvStringifier } from 'csv-writer';
import PDFDocument from 'pdfkit';

// Get overall statistics
export const getOverallStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalStudents,
            totalRecruiters,
            totalJobs,
            activeJobs,
            totalApplications,
            totalCompanies
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'recruiter' }),
            Job.countDocuments(),
            Job.countDocuments({ isActive: true }),
            Application.countDocuments(),
            Company.countDocuments()
        ]);

        return res.status(200).json({
            stats: {
                totalUsers,
                totalStudents,
                totalRecruiters,
                totalJobs,
                activeJobs,
                totalApplications,
                totalCompanies
            },
            success: true
        });
    } catch (error) {
        logger.error('Error in getOverallStats:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Get application statistics by status
export const getApplicationStats = async (req, res) => {
    try {
        const stats = await Application.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = {
            pending: 0,
            accepted: 0,
            rejected: 0
        };

        stats.forEach(stat => {
            formattedStats[stat._id] = stat.count;
        });

        return res.status(200).json({
            stats: formattedStats,
            success: true
        });
    } catch (error) {
        logger.error('Error in getApplicationStats:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Get job trends (jobs posted per month for last 6 months)
export const getJobTrends = async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const trends = await Job.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        const formattedTrends = trends.map(trend => ({
            month: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
            count: trend.count
        }));

        return res.status(200).json({
            trends: formattedTrends,
            success: true
        });
    } catch (error) {
        logger.error('Error in getJobTrends:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Get application trends (applications per month for last 6 months)
export const getApplicationTrends = async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const trends = await Application.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        const formattedTrends = trends.map(trend => ({
            month: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
            count: trend.count
        }));

        return res.status(200).json({
            trends: formattedTrends,
            success: true
        });
    } catch (error) {
        logger.error('Error in getApplicationTrends:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Get popular companies (by job count)
export const getPopularCompanies = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const companies = await Job.aggregate([
            {
                $group: {
                    _id: '$company',
                    jobCount: { $sum: 1 },
                    applicationCount: { $sum: { $size: '$applications' } }
                }
            },
            {
                $sort: { jobCount: -1 }
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: 'companies',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'companyInfo'
                }
            },
            {
                $unwind: '$companyInfo'
            },
            {
                $project: {
                    _id: 1,
                    name: '$companyInfo.name',
                    logo: '$companyInfo.logo',
                    jobCount: 1,
                    applicationCount: 1
                }
            }
        ]);

        return res.status(200).json({
            companies,
            success: true
        });
    } catch (error) {
        logger.error('Error in getPopularCompanies:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Get popular skills (most requested in job requirements)
export const getPopularSkills = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const skills = await Job.aggregate([
            {
                $unwind: '$requirements'
            },
            {
                $group: {
                    _id: { $trim: { input: '$requirements' } },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: limit
            },
            {
                $project: {
                    _id: 0,
                    skill: '$_id',
                    count: 1
                }
            }
        ]);

        return res.status(200).json({
            skills,
            success: true
        });
    } catch (error) {
        logger.error('Error in getPopularSkills:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Get job type distribution
export const getJobTypeDistribution = async (req, res) => {
    try {
        const distribution = await Job.aggregate([
            {
                $group: {
                    _id: '$jobType',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        return res.status(200).json({
            distribution,
            success: true
        });
    } catch (error) {
        logger.error('Error in getJobTypeDistribution:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Get location-wise job distribution
export const getLocationDistribution = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const distribution = await Job.aggregate([
            {
                $group: {
                    _id: '$location',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: limit
            }
        ]);

        return res.status(200).json({
            distribution,
            success: true
        });
    } catch (error) {
        logger.error('Error in getLocationDistribution:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Get recent activities (last 10 applications)
export const getRecentActivities = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const activities = await Application.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('applicant', 'fullname email')
            .populate({
                path: 'job',
                select: 'title company',
                populate: {
                    path: 'company',
                    select: 'name'
                }
            });

        return res.status(200).json({
            activities,
            success: true
        });
    } catch (error) {
        logger.error('Error in getRecentActivities:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

/**
 * Get comprehensive job statistics
 * @route GET /api/v1/analytics/job-statistics
 */
export const getJobStatistics = async (req, res) => {
    try {
        const { startDate, endDate, companyId } = req.query;

        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);

        const match = {};
        if (Object.keys(dateFilter).length > 0) match.createdAt = dateFilter;
        if (companyId) match.company = companyId;

        // Job counts by status
        const jobsByStatus = await Job.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$isActive',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Applications per job (average)
        const applicationStats = await Job.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: 'applications',
                    localField: '_id',
                    foreignField: 'job',
                    as: 'jobApplications'
                }
            },
            {
                $project: {
                    applicationCount: { $size: '$jobApplications' }
                }
            },
            {
                $group: {
                    _id: null,
                    avgApplications: { $avg: '$applicationCount' },
                    totalApplications: { $sum: '$applicationCount' },
                    maxApplications: { $max: '$applicationCount' },
                    minApplications: { $min: '$applicationCount' }
                }
            }
        ]);

        // Conversion rate (applications to interviews)
        const conversionStats = await Application.aggregate([
            {
                $match: match.createdAt ? { createdAt: match.createdAt } : {}
            },
            {
                $group: {
                    _id: null,
                    totalApplications: { $sum: 1 },
                    interviewStage: {
                        $sum: {
                            $cond: [{ $in: ['$currentStage', ['interview', 'interview_confirmed']] }, 1, 0]
                        }
                    },
                    hiredCount: {
                        $sum: {
                            $cond: [{ $eq: ['$currentStage', 'hired'] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const stats = conversionStats[0] || { totalApplications: 0, interviewStage: 0, hiredCount: 0 };
        
        return res.status(200).json({
            message: "Job statistics retrieved successfully",
            statistics: {
                jobCounts: {
                    active: jobsByStatus.find(s => s._id === true)?.count || 0,
                    inactive: jobsByStatus.find(s => s._id === false)?.count || 0,
                    total: jobsByStatus.reduce((sum, s) => sum + s.count, 0)
                },
                applications: applicationStats[0] || {
                    avgApplications: 0,
                    totalApplications: 0,
                    maxApplications: 0,
                    minApplications: 0
                },
                conversionRates: {
                    applicationToInterview: stats.totalApplications > 0 
                        ? ((stats.interviewStage / stats.totalApplications) * 100).toFixed(2) + '%'
                        : '0%',
                    applicationToHire: stats.totalApplications > 0
                        ? ((stats.hiredCount / stats.totalApplications) * 100).toFixed(2) + '%'
                        : '0%',
                    interviewToHire: stats.interviewStage > 0
                        ? ((stats.hiredCount / stats.interviewStage) * 100).toFixed(2) + '%'
                        : '0%'
                }
            },
            success: true
        });

    } catch (error) {
        logger.error('Error in getJobStatistics:', error);
        return res.status(500).json({
            message: 'Failed to get job statistics',
            success: false
        });
    }
};

/**
 * Get candidate analytics
 * @route GET /api/v1/analytics/candidate-analytics
 */
export const getCandidateAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);

        // Application success rate by stage
        const stageDistribution = await Application.aggregate([
            {
                $match: dateFilter.createdAt ? { createdAt: dateFilter } : {}
            },
            {
                $group: {
                    _id: '$currentStage',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Interview conversion rate
        const interviewStats = await InterviewInvitation.aggregate([
            {
                $match: dateFilter.createdAt ? { createdAt: dateFilter } : {}
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Average time to hire
        const timeToHire = await Application.aggregate([
            {
                $match: {
                    currentStage: 'hired',
                    ...(dateFilter.createdAt && { createdAt: dateFilter })
                }
            },
            {
                $project: {
                    daysToHire: {
                        $divide: [
                            { $subtract: ['$updatedAt', '$createdAt'] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avgDaysToHire: { $avg: '$daysToHire' },
                    minDaysToHire: { $min: '$daysToHire' },
                    maxDaysToHire: { $max: '$daysToHire' }
                }
            }
        ]);

        // Top candidates by application success
        const topCandidates = await Application.aggregate([
            {
                $match: {
                    currentStage: { $in: ['interview', 'interview_confirmed', 'offer', 'hired'] },
                    ...(dateFilter.createdAt && { createdAt: dateFilter })
                }
            },
            {
                $group: {
                    _id: '$applicant',
                    successfulApplications: { $sum: 1 },
                    hiredCount: {
                        $sum: { $cond: [{ $eq: ['$currentStage', 'hired'] }, 1, 0] }
                    }
                }
            },
            { $sort: { successfulApplications: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'candidateInfo'
                }
            },
            { $unwind: '$candidateInfo' },
            {
                $project: {
                    name: '$candidateInfo.fullname',
                    email: '$candidateInfo.email',
                    successfulApplications: 1,
                    hiredCount: 1
                }
            }
        ]);

        return res.status(200).json({
            message: "Candidate analytics retrieved successfully",
            analytics: {
                stageDistribution,
                interviewConversion: {
                    total: interviewStats.reduce((sum, s) => sum + s.count, 0),
                    byStatus: interviewStats,
                    acceptanceRate: calculateRate(
                        interviewStats.find(s => s._id === 'accepted')?.count || 0,
                        interviewStats.reduce((sum, s) => sum + s.count, 0)
                    )
                },
                timeToHire: timeToHire[0] || {
                    avgDaysToHire: 0,
                    minDaysToHire: 0,
                    maxDaysToHire: 0
                },
                topCandidates
            },
            success: true
        });

    } catch (error) {
        logger.error('Error in getCandidateAnalytics:', error);
        return res.status(500).json({
            message: 'Failed to get candidate analytics',
            success: false
        });
    }
};

/**
 * Get revenue analytics
 * @route GET /api/v1/analytics/revenue-analytics
 */
export const getRevenueAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);

        // Total revenue by payment status
        const revenueByStatus = await Payment.aggregate([
            {
                $match: dateFilter.$gte ? { createdAt: dateFilter } : {}
            },
            {
                $group: {
                    _id: '$status',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Revenue trends (monthly)
        const revenueTrends = await Payment.aggregate([
            {
                $match: {
                    status: 'completed',
                    ...(dateFilter.$gte && { createdAt: dateFilter })
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Subscription statistics
        const subscriptionStats = await Subscription.aggregate([
            {
                $match: dateFilter.$gte ? { createdAt: dateFilter } : {}
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Revenue by plan type
        const revenueByPlan = await Payment.aggregate([
            {
                $match: {
                    status: 'completed',
                    ...(dateFilter.$gte && { createdAt: dateFilter })
                }
            },
            {
                $lookup: {
                    from: 'subscriptions',
                    localField: 'subscription',
                    foreignField: '_id',
                    as: 'subscriptionInfo'
                }
            },
            { $unwind: { path: '$subscriptionInfo', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'employerplans',
                    localField: 'subscriptionInfo.plan',
                    foreignField: '_id',
                    as: 'planInfo'
                }
            },
            { $unwind: { path: '$planInfo', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$planInfo.name',
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        const totalRevenue = revenueByStatus
            .find(r => r._id === 'completed')?.totalAmount || 0;

        return res.status(200).json({
            message: "Revenue analytics retrieved successfully",
            analytics: {
                summary: {
                    totalRevenue,
                    completedPayments: revenueByStatus.find(r => r._id === 'completed')?.count || 0,
                    pendingRevenue: revenueByStatus.find(r => r._id === 'pending')?.totalAmount || 0
                },
                revenueByStatus,
                trends: revenueTrends.map(t => ({
                    month: `${t._id.year}-${String(t._id.month).padStart(2, '0')}`,
                    revenue: t.revenue,
                    count: t.count
                })),
                subscriptions: {
                    byStatus: subscriptionStats,
                    total: subscriptionStats.reduce((sum, s) => sum + s.count, 0)
                },
                byPlan: revenueByPlan
            },
            success: true
        });

    } catch (error) {
        logger.error('Error in getRevenueAnalytics:', error);
        return res.status(500).json({
            message: 'Failed to get revenue analytics',
            success: false
        });
    }
};

/**
 * Get system metrics
 * @route GET /api/v1/analytics/system-metrics
 */
export const getSystemMetrics = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Active users (logged in last 30 days)
        const activeUsers = await User.countDocuments({
            lastLogin: { $gte: thirtyDaysAgo }
        });

        // New users (last 30 days)
        const newUsers = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        // Active jobs
        const activeJobs = await Job.countDocuments({
            isActive: true,
            isDraft: false
        });

        // Jobs posted (last 30 days)
        const recentJobs = await Job.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        // Recent applications (last 30 days)
        const recentApplications = await Application.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        // User growth trend
        const userGrowth = await User.aggregate([
            {
                $match: { createdAt: { $gte: thirtyDaysAgo } }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // System health indicators
        const healthMetrics = {
            jobPostingRate: recentJobs / 30, // avg per day
            applicationRate: recentApplications / 30,
            userGrowthRate: newUsers / 30,
            activeUserPercentage: await User.countDocuments().then(total => 
                total > 0 ? ((activeUsers / total) * 100).toFixed(2) + '%' : '0%'
            )
        };

        return res.status(200).json({
            message: "System metrics retrieved successfully",
            metrics: {
                users: {
                    active: activeUsers,
                    new: newUsers,
                    total: await User.countDocuments()
                },
                jobs: {
                    active: activeJobs,
                    recent: recentJobs,
                    total: await Job.countDocuments()
                },
                applications: {
                    recent: recentApplications,
                    total: await Application.countDocuments()
                },
                growth: userGrowth,
                health: healthMetrics
            },
            success: true
        });

    } catch (error) {
        logger.error('Error in getSystemMetrics:', error);
        return res.status(500).json({
            message: 'Failed to get system metrics',
            success: false
        });
    }
};

/**
 * Export analytics to CSV
 * @route GET /api/v1/analytics/export/csv
 */
export const exportToCSV = async (req, res) => {
    try {
        const { type = 'jobs' } = req.query;

        let data = [];
        let headers = [];

        if (type === 'jobs') {
            const jobs = await Job.find()
                .populate('company', 'name')
                .select('title location salary jobType createdAt isActive')
                .lean();

            headers = [
                { id: 'title', title: 'Job Title' },
                { id: 'company', title: 'Company' },
                { id: 'location', title: 'Location' },
                { id: 'salary', title: 'Salary' },
                { id: 'jobType', title: 'Job Type' },
                { id: 'createdAt', title: 'Posted Date' },
                { id: 'isActive', title: 'Status' }
            ];

            data = jobs.map(job => ({
                title: job.title,
                company: job.company?.name || 'N/A',
                location: job.location,
                salary: job.salary,
                jobType: job.jobType,
                createdAt: job.createdAt.toISOString().split('T')[0],
                isActive: job.isActive ? 'Active' : 'Inactive'
            }));
        } else if (type === 'applications') {
            const applications = await Application.find()
                .populate('applicant', 'fullname email')
                .populate('job', 'title')
                .select('currentStage createdAt')
                .lean();

            headers = [
                { id: 'applicant', title: 'Applicant' },
                { id: 'email', title: 'Email' },
                { id: 'job', title: 'Job' },
                { id: 'status', title: 'Status' },
                { id: 'appliedDate', title: 'Applied Date' }
            ];

            data = applications.map(app => ({
                applicant: app.applicant?.fullname || 'N/A',
                email: app.applicant?.email || 'N/A',
                job: app.job?.title || 'N/A',
                status: app.currentStage,
                appliedDate: app.createdAt.toISOString().split('T')[0]
            }));
        }

        const csvStringifier = createObjectCsvStringifier({ header: headers });
        const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(data);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}-analytics-${Date.now()}.csv`);
        
        return res.status(200).send(csvData);

    } catch (error) {
        logger.error('Error exporting to CSV:', error);
        return res.status(500).json({
            message: 'Failed to export analytics',
            success: false
        });
    }
};

// Helper function to calculate percentage rate
const calculateRate = (numerator, denominator) => {
    return denominator > 0 ? ((numerator / denominator) * 100).toFixed(2) + '%' : '0%';
};
