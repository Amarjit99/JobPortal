import { Job } from '../models/job.model.js';
import { User } from '../models/user.model.js';
import { Application } from '../models/application.model.js';
import { getJobRecommendations } from '../utils/recommendationUtils.js';
import { calculateMatchScore } from '../utils/matchingUtils.js';
import logger from '../utils/logger.js';

export const getPersonalizedRecommendations = async (req, res) => {
    try {
        const userId = req.id;
        const { limit = 20, strategy = 'hybrid' } = req.query;

        const user = await User.findById(userId).select('profile');
        if (!user || !user.profile) {
            return res.status(404).json({ message: 'User profile not found', success: false });
        }

        const recommendations = await getJobRecommendations(userId, {
            limit: parseInt(limit),
            strategy // 'content', 'collaborative', 'hybrid'
        });

        return res.status(200).json({
            message: 'Recommendations generated successfully',
            recommendations,
            strategy,
            success: true
        });
    } catch (error) {
        logger.error('Error in getPersonalizedRecommendations:', error);
        return res.status(500).json({ message: 'Failed to get recommendations', success: false });
    }
};

export const getSimilarJobs = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { limit = 10 } = req.query;

        const job = await Job.findById(jobId).select('title requirements location salary jobType experienceLevel company');
        if (!job) {
            return res.status(404).json({ message: 'Job not found', success: false });
        }

        const similarJobs = await Job.aggregate([
            {
                $match: {
                    _id: { $ne: job._id },
                    isActive: true,
                    $or: [
                        { requirements: { $in: job.requirements } },
                        { location: job.location },
                        { jobType: job.jobType },
                        { experienceLevel: job.experienceLevel }
                    ]
                }
            },
            {
                $addFields: {
                    similarityScore: {
                        $add: [
                            { $size: { $setIntersection: ['$requirements', job.requirements] } },
                            { $cond: [{ $eq: ['$location', job.location] }, 5, 0] },
                            { $cond: [{ $eq: ['$jobType', job.jobType] }, 3, 0] }
                        ]
                    }
                }
            },
            { $sort: { similarityScore: -1 } },
            { $limit: parseInt(limit) },
            {
                $lookup: {
                    from: 'companies',
                    localField: 'company',
                    foreignField: '_id',
                    as: 'company'
                }
            },
            { $unwind: '$company' }
        ]);

        return res.status(200).json({
            message: 'Similar jobs retrieved',
            originalJob: { id: job._id, title: job.title },
            similarJobs,
            success: true
        });
    } catch (error) {
        logger.error('Error in getSimilarJobs:', error);
        return res.status(500).json({ message: 'Failed to get similar jobs', success: false });
    }
};

export const getCandidateMatches = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { minScore = 50, limit = 20 } = req.query;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found', success: false });
        }

        const candidates = await User.find({ role: 'student' })
            .select('fullname email profile')
            .limit(100);

        const scoredCandidates = await Promise.all(
            candidates.map(async (candidate) => {
                const matchResult = await calculateMatchScore(candidate._id, jobId);
                return {
                    candidate: {
                        id: candidate._id,
                        name: candidate.fullname,
                        email: candidate.email,
                        skills: candidate.profile?.skills || []
                    },
                    matchScore: matchResult.overallScore,
                    breakdown: matchResult.breakdown
                };
            })
        );

        const filteredCandidates = scoredCandidates
            .filter(c => c.matchScore >= parseInt(minScore))
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, parseInt(limit));

        return res.status(200).json({
            message: 'Candidate matches retrieved',
            job: { id: job._id, title: job.title },
            matches: filteredCandidates,
            total: filteredCandidates.length,
            success: true
        });
    } catch (error) {
        logger.error('Error in getCandidateMatches:', error);
        return res.status(500).json({ message: 'Failed to get candidate matches', success: false });
    }
};

export const getPersonalizedFeed = async (req, res) => {
    try {
        const userId = req.id;
        const { page = 1, limit = 20 } = req.query;

        const recommendations = await getJobRecommendations(userId, {
            limit: parseInt(limit) * 2,
            strategy: 'hybrid'
        });

        const skip = (page - 1) * limit;
        const paginatedJobs = recommendations.slice(skip, skip + parseInt(limit));

        return res.status(200).json({
            message: 'Personalized feed generated',
            jobs: paginatedJobs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(recommendations.length / limit),
                hasMore: skip + paginatedJobs.length < recommendations.length
            },
            success: true
        });
    } catch (error) {
        logger.error('Error in getPersonalizedFeed:', error);
        return res.status(500).json({ message: 'Failed to generate feed', success: false });
    }
};
