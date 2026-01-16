import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { Company } from "../models/company.model.js";
import { SearchHistory } from "../models/searchHistory.model.js";
import { UserAssessment } from "../models/userAssessment.model.js";
import logger from "../utils/logger.js";
import { cacheHelper, cacheKeys, TTL } from "../utils/redis.js";
import { emitToMultipleUsers, NOTIFICATION_TYPES } from "../utils/socket.js";
import { calculateSpamScore, checkDuplicateJob } from "../utils/spamDetection.js";
import { buildSearchQuery, calculateRelevanceScore, recordSearchHistory } from "../utils/searchUtils.js";
import { calculateMatchScore, calculateBatchMatchScores } from "../utils/matchingUtils.js";
import { getJobRecommendations } from "../utils/recommendationUtils.js";

// admin post krega job
export const postJob = async (req, res) => {
    try {
        const { title, description, requirements, salary, location, jobType, experience, position, companyId, screeningQuestions, isDraft } = req.body;
        const userId = req.id;

        if (!title || !description || !requirements || !salary || !location || !jobType || !experience || !position || !companyId) {
            return res.status(400).json({
                message: "Somethin is missing.",
                success: false
            })
        };

        // Fetch company to check verification status
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                message: "Company not found",
                success: false
            });
        }

        // Check for duplicate jobs
        const existingJobs = await Job.find({
            company: companyId,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        });

        const duplicateCheck = checkDuplicateJob(
            { title, description, location, salary },
            existingJobs
        );

        if (duplicateCheck.isDuplicate) {
            logger.warn(`Duplicate job detected: ${title} (${duplicateCheck.similarity}% similar)`);
        }

        // Calculate spam score
        const spamAnalysis = calculateSpamScore({
            title,
            description,
            requirements: requirements.split(","),
            salary
        });

        logger.info(`Spam score for job "${title}": ${spamAnalysis.score} (${spamAnalysis.riskLevel})`);

        // Prepare moderation object
        const moderation = {
            spamScore: spamAnalysis.score
        };

        // Auto-approve for verified companies (low spam score)
        const isVerifiedCompany = company.verification?.status === 'approved';
        if (isVerifiedCompany && spamAnalysis.score < 40) {
            moderation.status = 'approved';
            moderation.autoApproved = true;
            moderation.reviewedAt = new Date();
        } else {
            moderation.status = 'pending';
            moderation.autoApproved = false;
        }

        // Auto-reject if spam score is very high
        if (spamAnalysis.score >= 80) {
            moderation.status = 'rejected';
            moderation.rejectionReason = `Auto-rejected: High spam score (${spamAnalysis.score}). Indicators: ${spamAnalysis.indicators.join('; ')}`;
        }

        const job = await Job.create({
            title,
            description,
            requirements: requirements.split(","),
            salary: Number(salary),
            location,
            jobType,
            experienceLevel: experience,
            position,
            company: companyId,
            created_by: userId,
            screeningQuestions: screeningQuestions || [],
            isDraft: isDraft || false,
            moderation
        });
        
        // Invalidate job listing caches
        await cacheHelper.delPattern('jobs:all:*');
        await cacheHelper.delPattern(`companies:user:${userId}`);

        // Notify users with matching job alerts
        try {
            const usersWithAlerts = await User.find({
                'jobAlertPreferences.enabled': true,
                $or: [
                    { 'jobAlertPreferences.jobTypes': jobType },
                    { 'jobAlertPreferences.locations': location }
                ]
            });

            const userIds = usersWithAlerts
                .filter(user => {
                    const prefs = user.jobAlertPreferences;
                    if (!prefs.enabled) return false;
                    
                    const matchesType = prefs.jobTypes.length === 0 || prefs.jobTypes.includes(jobType);
                    const matchesLocation = prefs.locations.length === 0 || prefs.locations.includes(location);
                    const matchesSalary = salary >= (prefs.minSalary || 0) && 
                                         (prefs.maxSalary === 0 || salary <= prefs.maxSalary);
                    
                    return matchesType && matchesLocation && matchesSalary;
                })
                .map(user => user._id.toString());

            if (userIds.length > 0) {
                emitToMultipleUsers(userIds, NOTIFICATION_TYPES.NEW_JOB, {
                    jobId: job._id,
                    title: job.title,
                    company: companyId,
                    location: job.location,
                    jobType: job.jobType,
                    salary: job.salary,
                    timestamp: new Date()
                });
            }
        } catch (notificationError) {
            logger.error('Error sending job notifications:', notificationError);
        }
        
        return res.status(201).json({
            message: "New job created successfully.",
            job,
            success: true
        });
    } catch (error) {
        logger.error('Error in postJob:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
// student k liye
export const getAllJobs = async (req, res) => {
    try {
        const keyword = req.query.keyword || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Advanced filter parameters
        const location = req.query.location;
        const jobType = req.query.jobType;
        const companyId = req.query.company; // New: Company filter
        const freshness = req.query.freshness; // New: Freshness filter (24h, 7d, 30d)
        const minExperience = req.query.minExperience ? parseInt(req.query.minExperience) : undefined;
        const maxExperience = req.query.maxExperience ? parseInt(req.query.maxExperience) : undefined;
        const minSalary = req.query.minSalary ? parseInt(req.query.minSalary) : undefined;
        const maxSalary = req.query.maxSalary ? parseInt(req.query.maxSalary) : undefined;

        // Check cache first
        const cacheKey = cacheKeys.allJobs(req.query);
        const cachedData = await cacheHelper.get(cacheKey);
        if (cachedData) {
            logger.info('Serving jobs from cache');
            return res.status(200).json(cachedData);
        }

        const query = {
            $and: [
                {
                    $or: [
                        { title: { $regex: keyword, $options: "i" } },
                        { description: { $regex: keyword, $options: "i" } },
                    ]
                },
                { isActive: true }, // Only active jobs
                { isDraft: false }, // Exclude drafts
                { 'moderation.status': 'approved' }, // Only approved jobs
                { $or: [
                    { expiresAt: { $gt: new Date() } }, // Not expired
                    { expiresAt: null } // No expiry set
                ]}
            ]
        };

        // Add location filter
        if (location) {
            query.$and.push({ location: { $regex: location, $options: "i" } });
        }

        // Add job type filter
        if (jobType) {
            query.$and.push({ jobType: { $regex: jobType, $options: "i" } });
        }

        // Add company filter
        if (companyId) {
            query.$and.push({ company: companyId });
        }

        // Add freshness filter
        if (freshness) {
            const now = new Date();
            let cutoffDate;
            
            switch(freshness) {
                case '24h':
                    cutoffDate = new Date(now - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    cutoffDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    cutoffDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    cutoffDate = null;
            }
            
            if (cutoffDate) {
                query.$and.push({ createdAt: { $gte: cutoffDate } });
            }
        }

        // Add experience level filter
        if (minExperience !== undefined || maxExperience !== undefined) {
            const expQuery = {};
            if (minExperience !== undefined) expQuery.$gte = minExperience;
            if (maxExperience !== undefined) expQuery.$lte = maxExperience;
            query.$and.push({ experienceLevel: expQuery });
        }

        // Add salary range filter
        if (minSalary !== undefined || maxSalary !== undefined) {
            const salaryQuery = {};
            if (minSalary !== undefined) salaryQuery.$gte = minSalary;
            if (maxSalary !== undefined) salaryQuery.$lte = maxSalary;
            query.$and.push({ salary: salaryQuery });
        }

        // Fetch jobs
        let jobs = await Job.find(query)
            .populate({ path: "company" })
            .skip(skip)
            .limit(limit)
            .lean();

        // Calculate relevance score if keyword is provided
        if (keyword) {
            const keywordLower = keyword.toLowerCase();
            const now = new Date();
            
            jobs = jobs.map(job => {
                let relevanceScore = 0;
                
                // Title match (40 points)
                const titleLower = job.title.toLowerCase();
                if (titleLower.includes(keywordLower)) {
                    relevanceScore += 40;
                    if (titleLower.startsWith(keywordLower)) relevanceScore += 10; // Bonus for prefix match
                }
                
                // Description match (30 points)
                const descLower = job.description.toLowerCase();
                const descMatches = (descLower.match(new RegExp(keywordLower, 'g')) || []).length;
                relevanceScore += Math.min(descMatches * 5, 30);
                
                // Requirements match (20 points)
                if (job.requirements) {
                    const reqMatches = job.requirements.filter(req => 
                        req.toLowerCase().includes(keywordLower)
                    ).length;
                    relevanceScore += Math.min(reqMatches * 10, 20);
                }
                
                // Location match (10 points bonus if location matches keyword)
                if (job.location && job.location.toLowerCase().includes(keywordLower)) {
                    relevanceScore += 10;
                }
                
                // Recency boost (up to 15 points for jobs within 7 days)
                const daysSincePosted = (now - new Date(job.createdAt)) / (1000 * 60 * 60 * 24);
                if (daysSincePosted <= 7) {
                    relevanceScore += Math.round((7 - daysSincePosted) * 2);
                }
                
                return { ...job, relevanceScore };
            });
            
            // Sort by relevance score descending
            jobs.sort((a, b) => b.relevanceScore - a.relevanceScore);
        } else {
            // No keyword: sort by newest first
            jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        const total = await Job.countDocuments(query);

        if (!jobs) {
            return res.status(404).json({
                message: "Jobs not found.",
                success: false
            })
        };

        const responseData = {
            jobs,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalJobs: total,
                jobsPerPage: limit
            },
            success: true
        };

        // Cache the response for 5 minutes
        await cacheHelper.set(cacheKey, responseData, TTL.MEDIUM);

        return res.status(200).json(responseData);
    } catch (error) {
        logger.error('Error in getAllJobs:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
// student
export const getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;
        
        // Check cache first
        const cacheKey = cacheKeys.jobById(jobId);
        const cachedJob = await cacheHelper.get(cacheKey);
        if (cachedJob) {
            logger.info(`Serving job ${jobId} from cache`);
            return res.status(200).json(cachedJob);
        }
        
        const job = await Job.findById(jobId).populate({
            path:"applications"
        });
        if (!job) {
            return res.status(404).json({
                message: "Jobs not found.",
                success: false
            })
        };
        
        const responseData = { job, success: true };
        
        // Cache for 15 minutes
        await cacheHelper.set(cacheKey, responseData, TTL.LONG);
        
        return res.status(200).json(responseData);
    } catch (error) {
        logger.error('Error in getJobById:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
// admin kitne job create kra hai abhi tk
export const getAdminJobs = async (req, res) => {
    try {
        const adminId = req.id;
        const jobs = await Job.find({ created_by: adminId }).populate({
            path:'company',
            createdAt:-1
        });
        if (!jobs) {
            return res.status(404).json({
                message: "Jobs not found.",
                success: false
            })
        };
        return res.status(200).json({
            jobs,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}

// Update job
export const updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;
        const { title, description, requirements, salary, location, jobType, experience, position, companyId, expiresAt, isActive } = req.body;

        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }

        // Check if user owns this job
        if (job.created_by.toString() !== userId) {
            return res.status(403).json({
                message: "You are not authorized to update this job",
                success: false
            });
        }

        // Update fields
        if (title) job.title = title;
        if (description) job.description = description;
        if (requirements) job.requirements = requirements.split(",");
        if (salary) job.salary = Number(salary);
        if (location) job.location = location;
        if (jobType) job.jobType = jobType;
        if (experience) job.experienceLevel = experience;
        if (position) job.position = position;
        if (companyId) job.company = companyId;
        if (expiresAt) job.expiresAt = expiresAt;
        if (typeof isActive !== 'undefined') job.isActive = isActive;

        await job.save();

        // Invalidate caches
        await cacheHelper.delPattern('jobs:all:*');
        await cacheHelper.delPattern(`jobs:${id}`);
        await cacheHelper.delPattern(`companies:user:${userId}`);

        return res.status(200).json({
            message: "Job updated successfully",
            job,
            success: true
        });
    } catch (error) {
        logger.error('Error in updateJob:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get draft jobs for recruiter
export const getDraftJobs = async (req, res) => {
    try {
        const userId = req.id;
        
        const draftJobs = await Job.find({
            created_by: userId,
            isDraft: true
        })
        .populate({ path: "company" })
        .sort({ updatedAt: -1 });

        return res.status(200).json({
            jobs: draftJobs,
            success: true
        });
    } catch (error) {
        logger.error('Error in getDraftJobs:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Publish draft job
export const publishDraft = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;

        const job = await Job.findById(id);
        
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }

        if (job.created_by.toString() !== userId) {
            return res.status(403).json({
                message: "You are not authorized to publish this job",
                success: false
            });
        }

        if (!job.isDraft) {
            return res.status(400).json({
                message: "This job is already published",
                success: false
            });
        }

        job.isDraft = false;
        await job.save();

        // Invalidate caches
        await cacheHelper.delPattern('jobs:all:*');

        return res.status(200).json({
            message: "Job published successfully",
            job,
            success: true
        });
    } catch (error) {
        logger.error('Error in publishDraft:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Duplicate job
export const duplicateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;

        const originalJob = await Job.findById(id);
        
        if (!originalJob) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }

        if (originalJob.created_by.toString() !== userId) {
            return res.status(403).json({
                message: "You are not authorized to duplicate this job",
                success: false
            });
        }

        // Create duplicate job (excluding certain fields)
        const duplicateData = {
            title: `${originalJob.title} (Copy)`,
            description: originalJob.description,
            requirements: originalJob.requirements,
            salary: originalJob.salary,
            location: originalJob.location,
            jobType: originalJob.jobType,
            experienceLevel: originalJob.experienceLevel,
            position: originalJob.position,
            company: originalJob.company,
            created_by: userId,
            screeningQuestions: originalJob.screeningQuestions,
            isDraft: true, // New duplicates start as drafts
            // Don't copy applications, moderation status, etc.
        };

        const newJob = await Job.create(duplicateData);

        // Invalidate caches
        await cacheHelper.delPattern('jobs:all:*');
        await cacheHelper.delPattern(`companies:user:${userId}`);

        return res.status(201).json({
            message: "Job duplicated successfully",
            job: newJob,
            success: true
        });
    } catch (error) {
        logger.error('Error in duplicateJob:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Delete job
export const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;

        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }

        // Check if user owns this job
        if (job.created_by.toString() !== userId) {
            return res.status(403).json({
                message: "You are not authorized to delete this job",
                success: false
            });
        }

        // Delete all applications for this job
        const { Application } = await import("../models/application.model.js");
        await Application.deleteMany({ job: id });

        // Delete the job
        await Job.findByIdAndDelete(id);

        // Invalidate caches
        await cacheHelper.delPattern('jobs:all:*');
        await cacheHelper.delPattern(`jobs:${id}`);
        await cacheHelper.delPattern(`companies:user:${userId}`);

        return res.status(200).json({
            message: "Job deleted successfully",
            success: true
        });
    } catch (error) {
        logger.error('Error in deleteJob:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};
// Get job recommendations for user
/**
 * Get personalized job recommendations for user
 * Uses hybrid approach: content-based + collaborative filtering
 * @route GET /api/v1/job/recommendations
 * @access Job Seeker
 */
export const getRecommendations = async (req, res) => {
    try {
        const userId = req.id;
        const {
            limit = 20,
            minScore = 30,
            includeApplied = false,
            useAdvanced = true // Toggle between simple and advanced algorithm
        } = req.query;

        // Check if user is job seeker
        const user = await User.findById(userId).select('role');
        if (user.role !== 'job-seeker') {
            return res.status(403).json({
                message: "Recommendations are only available for job seekers",
                success: false
            });
        }

        // Use advanced recommendation engine if requested
        if (useAdvanced === 'true' || useAdvanced === true) {
            logger.info(`Generating advanced recommendations for user ${userId}`);

            const result = await getJobRecommendations(userId, {
                limit: parseInt(limit),
                minScore: parseInt(minScore),
                includeApplied: includeApplied === 'true' || includeApplied === true
            });

            return res.status(200).json({
                message: "Personalized recommendations generated successfully",
                recommendations: result.recommendations,
                stats: result.stats,
                algorithm: 'hybrid',
                success: true
            });
        }

        // Fallback to simple algorithm for backward compatibility
        logger.info(`Generating simple recommendations for user ${userId}`);

        // Import Application model
        const { Application } = await import("../models/application.model.js");

        // Get user's applied jobs to analyze preferences
        const applications = await Application.find({ applicant: userId })
            .populate('job')
            .limit(50) // Analyze last 50 applications
            .sort({ createdAt: -1 });

        if (applications.length === 0) {
            // No application history - return trending jobs
            const trendingJobs = await Job.find({
                isActive: true,
                isDraft: false,
                'moderation.status': 'approved'
            })
            .populate('company')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

            return res.status(200).json({
                message: "Showing trending jobs (no application history)",
                recommendations: trendingJobs.map((job, index) => ({
                    rank: index + 1,
                    job,
                    score: { total: 0, source: 'trending' },
                    reasons: ['Recently posted', 'Popular among job seekers']
                })),
                algorithm: 'simple',
                reason: 'no-history',
                success: true
            });
        }

        // Extract preferences from applied jobs
        const jobTypes = {};
        const locations = {};
        const experienceLevels = [];
        const salaryRanges = [];
        const appliedJobIds = new Set();

        applications.forEach(app => {
            if (app.job) {
                appliedJobIds.add(app.job._id.toString());
                
                // Count job types
                jobTypes[app.job.jobType] = (jobTypes[app.job.jobType] || 0) + 1;
                
                // Count locations
                locations[app.job.location] = (locations[app.job.location] || 0) + 1;
                
                // Track experience levels
                experienceLevels.push(app.job.experienceLevel || 0);
                
                // Track salary ranges
                salaryRanges.push(app.job.salary || 0);
            }
        });

        // Get top preferences
        const topJobTypes = Object.entries(jobTypes)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([type]) => type);

        const topLocations = Object.entries(locations)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([loc]) => loc);

        const avgExperience = experienceLevels.length > 0
            ? Math.round(experienceLevels.reduce((a, b) => a + b, 0) / experienceLevels.length)
            : 0;

        const avgSalary = salaryRanges.length > 0
            ? salaryRanges.reduce((a, b) => a + b, 0) / salaryRanges.length
            : 0;

        // Build recommendation query
        const recommendationQuery = {
            isActive: true,
            isDraft: false,
            'moderation.status': 'approved',
            _id: { $nin: Array.from(appliedJobIds) }, // Exclude already applied jobs
            $or: []
        };

        // Match job types
        if (topJobTypes.length > 0) {
            recommendationQuery.$or.push({ jobType: { $in: topJobTypes } });
        }

        // Match locations
        if (topLocations.length > 0) {
            recommendationQuery.$or.push({ location: { $in: topLocations } });
        }

        // Match similar experience level (±1 year)
        if (avgExperience > 0) {
            recommendationQuery.$or.push({
                experienceLevel: {
                    $gte: Math.max(0, avgExperience - 1),
                    $lte: avgExperience + 1
                }
            });
        }

        // Match similar salary range (±20%)
        if (avgSalary > 0) {
            recommendationQuery.$or.push({
                salary: {
                    $gte: avgSalary * 0.8,
                    $lte: avgSalary * 1.2
                }
            });
        }

        // If no $or conditions, show recent jobs
        if (recommendationQuery.$or.length === 0) {
            delete recommendationQuery.$or;
        }

        // Fetch recommendations
        let recommendations = await Job.find(recommendationQuery)
            .populate('company')
            .limit(parseInt(limit) * 2) // Get more for scoring
            .lean();

        // Calculate match score for each job
        recommendations = recommendations.map(job => {
            let matchScore = 0;
            const reasons = [];

            // Job type match (30 points)
            if (topJobTypes.includes(job.jobType)) {
                const rank = topJobTypes.indexOf(job.jobType);
                matchScore += 30 - (rank * 5);
                reasons.push(`Matches your preferred job type: ${job.jobType}`);
            }

            // Location match (25 points)
            if (topLocations.includes(job.location)) {
                const rank = topLocations.indexOf(job.location);
                matchScore += 25 - (rank * 5);
                reasons.push(`Located in your preferred area: ${job.location}`);
            }

            // Experience level match (20 points)
            if (avgExperience > 0) {
                const expDiff = Math.abs((job.experienceLevel || 0) - avgExperience);
                const expPoints = Math.max(0, 20 - (expDiff * 10));
                matchScore += expPoints;
                if (expPoints > 10) {
                    reasons.push('Experience level matches your profile');
                }
            }

            // Salary match (15 points)
            if (avgSalary > 0 && job.salary) {
                const salaryDiff = Math.abs(job.salary - avgSalary) / avgSalary;
                const salaryPoints = Math.max(0, 15 - (salaryDiff * 100));
                matchScore += salaryPoints;
                if (salaryPoints > 10) {
                    reasons.push('Salary aligns with your expectations');
                }
            }

            // Recency bonus (10 points for jobs within 7 days)
            const daysSincePosted = (new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24);
            if (daysSincePosted <= 7) {
                matchScore += Math.round((7 - daysSincePosted) * 1.5);
                if (daysSincePosted <= 3) {
                    reasons.push('Recently posted');
                }
            }

            // Verified company bonus (5 points)
            if (job.company?.verification?.status === 'approved') {
                matchScore += 5;
                reasons.push('Verified company');
            }

            return {
                rank: 0, // Will be set after sorting
                job,
                score: {
                    total: Math.round(matchScore),
                    source: 'simple'
                },
                reasons: reasons.length > 0 ? reasons : ['Based on your application history']
            };
        });

        // Sort by match score and limit
        recommendations.sort((a, b) => b.score.total - a.score.total);
        recommendations = recommendations.slice(0, parseInt(limit));

        // Set ranks
        recommendations.forEach((rec, index) => {
            rec.rank = index + 1;
        });

        logger.info(`Generated ${recommendations.length} simple recommendations for user ${userId}`);

        return res.status(200).json({
            message: "Recommendations generated successfully",
            recommendations,
            algorithm: 'simple',
            preferences: {
                topJobTypes,
                topLocations,
                avgExperience,
                avgSalary: Math.round(avgSalary)
            },
            success: true
        });

    } catch (error) {
        logger.error('Error getting recommendations:', error);
        return res.status(500).json({
            message: "Failed to generate recommendations",
            success: false
        });
    }
};
/**
 * Advanced job search with multiple filters and relevance scoring
 * GET /api/v1/job/advanced-search
 */
export const advancedJobSearch = async (req, res) => {
    try {
        const {
            keyword,
            skills,
            skillsMatchType = 'any',
            location,
            locationRadius = 50,
            minSalary,
            maxSalary,
            jobType,
            experienceLevel,
            companySize,
            industry,
            verifiedCompaniesOnly = false,
            postedWithin = 'all',
            page = 1,
            limit = 20,
            sortBy = 'relevance'
        } = req.query;

        const searchParams = {
            keyword,
            skills: skills ? (Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim())) : [],
            skillsMatchType,
            location,
            locationRadius: parseInt(locationRadius),
            minSalary: minSalary ? parseFloat(minSalary) : undefined,
            maxSalary: maxSalary ? parseFloat(maxSalary) : undefined,
            jobType,
            experienceLevel: experienceLevel ? (Array.isArray(experienceLevel) ? experienceLevel : experienceLevel.split(',')) : [],
            companySize: companySize ? (Array.isArray(companySize) ? companySize : companySize.split(',')) : [],
            industry: industry ? (Array.isArray(industry) ? industry : industry.split(',')) : [],
            verifiedCompaniesOnly: verifiedCompaniesOnly === 'true' || verifiedCompaniesOnly === true,
            postedWithin
        };

        const query = buildSearchQuery(searchParams);

        if (searchParams.companySize.length > 0) {
            query['company.companySize'] = { $in: searchParams.companySize };
        }

        if (searchParams.industry.length > 0) {
            query['company.industry'] = { $in: searchParams.industry };
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let jobsQuery = Job.find(query)
            .populate({ path: 'company', select: 'name description location logo website verification industry companySize' })
            .populate({ path: 'created_by', select: 'fullname' });

        if (sortBy === 'date') {
            jobsQuery = jobsQuery.sort({ createdAt: -1 });
        } else if (sortBy === 'salary') {
            jobsQuery = jobsQuery.sort({ salary: -1 });
        }

        const allJobs = await jobsQuery.lean();

        const jobsWithScores = allJobs.map(job => ({
            ...job,
            relevanceScore: calculateRelevanceScore(job, searchParams)
        }));

        if (sortBy === 'relevance') {
            jobsWithScores.sort((a, b) => b.relevanceScore - a.relevanceScore);
        }

        const totalJobs = jobsWithScores.length;
        const paginatedJobs = jobsWithScores.slice(skip, skip + limitNum);

        if (req.id) {
            await recordSearchHistory(SearchHistory, req.id, searchParams, totalJobs, req);
        }

        const stats = {
            totalResults: totalJobs,
            page: pageNum,
            totalPages: Math.ceil(totalJobs / limitNum),
            hasMore: skip + limitNum < totalJobs,
            avgRelevance: totalJobs > 0 ? Math.round(jobsWithScores.reduce((sum, j) => sum + j.relevanceScore, 0) / totalJobs) : 0,
            verifiedCount: jobsWithScores.filter(j => j.company?.verification?.status === 'approved').length
        };

        logger.info(`Advanced search: ${totalJobs} results, ${searchParams.skills?.length || 0} skills`);

        return res.status(200).json({ jobs: paginatedJobs, stats, searchParams, success: true });

    } catch (error) {
        logger.error('Error in advanced job search:', error);
        return res.status(500).json({ message: "Failed to perform advanced search", success: false });
    }
};

/**
 * Get matched candidates for a job
 * Uses AI-powered matching algorithm to find best candidates
 * @route GET /api/v1/job/:id/matched-candidates
 * @access Recruiter, Admin
 */
export const getMatchedCandidates = async (req, res) => {
    try {
        const jobId = req.params.id;
        const {
            minScore = 40,
            page = 1,
            limit = 20,
            includeApplied = false,
            sortBy = 'score' // score, recent
        } = req.query;

        // Fetch job details
        const job = await Job.findById(jobId).populate('company', 'name verification');
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }

        // Authorization: Only job's company recruiters or admins can access
        const user = await User.findById(req.id);
        if (user.role !== 'admin' && user.role !== 'sub-admin') {
            if (user.role !== 'recruiter' || job.company._id.toString() !== user.company?.toString()) {
                return res.status(403).json({
                    message: "You don't have permission to view matched candidates for this job",
                    success: false
                });
            }
        }

        // Find all job seekers
        let candidateQuery = { role: 'job-seeker' };

        // Optionally exclude candidates who already applied
        if (!includeApplied) {
            const { Application } = await import('../models/application.model.js');
            const appliedUserIds = await Application.find({ job: jobId })
                .distinct('applicant');
            if (appliedUserIds.length > 0) {
                candidateQuery._id = { $nin: appliedUserIds };
            }
        }

        // Fetch candidates with their profiles
        const candidates = await User.find(candidateQuery)
            .select('fullname email phoneNumber profile resume createdAt lastLogin')
            .lean();

        if (candidates.length === 0) {
            return res.status(200).json({
                message: "No candidates found",
                candidates: [],
                stats: { total: 0, filtered: 0, avgScore: 0 },
                success: true
            });
        }

        logger.info(`Matching ${candidates.length} candidates for job: ${job.title}`);

        // Fetch completed assessments for all candidates
        const candidateIds = candidates.map(c => c._id);
        const assessments = await UserAssessment.find({
            user: { $in: candidateIds },
            status: 'completed',
            passed: true
        })
            .select('user assessment score passed completedAt')
            .populate('assessment', 'title skills')
            .lean();

        // Group assessments by user
        const assessmentsByUser = assessments.reduce((acc, assessment) => {
            const userId = assessment.user.toString();
            if (!acc[userId]) acc[userId] = [];
            acc[userId].push({
                title: assessment.assessment?.title,
                skills: assessment.assessment?.skills || [],
                score: assessment.score,
                passed: assessment.passed,
                completedAt: assessment.completedAt
            });
            return acc;
        }, {});

        // Attach assessments to candidates
        const candidatesWithAssessments = candidates.map(candidate => ({
            ...candidate,
            completedAssessments: assessmentsByUser[candidate._id.toString()] || []
        }));

        // Calculate match scores using batch processing
        const matches = calculateBatchMatchScores(
            candidatesWithAssessments,
            job,
            parseInt(minScore)
        );

        // Sort results
        if (sortBy === 'recent') {
            matches.sort((a, b) => 
                new Date(b.candidate.createdAt) - new Date(a.candidate.createdAt)
            );
        }
        // Default: already sorted by score in calculateBatchMatchScores

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const paginatedMatches = matches.slice(skip, skip + limitNum);

        // Format response
        const formattedCandidates = paginatedMatches.map((match, index) => ({
            rank: skip + index + 1,
            candidate: {
                _id: match.candidate._id,
                fullname: match.candidate.fullname,
                email: match.candidate.email,
                phoneNumber: match.candidate.phoneNumber,
                profileHeadline: match.candidate.profile?.bio || '',
                skills: match.candidate.profile?.skills || match.candidate.skills || [],
                experience: match.candidate.profile?.experience?.totalYears || 0,
                education: match.candidate.profile?.education?.degree || match.candidate.education?.[0]?.degree,
                location: match.candidate.profile?.location || match.candidate.location,
                expectedSalary: match.candidate.profile?.expectedSalary,
                resume: match.candidate.resume,
                profilePicture: match.candidate.profile?.profilePhoto,
                lastLogin: match.candidate.lastLogin,
                memberSince: match.candidate.createdAt
            },
            matchScore: match.matchData.totalScore,
            matchLevel: match.matchData.matchLevel,
            breakdown: match.matchData.breakdown,
            strengths: generateStrengths(match.matchData.breakdown),
            weaknesses: generateWeaknesses(match.matchData.breakdown)
        }));

        // Calculate statistics
        const avgScore = matches.length > 0
            ? Math.round(matches.reduce((sum, m) => sum + m.matchData.totalScore, 0) / matches.length)
            : 0;

        const stats = {
            total: candidates.length,
            filtered: matches.length,
            avgScore,
            page: pageNum,
            totalPages: Math.ceil(matches.length / limitNum),
            hasMore: skip + limitNum < matches.length,
            distribution: {
                excellent: matches.filter(m => m.matchData.totalScore >= 85).length,
                veryGood: matches.filter(m => m.matchData.totalScore >= 70 && m.matchData.totalScore < 85).length,
                good: matches.filter(m => m.matchData.totalScore >= 55 && m.matchData.totalScore < 70).length,
                fair: matches.filter(m => m.matchData.totalScore >= 40 && m.matchData.totalScore < 55).length
            }
        };

        logger.info(`Matched ${matches.length}/${candidates.length} candidates for job ${jobId}, avg score: ${avgScore}`);

        return res.status(200).json({
            message: "Matched candidates retrieved successfully",
            candidates: formattedCandidates,
            stats,
            jobDetails: {
                _id: job._id,
                title: job.title,
                company: job.company.name,
                location: job.location,
                requiredSkills: job.skills
            },
            success: true
        });

    } catch (error) {
        logger.error('Error getting matched candidates:', error);
        return res.status(500).json({
            message: "Failed to get matched candidates",
            success: false
        });
    }
};

/**
 * Helper: Generate strengths from breakdown
 */
const generateStrengths = (breakdown) => {
    const strengths = [];
    if (breakdown.skills?.percentage >= 80) {
        strengths.push(`Excellent skills match (${breakdown.skills.matchedSkills?.length || 0} matching skills)`);
    }
    if (breakdown.experience?.status === 'perfect-match' || breakdown.experience?.status === 'match') {
        strengths.push('Experience level matches requirements');
    }
    if (breakdown.education?.status === 'perfect-match' || breakdown.education?.status === 'exceeds-requirement') {
        strengths.push('Meets or exceeds education requirements');
    }
    if (breakdown.assessments?.relevantAssessments?.length > 0) {
        strengths.push(`Completed ${breakdown.assessments.relevantAssessments.length} relevant assessment(s)`);
    }
    if (breakdown.location?.status === 'same-city' || breakdown.location?.status === 'remote-job') {
        strengths.push('Location preference aligns');
    }
    return strengths;
};

/**
 * Helper: Generate weaknesses from breakdown
 */
const generateWeaknesses = (breakdown) => {
    const weaknesses = [];
    if (breakdown.skills?.missingSkills?.length > 0) {
        weaknesses.push(`Missing skills: ${breakdown.skills.missingSkills.slice(0, 3).join(', ')}`);
    }
    if (breakdown.experience?.status?.includes('under-qualified')) {
        weaknesses.push(`Under-qualified by ${breakdown.experience.gap || 0} years`);
    }
    if (breakdown.education?.status?.includes('under-qualified')) {
        weaknesses.push('Does not meet minimum education requirement');
    }
    if (breakdown.salary?.status === 'significantly-above-range') {
        weaknesses.push('Salary expectations significantly exceed budget');
    }
    if (breakdown.location?.status === 'location-mismatch') {
        weaknesses.push('Location does not match job location');
    }
    if (breakdown.assessments?.status === 'no-assessments') {
        weaknesses.push('No assessments completed');
    }
    return weaknesses;
};

/**
 * Advanced semantic search with AI-powered matching
 * @route POST /api/v1/job/semantic-search
 */
export const semanticSearch = async (req, res) => {
    try {
        const { query, filters = {}, page = 1, limit = 20 } = req.body;
        const userId = req.id;

        // Build semantic search query with fuzzy matching
        const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        const fuzzyRegex = searchTerms.map(term => new RegExp(term.split('').join('.*'), 'i'));

        const match = { 
            isActive: true,
            isDraft: false,
            $or: [
                { title: { $in: fuzzyRegex } },
                { description: { $in: fuzzyRegex } },
                { requirements: { $elemMatch: { $in: fuzzyRegex } } },
                { location: { $in: fuzzyRegex } }
            ]
        };

        if (filters.jobType) match.jobType = filters.jobType;
        if (filters.location) match.location = new RegExp(filters.location, 'i');
        if (filters.salary) match.salary = { $gte: filters.salary };
        if (filters.experienceLevel) match.experienceLevel = filters.experienceLevel;

        const jobs = await Job.find(match)
            .populate('company', 'name logo location')
            .limit(parseInt(limit))
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        // Save search history
        if (userId) {
            await SearchHistory.create({
                user: userId,
                query,
                filters,
                resultCount: jobs.length
            });
        }

        return res.status(200).json({
            message: 'Semantic search completed',
            jobs,
            total: jobs.length,
            success: true
        });
    } catch (error) {
        logger.error('Error in semanticSearch:', error);
        return res.status(500).json({ message: 'Search failed', success: false });
    }
};

/**
 * Boolean search with operators (AND, OR, NOT)
 * @route POST /api/v1/job/boolean-search
 */
export const booleanSearch = async (req, res) => {
    try {
        const { query } = req.body;
        
        // Parse boolean operators: "python AND django NOT flask"
        const andTerms = query.split(' AND ').map(t => t.trim());
        const conditions = [];

        andTerms.forEach(term => {
            if (term.includes(' NOT ')) {
                const [include, exclude] = term.split(' NOT ');
                conditions.push({
                    $and: [
                        { $or: [
                            { title: new RegExp(include, 'i') },
                            { description: new RegExp(include, 'i') },
                            { requirements: new RegExp(include, 'i') }
                        ]},
                        { $nor: [
                            { title: new RegExp(exclude, 'i') },
                            { description: new RegExp(exclude, 'i') },
                            { requirements: new RegExp(exclude, 'i') }
                        ]}
                    ]
                });
            } else if (term.includes(' OR ')) {
                const orTerms = term.split(' OR ');
                const orConditions = orTerms.map(t => ({
                    $or: [
                        { title: new RegExp(t, 'i') },
                        { description: new RegExp(t, 'i') },
                        { requirements: new RegExp(t, 'i') }
                    ]
                }));
                conditions.push({ $or: orConditions });
            } else {
                conditions.push({
                    $or: [
                        { title: new RegExp(term, 'i') },
                        { description: new RegExp(term, 'i') },
                        { requirements: new RegExp(term, 'i') }
                    ]
                });
            }
        });

        const jobs = await Job.find({ $and: conditions, isActive: true })
            .populate('company', 'name logo')
            .limit(50);

        return res.status(200).json({
            message: 'Boolean search completed',
            jobs,
            success: true
        });
    } catch (error) {
        logger.error('Error in booleanSearch:', error);
        return res.status(500).json({ message: 'Search failed', success: false });
    }
};

/**
 * Get search recommendations based on history
 * @route GET /api/v1/job/search-recommendations
 */
export const getSearchRecommendations = async (req, res) => {
    try {
        const userId = req.id;

        const recentSearches = await SearchHistory.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(10);

        const searchTerms = recentSearches.map(s => s.query).join(' ');
        const commonTerms = searchTerms.toLowerCase().split(/\s+/)
            .reduce((acc, term) => {
                acc[term] = (acc[term] || 0) + 1;
                return acc;
            }, {});

        const recommendations = Object.entries(commonTerms)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([term]) => term);

        return res.status(200).json({
            recommendations,
            recentSearches: recentSearches.map(s => s.query),
            success: true
        });
    } catch (error) {
        logger.error('Error in getSearchRecommendations:', error);
        return res.status(500).json({ message: 'Failed to get recommendations', success: false });
    }
};
