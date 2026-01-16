import { Job } from '../models/job.model.js';
import { Application } from '../models/application.model.js';
import { Company } from '../models/company.model.js';
import logger from '../utils/logger.js';

// Get recruiter-specific statistics
export const getRecruiterStats = async (req, res) => {
    try {
        const userId = req.id;

        // Get recruiter's companies
        const companies = await Company.find({ userId });
        const companyIds = companies.map(c => c._id);

        // Get jobs posted by recruiter
        const jobs = await Job.find({ company: { $in: companyIds } });
        const jobIds = jobs.map(j => j._id);

        // Get applications for recruiter's jobs
        const applications = await Application.find({ job: { $in: jobIds } });

        // Calculate statistics
        const totalCompanies = companies.length;
        const totalJobs = jobs.length;
        const activeJobs = jobs.filter(j => j.isActive).length;
        const totalApplications = applications.length;

        // Application status breakdown
        const pendingApplications = applications.filter(a => a.status === 'pending').length;
        const acceptedApplications = applications.filter(a => a.status === 'accepted').length;
        const rejectedApplications = applications.filter(a => a.status === 'rejected').length;

        // Job types breakdown
        const jobTypeDistribution = jobs.reduce((acc, job) => {
            acc[job.jobType] = (acc[job.jobType] || 0) + 1;
            return acc;
        }, {});

        // Most applied jobs (top 5)
        const jobApplicationCounts = {};
        applications.forEach(app => {
            const jobId = app.job.toString();
            jobApplicationCounts[jobId] = (jobApplicationCounts[jobId] || 0) + 1;
        });

        const mostAppliedJobs = await Promise.all(
            Object.entries(jobApplicationCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(async ([jobId, count]) => {
                    const job = await Job.findById(jobId).populate('company', 'name');
                    return {
                        jobTitle: job?.title,
                        company: job?.company?.name,
                        applications: count
                    };
                })
        );

        // Recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newJobsThisMonth = jobs.filter(j => j.createdAt >= thirtyDaysAgo).length;
        const newApplicationsThisMonth = applications.filter(a => a.createdAt >= thirtyDaysAgo).length;

        return res.status(200).json({
            success: true,
            stats: {
                overview: {
                    totalCompanies,
                    totalJobs,
                    activeJobs,
                    totalApplications,
                    newJobsThisMonth,
                    newApplicationsThisMonth
                },
                applicationBreakdown: {
                    pending: pendingApplications,
                    accepted: acceptedApplications,
                    rejected: rejectedApplications,
                    total: totalApplications
                },
                jobTypeDistribution,
                mostAppliedJobs
            }
        });
    } catch (error) {
        logger.error('Error in getRecruiterStats:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Get recruiter's job trends (last 7 months)
export const getRecruiterJobTrends = async (req, res) => {
    try {
        const userId = req.id;

        const companies = await Company.find({ userId }).select('_id');
        const companyIds = companies.map(c => c._id);

        const sevenMonthsAgo = new Date();
        sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

        const jobs = await Job.find({
            company: { $in: companyIds },
            createdAt: { $gte: sevenMonthsAgo }
        });

        const monthlyData = {};
        jobs.forEach(job => {
            const month = job.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
            monthlyData[month] = (monthlyData[month] || 0) + 1;
        });

        const trends = Object.entries(monthlyData).map(([month, count]) => ({
            month,
            jobs: count
        }));

        return res.status(200).json({
            success: true,
            trends
        });
    } catch (error) {
        logger.error('Error in getRecruiterJobTrends:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Get recruiter's application trends (last 7 months)
export const getRecruiterApplicationTrends = async (req, res) => {
    try {
        const userId = req.id;

        const companies = await Company.find({ userId }).select('_id');
        const companyIds = companies.map(c => c._id);

        const jobs = await Job.find({ company: { $in: companyIds } }).select('_id');
        const jobIds = jobs.map(j => j._id);

        const sevenMonthsAgo = new Date();
        sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

        const applications = await Application.find({
            job: { $in: jobIds },
            createdAt: { $gte: sevenMonthsAgo }
        });

        const monthlyData = {};
        applications.forEach(app => {
            const month = app.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
            monthlyData[month] = (monthlyData[month] || 0) + 1;
        });

        const trends = Object.entries(monthlyData).map(([month, count]) => ({
            month,
            applications: count
        }));

        return res.status(200).json({
            success: true,
            trends
        });
    } catch (error) {
        logger.error('Error in getRecruiterApplicationTrends:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Get recruiter's company performance
export const getRecruiterCompanyPerformance = async (req, res) => {
    try {
        const userId = req.id;

        const companies = await Company.find({ userId });

        const companyPerformance = await Promise.all(
            companies.map(async (company) => {
                const jobs = await Job.find({ company: company._id });
                const jobIds = jobs.map(j => j._id);
                const applications = await Application.find({ job: { $in: jobIds } });

                return {
                    companyName: company.name,
                    totalJobs: jobs.length,
                    activeJobs: jobs.filter(j => j.isActive).length,
                    totalApplications: applications.length,
                    acceptedApplications: applications.filter(a => a.status === 'accepted').length
                };
            })
        );

        return res.status(200).json({
            success: true,
            companies: companyPerformance
        });
    } catch (error) {
        logger.error('Error in getRecruiterCompanyPerformance:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Get recruiter's top performing jobs
export const getRecruiterTopJobs = async (req, res) => {
    try {
        const userId = req.id;
        const limit = parseInt(req.query.limit) || 5;

        const companies = await Company.find({ userId }).select('_id');
        const companyIds = companies.map(c => c._id);

        const jobs = await Job.find({ company: { $in: companyIds } })
            .populate('company', 'name')
            .limit(50);

        const jobsWithStats = await Promise.all(
            jobs.map(async (job) => {
                const applications = await Application.find({ job: job._id });
                return {
                    jobId: job._id,
                    title: job.title,
                    company: job.company.name,
                    location: job.location,
                    totalApplications: applications.length,
                    acceptedApplications: applications.filter(a => a.status === 'accepted').length,
                    salary: job.salary
                };
            })
        );

        const topJobs = jobsWithStats
            .sort((a, b) => b.totalApplications - a.totalApplications)
            .slice(0, limit);

        return res.status(200).json({
            success: true,
            jobs: topJobs
        });
    } catch (error) {
        logger.error('Error in getRecruiterTopJobs:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};
