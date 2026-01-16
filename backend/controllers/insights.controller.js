import { Job } from '../models/job.model.js';
import { Application } from '../models/application.model.js';
import { Company } from '../models/company.model.js';
import { User } from '../models/user.model.js';
import logger from '../utils/logger.js';

/**
 * Get salary trends by location and skills
 * @route GET /api/v1/insights/salary-trends
 */
export const getSalaryTrends = async (req, res) => {
    try {
        const { location, skill, jobType, experience } = req.query;

        const match = { salary: { $exists: true, $ne: null } };
        if (location) match.location = new RegExp(location, 'i');
        if (jobType) match.jobType = jobType;
        if (experience) match.experienceLevel = experience;

        // Salary by location
        const salaryByLocation = await Job.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$location',
                    avgSalary: { $avg: '$salary' },
                    minSalary: { $min: '$salary' },
                    maxSalary: { $max: '$salary' },
                    jobCount: { $sum: 1 }
                }
            },
            { $sort: { avgSalary: -1 } },
            { $limit: 20 }
        ]);

        // Salary by skills (if skill filter provided)
        let salaryBySkill = [];
        if (skill) {
            const skillMatch = {
                ...match,
                requirements: { $regex: skill, $options: 'i' }
            };

            salaryBySkill = await Job.aggregate([
                { $match: skillMatch },
                { $unwind: '$requirements' },
                {
                    $match: {
                        requirements: { $regex: skill, $options: 'i' }
                    }
                },
                {
                    $group: {
                        _id: { $trim: { input: { $toLower: '$requirements' } } },
                        avgSalary: { $avg: '$salary' },
                        jobCount: { $sum: 1 }
                    }
                },
                { $sort: { avgSalary: -1 } },
                { $limit: 10 }
            ]);
        }

        // Salary by experience level
        const salaryByExperience = await Job.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$experienceLevel',
                    avgSalary: { $avg: '$salary' },
                    minSalary: { $min: '$salary' },
                    maxSalary: { $max: '$salary' },
                    jobCount: { $sum: 1 }
                }
            },
            { $sort: { avgSalary: -1 } }
        ]);

        // Salary by job type
        const salaryByJobType = await Job.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$jobType',
                    avgSalary: { $avg: '$salary' },
                    jobCount: { $sum: 1 }
                }
            },
            { $sort: { avgSalary: -1 } }
        ]);

        return res.status(200).json({
            message: "Salary trends retrieved successfully",
            trends: {
                byLocation: salaryByLocation.map(item => ({
                    location: item._id,
                    avgSalary: Math.round(item.avgSalary),
                    salaryRange: `${Math.round(item.minSalary)} - ${Math.round(item.maxSalary)}`,
                    jobCount: item.jobCount
                })),
                bySkill: salaryBySkill.map(item => ({
                    skill: item._id,
                    avgSalary: Math.round(item.avgSalary),
                    jobCount: item.jobCount
                })),
                byExperience: salaryByExperience.map(item => ({
                    level: item._id || 'Not Specified',
                    avgSalary: Math.round(item.avgSalary),
                    salaryRange: `${Math.round(item.minSalary)} - ${Math.round(item.maxSalary)}`,
                    jobCount: item.jobCount
                })),
                byJobType: salaryByJobType.map(item => ({
                    type: item._id,
                    avgSalary: Math.round(item.avgSalary),
                    jobCount: item.jobCount
                }))
            },
            success: true
        });

    } catch (error) {
        logger.error('Error in getSalaryTrends:', error);
        return res.status(500).json({
            message: 'Failed to get salary trends',
            success: false
        });
    }
};

/**
 * Get market demand analysis
 * @route GET /api/v1/insights/market-demand
 */
