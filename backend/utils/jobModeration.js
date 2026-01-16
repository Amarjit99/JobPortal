import logger from './logger.js';

// Spam keywords for detection
const SPAM_KEYWORDS = [
    'work from home earn', 'quick money', 'easy cash', 'get rich', 'guaranteed income',
    'no experience needed', 'earn daily', 'make money fast', 'limited time offer',
    'act now', 'free money', 'risk-free', 'click here', 'congratulations',
    'investment opportunity', 'multilevel marketing', 'mlm', 'pyramid scheme',
    'send money', 'wire transfer', 'western union', 'bitcoin wallet',
    'crypto investment', 'forex trading', 'binary options', 'online survey',
    'data entry job', 'envelope stuffing', 'assembly work', 'rebate processing'
];

// Suspicious patterns
const SUSPICIOUS_PATTERNS = [
    /\$\d+k?-\$\d+k?\s*per\s*(day|hour)/i, // Unrealistic hourly/daily rates
    /earn\s*\$?\d+k?\+?\s*(daily|hourly|weekly)/i,
    /(whatsapp|telegram|email)\s*(me|us)\s*at/i, // Contact outside platform
    /contact\s*@/i,
    /(\+?\d{10,})/g, // Phone numbers
    /bit\.ly|tinyurl|goo\.gl/i, // Shortened URLs
    /(http|https):\/\/[^\s]+/g // More than 3 URLs
];

/**
 * Calculate quality score for a job posting
 * @param {Object} job - Job object
 * @returns {number} Quality score (0-100)
 */
export const calculateQualityScore = (job) => {
    try {
        let score = 0;
        
        // 1. Title quality (0-15 points)
        if (job.title) {
            const titleLength = job.title.length;
            if (titleLength >= 10 && titleLength <= 100) {
                score += 15;
            } else if (titleLength >= 5 && titleLength < 10) {
                score += 8;
            } else if (titleLength > 100) {
                score += 5;
            }
        }
        
        // 2. Description quality (0-25 points)
        if (job.description) {
            const descLength = job.description.length;
            if (descLength >= 200 && descLength <= 5000) {
                score += 25; // Detailed description
            } else if (descLength >= 100 && descLength < 200) {
                score += 15; // Adequate description
            } else if (descLength >= 50 && descLength < 100) {
                score += 8; // Brief description
            }
        }
        
        // 3. Requirements specified (0-15 points)
        if (job.requirements && Array.isArray(job.requirements)) {
            const reqCount = job.requirements.filter(r => r && r.trim().length > 0).length;
            if (reqCount >= 5) {
                score += 15;
            } else if (reqCount >= 3) {
                score += 10;
            } else if (reqCount >= 1) {
                score += 5;
            }
        }
        
        // 4. Salary information (0-15 points)
        if (job.salary) {
            if (job.salary > 0 && job.salary < 10000000) { // Reasonable salary range
                score += 15;
            } else if (job.salary > 0) {
                score += 5;
            }
        }
        
        // 5. Experience level specified (0-10 points)
        if (typeof job.experienceLevel === 'number' && job.experienceLevel >= 0) {
            score += 10;
        }
        
        // 6. Location specified (0-10 points)
        if (job.location && job.location.length >= 3) {
            score += 10;
        }
        
        // 7. Position count (0-10 points)
        if (job.position && job.position > 0 && job.position <= 100) {
            score += 10;
        }
        
        return Math.min(score, 100); // Cap at 100
    } catch (error) {
        logger.error('Error calculating quality score:', error);
        return 0;
    }
};

/**
 * Calculate spam score for a job posting
 * @param {Object} job - Job object
 * @returns {Object} { score: number (0-100), reasons: string[] }
 */
export const calculateSpamScore = (job) => {
    try {
        let spamScore = 0;
        const reasons = [];
        
        const fullText = `${job.title || ''} ${job.description || ''} ${(job.requirements || []).join(' ')}`.toLowerCase();
        
        // 1. Check for spam keywords (0-40 points)
        let keywordMatches = 0;
        SPAM_KEYWORDS.forEach(keyword => {
            if (fullText.includes(keyword.toLowerCase())) {
                keywordMatches++;
            }
        });
        
        if (keywordMatches > 0) {
            const keywordScore = Math.min(keywordMatches * 10, 40);
            spamScore += keywordScore;
            reasons.push(`Contains ${keywordMatches} spam keyword(s)`);
        }
        
        // 2. Check for suspicious patterns (0-30 points)
        let patternMatches = 0;
        SUSPICIOUS_PATTERNS.forEach(pattern => {
            if (pattern.test(fullText)) {
                patternMatches++;
            }
        });
        
        if (patternMatches > 0) {
            const patternScore = Math.min(patternMatches * 15, 30);
            spamScore += patternScore;
            reasons.push(`Contains ${patternMatches} suspicious pattern(s)`);
        }
        
        // 3. Check for excessive capitalization (0-15 points)
        if (job.title) {
            const upperCount = (job.title.match(/[A-Z]/g) || []).length;
            const upperRatio = upperCount / job.title.length;
            if (upperRatio > 0.5 && job.title.length > 10) {
                spamScore += 15;
                reasons.push('Excessive capitalization in title');
            }
        }
        
        // 4. Check for unrealistic salary (0-15 points)
        if (job.salary) {
            if (job.salary > 10000000) { // > 1 crore per month
                spamScore += 15;
                reasons.push('Unrealistic salary amount');
            } else if (job.experienceLevel === 0 && job.salary > 5000000) {
                spamScore += 10;
                reasons.push('Unrealistic salary for experience level');
            }
        }
        
        return {
            score: Math.min(spamScore, 100),
            reasons
        };
    } catch (error) {
        logger.error('Error calculating spam score:', error);
        return { score: 0, reasons: [] };
    }
};

/**
 * Determine if job should be auto-approved based on company verification and quality
 * @param {Object} job - Job object
 * @param {Object} company - Company object
 * @returns {boolean}
 */
export const shouldAutoApprove = (job, company) => {
    try {
        // Check if company is verified
        const isCompanyVerified = company?.verification?.status === 'approved';
        
        if (!isCompanyVerified) {
            return false;
        }
        
        // Calculate scores
        const qualityScore = calculateQualityScore(job);
        const { score: spamScore } = calculateSpamScore(job);
        
        // Auto-approve if:
        // - Company is verified
        // - Quality score >= 70
        // - Spam score < 30
        return qualityScore >= 70 && spamScore < 30;
    } catch (error) {
        logger.error('Error in shouldAutoApprove:', error);
        return false;
    }
};

/**
 * Moderate a job posting automatically
 * @param {Object} job - Job object
 * @param {Object} company - Company object
 * @returns {Object} Moderation result
 */
export const moderateJob = async (job, company) => {
    try {
        const qualityScore = calculateQualityScore(job);
        const { score: spamScore, reasons: spamReasons } = calculateSpamScore(job);
        
        let status = 'pending';
        let flagged = false;
        let autoApproved = false;
        
        // Determine moderation status
        if (spamScore >= 50) {
            status = 'flagged';
            flagged = true;
        } else if (shouldAutoApprove(job, company)) {
            status = 'approved';
            autoApproved = true;
        } else {
            status = 'pending';
        }
        
        return {
            status,
            qualityScore,
            spamScore,
            autoApproved,
            flagged,
            flagReasons: flagged ? spamReasons : []
        };
    } catch (error) {
        logger.error('Error in moderateJob:', error);
        return {
            status: 'pending',
            qualityScore: 0,
            spamScore: 0,
            autoApproved: false,
            flagged: false,
            flagReasons: []
        };
    }
};
