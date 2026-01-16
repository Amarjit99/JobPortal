/**
 * Job Recommendation Engine
 * Provides personalized job recommendations using hybrid approach:
 * 1. Content-based filtering (profile matching)
 * 2. Collaborative filtering (behavior patterns)
 * 3. Contextual signals (recency, engagement)
 */

import { Job } from '../models/job.model.js';
import { Application } from '../models/application.model.js';
import { SavedSearch } from '../models/savedSearch.model.js';
import { SearchHistory } from '../models/searchHistory.model.js';
import { UserAssessment } from '../models/userAssessment.model.js';
import { calculateMatchScore } from './matchingUtils.js';

/**
 * Analyze user's job application history to identify patterns
 * @param {String} userId - User ID
 * @returns {Object} Application patterns and preferences
 */
const analyzeApplicationHistory = async (userId) => {
    const applications = await Application.find({ applicant: userId })
        .populate('job', 'title skills location salary jobType company experience industry')
        .sort({ createdAt: -1 })
        .limit(50) // Last 50 applications
        .lean();

    if (applications.length === 0) {
        return {
            preferredSkills: [],
            preferredLocations: [],
            preferredJobTypes: [],
            preferredIndustries: [],
            salaryRange: { min: null, max: null },
            experienceRange: { min: null, max: null }
        };
    }

    // Extract skills frequency
    const skillsFrequency = {};
    const locations = {};
    const jobTypes = {};
    const industries = {};
    const salaries = [];
    const experiences = [];

    applications.forEach(app => {
        if (!app.job) return;

        // Skills
        (app.job.skills || []).forEach(skill => {
            const normalized = skill.toLowerCase();
            skillsFrequency[normalized] = (skillsFrequency[normalized] || 0) + 1;
        });

        // Location
        if (app.job.location) {
            locations[app.job.location] = (locations[app.job.location] || 0) + 1;
        }

        // Job Type
        if (app.job.jobType) {
            jobTypes[app.job.jobType] = (jobTypes[app.job.jobType] || 0) + 1;
        }

        // Industry
        if (app.job.industry) {
            industries[app.job.industry] = (industries[app.job.industry] || 0) + 1;
        }

        // Salary
        if (app.job.salary) {
            salaries.push(app.job.salary);
        }

        // Experience
        if (app.job.experience) {
            experiences.push(app.job.experience);
        }
    });

    // Sort and get top preferences
    const preferredSkills = Object.entries(skillsFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([skill]) => skill);

    const preferredLocations = Object.keys(locations).sort((a, b) => locations[b] - locations[a]);
    const preferredJobTypes = Object.keys(jobTypes).sort((a, b) => jobTypes[b] - jobTypes[a]);
    const preferredIndustries = Object.keys(industries).sort((a, b) => industries[b] - industries[a]);

    return {
        preferredSkills,
        preferredLocations,
        preferredJobTypes,
        preferredIndustries,
        salaryRange: {
            min: salaries.length > 0 ? Math.min(...salaries) : null,
            max: salaries.length > 0 ? Math.max(...salaries) : null,
            avg: salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : null
        },
        experienceRange: {
            min: experiences.length > 0 ? Math.min(...experiences) : null,
            max: experiences.length > 0 ? Math.max(...experiences) : null
        },
        totalApplications: applications.length
    };
};

/**
 * Analyze user's saved searches for intent
 * @param {String} userId - User ID
 * @returns {Object} Search patterns
 */
const analyzeSavedSearches = async (userId) => {
    const savedSearches = await SavedSearch.find({ user: userId, isActive: true })
        .sort({ lastUsed: -1 })
        .limit(10)
        .lean();

    if (savedSearches.length === 0) {
        return { keywords: [], skills: [], locations: [], jobTypes: [] };
    }

    const keywords = new Set();
    const skills = new Set();
    const locations = new Set();
    const jobTypes = new Set();

    savedSearches.forEach(search => {
        if (search.keywords) keywords.add(search.keywords.toLowerCase());
        (search.skills || []).forEach(skill => skills.add(skill.toLowerCase()));
        if (search.location) locations.add(search.location);
        if (search.jobType) jobTypes.add(search.jobType);
    });

    return {
        keywords: Array.from(keywords),
        skills: Array.from(skills),
        locations: Array.from(locations),
        jobTypes: Array.from(jobTypes)
    };
};