export const getMarketDemand = async (req, res) => {
    try {
        const { period = 30 } = req.query;
        const daysAgo = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

        // Jobs by industry/category
        const jobsByCategory = await Job.aggregate([
            {
                $match: {
                    createdAt: { $gte: daysAgo },
                    isActive: true
                }
            },
            {
                $group: {
                    _id: '$category',
                    jobCount: { $sum: 1 },
                    avgSalary: { $avg: '$salary' }
                }
            },
            { $sort: { jobCount: -1 } }
        ]);

        // Jobs by location
        const jobsByLocation = await Job.aggregate([
            {
                $match: {
                    createdAt: { $gte: daysAgo },
                    isActive: true
                }
            },
            {
                $group: {
                    _id: '$location',
                    jobCount: { $sum: 1 }
                }
            },
            { $sort: { jobCount: -1 } },
            { $limit: 15 }
        ]);

        // Top hiring companies
        const topHiringCompanies = await Job.aggregate([
            {
                $match: {
                    createdAt: { $gte: daysAgo },
                    isActive: true
                }
            },
            {
                $group: {
                    _id: '$company',
                    jobCount: { $sum: 1 }
                }
            },
            { $sort: { jobCount: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'companies',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'companyInfo'
                }
            },
            { $unwind: '$companyInfo' },
            {
                $project: {
                    companyName: '$companyInfo.name',
                    jobCount: 1,
                    location: '$companyInfo.location'
                }
            }
        ]);

        // Most in-demand skills
        const inDemandSkills = await Job.aggregate([
            {
                $match: {
                    createdAt: { $gte: daysAgo },
                    isActive: true
                }
            },
            { $unwind: '$requirements' },
            {
                $group: {
                    _id: { $trim: { input: { $toLower: '$requirements' } } },
                    demandCount: { $sum: 1 }
                }
            },
            { $sort: { demandCount: -1 } },
            { $limit: 20 }
        ]);

        // Growth rate (compare with previous period)
        const previousPeriodStart = new Date(daysAgo.getTime() - period * 24 * 60 * 60 * 1000);
        const currentPeriodCount = await Job.countDocuments({
            createdAt: { $gte: daysAgo }
        });
        const previousPeriodCount = await Job.countDocuments({
            createdAt: { $gte: previousPeriodStart, $lt: daysAgo }
        });

        const growthRate = previousPeriodCount > 0
            ? (((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100).toFixed(2)
            : 0;

        return res.status(200).json({
            message: "Market demand analysis retrieved successfully",
            analysis: {
                period: `Last ${period} days`,
                totalActiveJobs: await Job.countDocuments({ isActive: true }),
                newJobsPosted: currentPeriodCount,
                growthRate: `${growthRate}%`,
                byCategory: jobsByCategory.map(c => ({
                    category: c._id || 'Uncategorized',
                    jobCount: c.jobCount,
                    avgSalary: c.avgSalary ? Math.round(c.avgSalary) : null
                })),
                byLocation: jobsByLocation.map(l => ({
                    location: l._id,
                    jobCount: l.jobCount
                })),
                topHiringCompanies,
                inDemandSkills: inDemandSkills.map(s => ({
                    skill: s._id,
                    demandCount: s.demandCount
                }))
            },
            success: true
        });

    } catch (error) {
        logger.error('Error in getMarketDemand:', error);
        return res.status(500).json({
            message: 'Failed to get market demand analysis',
            success: false
        });
    }
};

/**
 * Get skill gap analysis
 * @route GET /api/v1/insights/skill-gap
 */
export const getSkillGapAnalysis = async (req, res) => {
    try {
        const { role, location } = req.query;

        const match = { isActive: true };
        if (role) match.title = new RegExp(role, 'i');
        if (location) match.location = new RegExp(location, 'i');

        // Most required skills in job postings
        const requiredSkills = await Job.aggregate([
            { $match: match },
            { $unwind: '$requirements' },
            {
                $group: {
                    _id: { $trim: { input: { $toLower: '$requirements' } } },
                    frequency: { $sum: 1 }
                }
            },
            { $sort: { frequency: -1 } },
            { $limit: 30 }
        ]);

        // Common skills among candidates
        const candidateSkills = await User.aggregate([
            {
                $match: { role: 'student' }
            },
            { $unwind: '$profile.skills' },
            {
                $group: {
                    _id: { $trim: { input: { $toLower: '$profile.skills' } } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 30 }
        ]);

        // Calculate skill gap (skills in demand but lacking in candidates)
        const requiredSkillsMap = new Map(requiredSkills.map(s => [s._id, s.frequency]));
        const candidateSkillsMap = new Map(candidateSkills.map(s => [s._id, s.count]));

        const skillGap = requiredSkills
            .map(skill => {
                const candidateCount = candidateSkillsMap.get(skill._id) || 0;
                const demandRatio = skill.frequency / (candidateCount || 1);
                
                return {
                    skill: skill._id,
                    jobDemand: skill.frequency,
                    candidateSupply: candidateCount,
                    gapRatio: demandRatio.toFixed(2),
                    status: demandRatio > 2 ? 'High Gap' : demandRatio > 1.2 ? 'Moderate Gap' : 'Balanced'
                };
            })
            .sort((a, b) => parseFloat(b.gapRatio) - parseFloat(a.gapRatio))
            .slice(0, 20);

        // Emerging skills (newly appearing in job postings)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const emergingSkills = await Job.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                    isActive: true
                }
            },
            { $unwind: '$requirements' },
            {
                $group: {
                    _id: { $trim: { input: { $toLower: '$requirements' } } },
                    recentCount: { $sum: 1 }
                }
            },
            { $sort: { recentCount: -1 } },
            { $limit: 15 }
        ]);

        return res.status(200).json({
            message: "Skill gap analysis retrieved successfully",
            analysis: {
                topRequiredSkills: requiredSkills.slice(0, 15).map(s => ({
                    skill: s._id,
                    frequency: s.frequency
                })),
                topCandidateSkills: candidateSkills.slice(0, 15).map(s => ({
                    skill: s._id,
                    count: s.count
                })),
                skillGap,
                emergingSkills: emergingSkills.map(s => ({
                    skill: s._id,
                    recentDemand: s.recentCount
                })),
                recommendations: skillGap.slice(0, 5).map(sg => ({
                    skill: sg.skill,
                    reason: `High demand (${sg.jobDemand} jobs) with limited supply (${sg.candidateSupply} candidates). ${sg.status}.`
                }))
            },
            success: true
        });

    } catch (error) {
        logger.error('Error in getSkillGapAnalysis:', error);
        return res.status(500).json({
            message: 'Failed to get skill gap analysis',
            success: false
        });
    }
};

