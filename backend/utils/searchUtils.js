import crypto from 'crypto';

/**
 * Calculate relevance score for job matching
 * @param {Object} job - Job document
 * @param {Object} searchParams - Search parameters
 * @returns {number} Relevance score (0-100)
 */
export const calculateRelevanceScore = (job, searchParams) => {
    let score = 0;
    let maxScore = 0;

    // Skills matching (40 points max)
    if (searchParams.skills && searchParams.skills.length > 0) {
        maxScore += 40;
        const jobSkills = job.requirements || [];
        const searchSkills = searchParams.skills.map(s => s.toLowerCase());
        
        if (searchParams.skillsMatchType === 'all') {
            // All skills must match
            const matchedCount = searchSkills.filter(skill => 
                jobSkills.some(req => req.toLowerCase().includes(skill))
            ).length;
            score += (matchedCount / searchSkills.length) * 40;
        } else {
            // Any skill matches
            const uniqueMatches = new Set();
            searchSkills.forEach(skill => {
                if (jobSkills.some(req => req.toLowerCase().includes(skill))) {
                    uniqueMatches.add(skill);
                }
            });
            score += (uniqueMatches.size / searchSkills.length) * 40;
        }
    }

    // Title/Description keyword matching (25 points max)
    if (searchParams.keyword) {
        maxScore += 25;
        const keyword = searchParams.keyword.toLowerCase();
        const title = (job.title || '').toLowerCase();
        const description = (job.description || '').toLowerCase();
        
        let keywordScore = 0;
        if (title.includes(keyword)) keywordScore += 15;
        else if (title.split(' ').some(word => keyword.includes(word))) keywordScore += 8;
        
        if (description.includes(keyword)) keywordScore += 10;
        else if (description.split(' ').filter(word => keyword.includes(word)).length > 2) keywordScore += 5;
        
        score += keywordScore;
    }

    // Experience level matching (15 points max)
    if (searchParams.experienceLevel && searchParams.experienceLevel.length > 0) {
        maxScore += 15;
        if (job.experienceLevel && searchParams.experienceLevel.includes(job.experienceLevel)) {
            score += 15;
        }
    }

    // Salary range matching (10 points max)
    if (searchParams.minSalary || searchParams.maxSalary) {
        maxScore += 10;
        const jobSalary = job.salary || 0;
        
        if (jobSalary > 0) {
            if (searchParams.minSalary && jobSalary >= searchParams.minSalary) {
                score += 5;
            }
            if (searchParams.maxSalary && jobSalary <= searchParams.maxSalary) {
                score += 5;
            }
        }
    }

    // Job type matching (5 points max)
    if (searchParams.jobType) {
        maxScore += 5;
        if (job.jobType === searchParams.jobType) {
            score += 5;
        }
    }

    // Company verification bonus (5 points max)
    if (searchParams.verifiedCompaniesOnly) {
        maxScore += 5;
        if (job.company?.verification?.status === 'approved') {
            score += 5;
        }
    }

    // Normalize to 0-100 scale
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
};

/**
 * Build MongoDB query from search parameters
 * @param {Object} searchParams - Search parameters
 * @returns {Object} MongoDB query object
 */
export const buildSearchQuery = (searchParams) => {
    const query = {
        isActive: true,
        'moderation.status': { $ne: 'rejected' }
    };

    // Keyword search in title and description
    if (searchParams.keyword) {
        query.$or = [
            { title: { $regex: searchParams.keyword, $options: 'i' } },
            { description: { $regex: searchParams.keyword, $options: 'i' } }
        ];
    }

    // Skills matching
    if (searchParams.skills && searchParams.skills.length > 0) {
        if (searchParams.skillsMatchType === 'all') {
            // All skills must be present
            query.requirements = { $all: searchParams.skills.map(s => new RegExp(s, 'i')) };
        } else {
            // Any skill matches
            query.requirements = { $in: searchParams.skills.map(s => new RegExp(s, 'i')) };
        }
    }

    // Location search
    if (searchParams.location) {
        query.location = { $regex: searchParams.location, $options: 'i' };
    }

    // Salary range
    if (searchParams.minSalary || searchParams.maxSalary) {
        query.salary = {};
        if (searchParams.minSalary) {
            query.salary.$gte = searchParams.minSalary;
        }
        if (searchParams.maxSalary) {
            query.salary.$lte = searchParams.maxSalary;
        }
    }

    // Job type
    if (searchParams.jobType) {
        query.jobType = searchParams.jobType;
    }

    // Experience level
    if (searchParams.experienceLevel && searchParams.experienceLevel.length > 0) {
        query.experienceLevel = { $in: searchParams.experienceLevel };
    }

    // Posted within timeframe
    if (searchParams.postedWithin && searchParams.postedWithin !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (searchParams.postedWithin) {
            case '24h':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
        }
        
        if (startDate) {
            query.createdAt = { $gte: startDate };
        }
    }

    // Verified companies only
    if (searchParams.verifiedCompaniesOnly) {
        query['company.verification.status'] = 'approved';
    }

    return query;
};

/**
 * Generate hash for search query (for deduplication)
 * @param {Object} searchParams - Search parameters
 * @returns {string} Hash string
 */
export const generateSearchHash = (searchParams) => {
    const normalized = {
        keyword: searchParams.keyword?.toLowerCase() || '',
        skills: (searchParams.skills || []).map(s => s.toLowerCase()).sort(),
        location: searchParams.location?.toLowerCase() || '',
        minSalary: searchParams.minSalary || 0,
        maxSalary: searchParams.maxSalary || 0,
        jobType: searchParams.jobType || '',
        experienceLevel: (searchParams.experienceLevel || []).sort()
    };
    
    const str = JSON.stringify(normalized);
    return crypto.createHash('md5').update(str).digest('hex');
};

/**
 * Record search in history
 * @param {Object} SearchHistory - SearchHistory model
 * @param {string} userId - User ID
 * @param {Object} searchParams - Search parameters
 * @param {number} resultsCount - Number of results found
 * @param {Object} req - Express request object
 */
export const recordSearchHistory = async (SearchHistory, userId, searchParams, resultsCount, req) => {
    try {
        const queryHash = generateSearchHash(searchParams);
        
        const searchHistory = new SearchHistory({
            userId,
            searchQuery: {
                keywords: searchParams.keyword,
                skills: searchParams.skills,
                location: searchParams.location,
                salaryMin: searchParams.minSalary,
                salaryMax: searchParams.maxSalary,
                jobType: searchParams.jobType,
                experienceLevel: searchParams.experienceLevel,
                verifiedOnly: searchParams.verifiedCompaniesOnly
            },
            queryHash,
            resultsCount,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            sessionId: req.sessionID
        });
        
        await searchHistory.save();
        return searchHistory;
    } catch (error) {
        console.error('Error recording search history:', error);
        return null;
    }
};