/**
 * Analyze user's search history for trending interests
 * @param {String} userId - User ID
 * @returns {Object} Recent search patterns
 */
const analyzeSearchHistory = async (userId) => {
    const recentSearches = await SearchHistory.find({ user: userId })
        .sort({ searchedAt: -1 })
        .limit(20)
        .lean();

    if (recentSearches.length === 0) {
        return { recentKeywords: [], recentSkills: [] };
    }

    const keywords = [];
    const skills = new Set();

    recentSearches.forEach(search => {
        if (search.keywords) keywords.push(search.keywords.toLowerCase());
        (search.skills || []).forEach(skill => skills.add(skill.toLowerCase()));
    });

    return {
        recentKeywords: [...new Set(keywords)].slice(0, 5),
        recentSkills: Array.from(skills).slice(0, 10)
    };
};

/**
 * Find similar users based on application overlap (collaborative filtering)
 * @param {String} userId - User ID
 * @returns {Array} Similar user IDs
 */
const findSimilarUsers = async (userId) => {
    // Get jobs this user applied to
    const userApplications = await Application.find({ applicant: userId })
        .select('job')
        .lean();

    if (userApplications.length === 0) return [];

    const userJobIds = userApplications.map(app => app.job.toString());

    // Find other users who applied to same jobs
    const similarApplications = await Application.find({
        job: { $in: userJobIds },
        applicant: { $ne: userId }
    })
        .select('applicant job')
        .lean();

    // Count overlaps
    const userOverlap = {};
    similarApplications.forEach(app => {
        const otherUserId = app.applicant.toString();
        userOverlap[otherUserId] = (userOverlap[otherUserId] || 0) + 1;
    });

    // Sort by overlap count and return top 10
    return Object.entries(userOverlap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId]) => userId);
};

/**
 * Get jobs that similar users applied to (collaborative recommendations)
 * @param {Array} similarUserIds - Similar user IDs
 * @param {String} currentUserId - Current user ID
 * @returns {Array} Job IDs with recommendation scores
 */
const getCollaborativeRecommendations = async (similarUserIds, currentUserId) => {
    if (similarUserIds.length === 0) return [];

    // Get jobs similar users applied to
    const similarUsersApplications = await Application.find({
        applicant: { $in: similarUserIds }
    })
        .select('job applicant')
        .lean();

    // Get jobs current user already applied to
    const userApplications = await Application.find({ applicant: currentUserId })
        .select('job')
        .lean();
    const appliedJobIds = new Set(userApplications.map(app => app.job.toString()));

    // Count frequency of each job among similar users
    const jobFrequency = {};
    similarUsersApplications.forEach(app => {
        const jobId = app.job.toString();
        if (!appliedJobIds.has(jobId)) {
            jobFrequency[jobId] = (jobFrequency[jobId] || 0) + 1;
        }
    });

    // Return top jobs by frequency
    return Object.entries(jobFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50) // Top 50 collaborative recommendations
        .map(([jobId, frequency]) => ({
            jobId,
            collaborativeScore: frequency,
            reason: `${frequency} similar users applied`
        }));
};

/**
 * Score jobs based on content (user profile matching)
 * @param {Array} jobs - Job documents
 * @param {Object} userProfile - User profile with skills, experience, etc.
 * @returns {Array} Jobs with content scores
 */
const scoreJobsByContent = (jobs, userProfile) => {
    return jobs.map(job => {
        const matchData = calculateMatchScore(userProfile, job);

        return {
            job,
            contentScore: matchData.totalScore,
            matchLevel: matchData.matchLevel,
            breakdown: matchData.breakdown,
            reasons: generateRecommendationReasons(matchData.breakdown, userProfile, job)
        };
    });
};

/**
 * Generate human-readable reasons for recommendation
 * @param {Object} breakdown - Match score breakdown
 * @param {Object} userProfile - User profile
 * @param {Object} job - Job document
 * @returns {Array} Recommendation reasons
 */