/**
 * Get hiring trends
 * @route GET /api/v1/insights/hiring-trends
 */
export const getHiringTrends = async (req, res) => {
    try {
        const { period = '6months' } = req.query;

        let monthsBack = 6;
        if (period === '1year') monthsBack = 12;
        if (period === '3months') monthsBack = 3;

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - monthsBack);

        // Monthly hiring trends
        const monthlyTrends = await Job.aggregate([
            {
                $match: { createdAt: { $gte: startDate } }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    jobsPosted: { $sum: 1 },
                    avgSalary: { $avg: '$salary' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Seasonal patterns (quarter-wise)
        const seasonalTrends = await Job.aggregate([
            {
                $match: { createdAt: { $gte: startDate } }
            },
            {
                $project: {
                    quarter: {
                        $ceil: { $divide: [{ $month: '$createdAt' }, 3] }
                    },
                    year: { $year: '$createdAt' }
                }
            },
            {
                $group: {
                    _id: { year: '$year', quarter: '$quarter' },
                    jobCount: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.quarter': 1 } }
        ]);

        // Day of week patterns
        const dayOfWeekTrends = await Job.aggregate([
            {
                $match: { createdAt: { $gte: startDate } }
            },
            {
                $group: {
                    _id: { $dayOfWeek: '$createdAt' },
                    jobCount: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Application trends
        const applicationTrends = await Application.aggregate([
            {
                $match: { createdAt: { $gte: startDate } }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    applicationCount: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Remote vs onsite trends
        const jobTypeTrends = await Job.aggregate([
            {
                $match: { createdAt: { $gte: startDate } }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        jobType: '$jobType'
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        return res.status(200).json({
            message: "Hiring trends retrieved successfully",
            trends: {
                period: `Last ${monthsBack} months`,
                monthlyTrends: monthlyTrends.map(t => ({
                    period: `${t._id.year}-${String(t._id.month).padStart(2, '0')}`,
                    jobsPosted: t.jobsPosted,
                    avgSalary: t.avgSalary ? Math.round(t.avgSalary) : null
                })),
                seasonalTrends: seasonalTrends.map(t => ({
                    period: `Q${t._id.quarter} ${t._id.year}`,
                    jobCount: t.jobCount
                })),
                dayOfWeekTrends: dayOfWeekTrends.map(t => ({
                    day: dayNames[t._id - 1],
                    jobCount: t.jobCount
                })),
                applicationTrends: applicationTrends.map(t => ({
                    period: `${t._id.year}-${String(t._id.month).padStart(2, '0')}`,
                    applicationCount: t.applicationCount
                })),
                jobTypeTrends: jobTypeTrends.reduce((acc, t) => {
                    const period = `${t._id.year}-${String(t._id.month).padStart(2, '0')}`;
                    if (!acc[period]) acc[period] = {};
                    acc[period][t._id.jobType || 'other'] = t.count;
                    return acc;
                }, {})
            },
            success: true
        });

    } catch (error) {
        logger.error('Error in getHiringTrends:', error);
        return res.status(500).json({
            message: 'Failed to get hiring trends',
            success: false
        });
    }
};

/**
 * Get career path recommendations
 * @route GET /api/v1/insights/career-path
 */
export const getCareerPathRecommendations = async (req, res) => {
    try {
        const userId = req.id;
        const { targetRole } = req.query;

        // Get user's current profile
        const user = await User.findById(userId).select('profile');
        
        if (!user || !user.profile) {
            return res.status(404).json({
                message: 'User profile not found',
                success: false
            });
        }

        const currentSkills = user.profile.skills || [];
        const currentExperience = user.profile.experience || [];

        // Find similar successful profiles (users who got hired)
        const successfulProfiles = await Application.aggregate([
            {
                $match: { currentStage: 'hired' }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'applicant',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: '$userInfo' },
            {
                $lookup: {
                    from: 'jobs',
                    localField: 'job',
                    foreignField: '_id',
                    as: 'jobInfo'
                }
            },
            { $unwind: '$jobInfo' },
            {
                $project: {
                    jobTitle: '$jobInfo.title',
                    skills: '$userInfo.profile.skills',
                    experienceYears: {
                        $size: { $ifNull: ['$userInfo.profile.experience', []] }
                    }
                }
            },
            { $limit: 100 }
        ]);

        // Analyze common career paths
        const roleMatch = targetRole ? { title: new RegExp(targetRole, 'i') } : {};
        const targetJobs = await Job.find({
            ...roleMatch,
            isActive: true
        }).select('title requirements salary experienceLevel').limit(20);

        // Skills needed for target roles
        const skillsNeeded = new Set();
        targetJobs.forEach(job => {
            job.requirements.forEach(skill => skillsNeeded.add(skill.toLowerCase().trim()));
        });

        // Calculate skill gap for user
        const userSkillsSet = new Set(currentSkills.map(s => s.toLowerCase().trim()));
        const missingSkills = [...skillsNeeded].filter(skill => !userSkillsSet.has(skill));
        const matchingSkills = [...skillsNeeded].filter(skill => userSkillsSet.has(skill));

        // Career progression suggestions
        const suggestions = targetJobs.slice(0, 5).map(job => ({
            role: job.title,
            requiredSkills: job.requirements,
            salary: job.salary,
            experienceLevel: job.experienceLevel,
            skillMatch: ((matchingSkills.length / skillsNeeded.size) * 100).toFixed(0) + '%',
            skillsToLearn: job.requirements.filter(req => 
                !userSkillsSet.has(req.toLowerCase().trim())
            ).slice(0, 5)
        }));

        return res.status(200).json({
            message: "Career path recommendations retrieved successfully",
            recommendations: {
                currentProfile: {
                    skills: currentSkills,
                    experienceCount: currentExperience.length
                },
                targetRoles: suggestions,
                skillGap: {
                    currentSkills: matchingSkills,
                    missingSkills: missingSkills.slice(0, 10),
                    matchPercentage: ((matchingSkills.length / (skillsNeeded.size || 1)) * 100).toFixed(0) + '%'
                },
                learningPriority: missingSkills.slice(0, 5).map(skill => ({
                    skill,
                    reason: 'Required by multiple target roles',
                    importance: 'High'
                })),
                nextSteps: [
                    `Learn ${missingSkills.slice(0, 3).join(', ')} to increase your job match rate`,
                    `Apply to ${suggestions.length} relevant positions matching your profile`,
                    `Consider certifications in ${missingSkills[0] || 'your target domain'}`
                ]
            },
            success: true
        });

    } catch (error) {
        logger.error('Error in getCareerPathRecommendations:', error);
        return res.status(500).json({
            message: 'Failed to get career path recommendations',
            success: false
        });
    }
};

/**
 * Get company ratings and reviews summary
 * @route GET /api/v1/insights/company-reviews
 */
export const getCompanyReviewsSummary = async (req, res) => {
    try {
        const { companyId } = req.query;

        let match = {};
        if (companyId) match._id = companyId;

        // Company stats with application success rates
        const companyStats = await Company.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: 'jobs',
                    localField: '_id',
                    foreignField: 'company',
                    as: 'jobs'
                }
            },
            {
                $lookup: {
                    from: 'applications',
                    let: { companyId: '$_id' },
                    pipeline: [
                        {
                            $lookup: {
                                from: 'jobs',
                                localField: 'job',
                                foreignField: '_id',
                                as: 'jobInfo'
                            }
                        },
                        { $unwind: '$jobInfo' },
                        {
                            $match: {
                                $expr: { $eq: ['$jobInfo.company', '$$companyId'] }
                            }
                        }
                    ],
                    as: 'applications'
                }
            },
            {
                $project: {
                    name: 1,
                    location: 1,
                    description: 1,
                    website: 1,
                    totalJobs: { $size: '$jobs' },
                    activeJobs: {
                        $size: {
                            $filter: {
                                input: '$jobs',
                                as: 'job',
                                cond: { $eq: ['$$job.isActive', true] }
                            }
                        }
                    },
                    totalApplications: { $size: '$applications' },
                    hiredCount: {
                        $size: {
                            $filter: {
                                input: '$applications',
                                as: 'app',
                                cond: { $eq: ['$$app.currentStage', 'hired'] }
                            }
                        }
                    },
                    avgSalary: { $avg: '$jobs.salary' }
                }
            },
            { $sort: { totalJobs: -1 } },
            { $limit: companyId ? 1 : 20 }
        ]);

        // Calculate success rate
        const enrichedStats = companyStats.map(company => ({
            ...company,
            successRate: company.totalApplications > 0
                ? ((company.hiredCount / company.totalApplications) * 100).toFixed(2) + '%'
                : '0%',
            avgSalary: company.avgSalary ? Math.round(company.avgSalary) : null
        }));

        return res.status(200).json({
            message: "Company reviews summary retrieved successfully",
            companies: enrichedStats,
            success: true
        });

    } catch (error) {
        logger.error('Error in getCompanyReviewsSummary:', error);
        return res.status(500).json({
            message: 'Failed to get company reviews',
            success: false
        });
    }
};