const generateRecommendationReasons = (breakdown, userProfile, job) => {
    const reasons = [];

    // Skills match
    if (breakdown.skills?.matchedSkills?.length > 0) {
        const skillCount = breakdown.skills.matchedSkills.length;
        if (skillCount >= 5) {
            reasons.push(`You have ${skillCount} matching skills including ${breakdown.skills.matchedSkills.slice(0, 3).join(', ')}`);
        } else {
            reasons.push(`Matches your skills: ${breakdown.skills.matchedSkills.join(', ')}`);
        }
    }

    // Experience match
    if (breakdown.experience?.status === 'perfect-match') {
        reasons.push('Your experience level is perfect for this role');
    }

    // Location match
    if (breakdown.location?.status === 'same-city') {
        reasons.push('Located in your preferred city');
    } else if (breakdown.location?.status === 'remote-job') {
        reasons.push('Remote work opportunity');
    }

    // Salary match
    if (breakdown.salary?.status === 'within-range') {
        reasons.push('Salary matches your expectations');
    }

    // Assessment completion
    if (breakdown.assessments?.relevantAssessments?.length > 0) {
        reasons.push(`You completed relevant ${breakdown.assessments.relevantAssessments[0]?.title || 'assessment'}`);
    }

    // Company verification
    if (job.company?.verification?.status === 'approved') {
        reasons.push('Verified company');
    }

    // Recency
    const daysSincePosted = Math.floor((Date.now() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24));
    if (daysSincePosted <= 3) {
        reasons.push('Recently posted');
    }

    return reasons;
};

/**
 * Apply recency boost to job scores
 * @param {Array} scoredJobs - Jobs with scores
 * @returns {Array} Jobs with recency-adjusted scores
 */
const applyRecencyBoost = (scoredJobs) => {
    return scoredJobs.map(item => {
        const daysSincePosted = Math.floor((Date.now() - new Date(item.job.createdAt)) / (1000 * 60 * 60 * 24));

        let recencyBoost = 0;
        if (daysSincePosted <= 1) recencyBoost = 10;
        else if (daysSincePosted <= 3) recencyBoost = 7;
        else if (daysSincePosted <= 7) recencyBoost = 5;
        else if (daysSincePosted <= 14) recencyBoost = 3;
        else if (daysSincePosted <= 30) recencyBoost = 1;

        return {
            ...item,
            recencyBoost,
            finalScore: (item.contentScore || 0) + (item.collaborativeScore || 0) + recencyBoost
        };
    });
};

/**
 * Main recommendation function
 * Get personalized job recommendations for a user
 * @param {String} userId - User ID
 * @param {Object} options - Options like limit, minScore, etc.
 * @returns {Array} Recommended jobs with scores and reasons
 */
export const getJobRecommendations = async (userId, options = {}) => {
    const {
        limit = 20,
        minScore = 30,
        includeApplied = false
    } = options;

    try {
        // Step 1: Fetch user profile
        const { User } = await import('../models/user.model.js');
        const user = await User.findById(userId)
            .select('profile skills education experience location expectedSalary')
            .lean();

        if (!user) {
            throw new Error('User not found');
        }

        // Fetch completed assessments
        const completedAssessments = await UserAssessment.find({
            user: userId,
            status: 'completed',
            passed: true
        })
            .select('assessment score passed')
            .populate('assessment', 'title skills')
            .lean();

        const userProfile = {
            ...user,
            completedAssessments: completedAssessments.map(ca => ({
                title: ca.assessment?.title,
                skills: ca.assessment?.skills || [],
                score: ca.score,
                passed: ca.passed
            }))
        };

        // Step 2: Analyze user behavior
        const [applicationHistory, savedSearches, searchHistory] = await Promise.all([
            analyzeApplicationHistory(userId),
            analyzeSavedSearches(userId),
            analyzeSearchHistory(userId)
        ]);

        // Step 3: Build query for candidate jobs
        const jobQuery = { isActive: true };

        // Exclude already applied jobs unless requested
        if (!includeApplied) {
            const appliedJobIds = await Application.find({ applicant: userId })
                .distinct('job');
            if (appliedJobIds.length > 0) {
                jobQuery._id = { $nin: appliedJobIds };
            }
        }

        // Filter by preferred skills or locations if available
        const orConditions = [];

        if (applicationHistory.preferredSkills.length > 0) {
            orConditions.push({
                skills: {
                    $in: applicationHistory.preferredSkills.map(s =>
                        new RegExp(s, 'i')
                    )
                }
            });
        }

        if (savedSearches.skills.length > 0) {
            orConditions.push({
                skills: {
                    $in: savedSearches.skills.map(s => new RegExp(s, 'i'))
                }
            });
        }

        if (searchHistory.recentSkills.length > 0) {
            orConditions.push({
                skills: {
                    $in: searchHistory.recentSkills.map(s => new RegExp(s, 'i'))
                }
            });
        }

        if (orConditions.length > 0) {
            jobQuery.$or = orConditions;
        }

        // Fetch candidate jobs
        const candidateJobs = await Job.find(jobQuery)
            .populate('company', 'name verification logo')
            .sort({ createdAt: -1 })
            .limit(200) // Get more candidates for better filtering
            .lean();

        if (candidateJobs.length === 0) {
            return {
                recommendations: [],
                stats: {
                    total: 0,
                    sources: { contentBased: 0, collaborative: 0, hybrid: 0 }
                }
            };
        }

        // Step 4: Content-based scoring
        const contentScored = scoreJobsByContent(candidateJobs, userProfile);

        // Step 5: Collaborative filtering
        const similarUsers = await findSimilarUsers(userId);
        const collaborativeRecs = await getCollaborativeRecommendations(similarUsers, userId);

        // Create map of collaborative scores
        const collaborativeScoreMap = {};
        collaborativeRecs.forEach(rec => {
            collaborativeScoreMap[rec.jobId] = rec.collaborativeScore;
        });

        // Step 6: Merge scores
        const mergedScores = contentScored.map(item => ({
            ...item,
            collaborativeScore: collaborativeScoreMap[item.job._id.toString()] || 0
        }));

        // Step 7: Apply recency boost
        const finalScored = applyRecencyBoost(mergedScores);

        // Step 8: Filter by minimum score and sort
        const filteredRecommendations = finalScored
            .filter(item => item.finalScore >= minScore)
            .sort((a, b) => b.finalScore - a.finalScore)
            .slice(0, limit);

        // Step 9: Format response
        const recommendations = filteredRecommendations.map((item, index) => {
            // Determine recommendation source
            let source = 'content-based';
            if (item.collaborativeScore > 0 && item.contentScore > 0) {
                source = 'hybrid';
            } else if (item.collaborativeScore > 0) {
                source = 'collaborative';
            }

            return {
                rank: index + 1,
                job: {
                    _id: item.job._id,
                    title: item.job.title,
                    company: item.job.company,
                    location: item.job.location,
                    salary: item.job.salary,
                    maxSalary: item.job.maxSalary,
                    jobType: item.job.jobType,
                    experience: item.job.experience,
                    skills: item.job.skills,
                    description: item.job.description?.substring(0, 200) + '...',
                    createdAt: item.job.createdAt,
                    applicants: item.job.applications?.length || 0
                },
                score: {
                    total: Math.round(item.finalScore),
                    content: Math.round(item.contentScore || 0),
                    collaborative: item.collaborativeScore || 0,
                    recency: item.recencyBoost || 0
                },
                matchLevel: item.matchLevel,
                reasons: item.reasons || [],
                source
            };
        });

        // Calculate statistics
        const stats = {
            total: recommendations.length,
            sources: {
                contentBased: recommendations.filter(r => r.source === 'content-based').length,
                collaborative: recommendations.filter(r => r.source === 'collaborative').length,
                hybrid: recommendations.filter(r => r.source === 'hybrid').length
            },
            avgScore: recommendations.length > 0
                ? Math.round(recommendations.reduce((sum, r) => sum + r.score.total, 0) / recommendations.length)
                : 0,
            userProfile: {
                skillsCount: userProfile.profile?.skills?.length || 0,
                experience: userProfile.profile?.experience?.totalYears || 0,
                completedAssessments: completedAssessments.length,
                totalApplications: applicationHistory.totalApplications || 0
            }
        };

        return { recommendations, stats };

    } catch (error) {
        console.error('Error generating recommendations:', error);
        throw error;
    }
};

export default {
    getJobRecommendations,
    analyzeApplicationHistory,
    analyzeSavedSearches,
    analyzeSearchHistory,
    findSimilarUsers
};
