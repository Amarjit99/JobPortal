// Spam detection utility
// Analyzes job postings for spam indicators and returns a score 0-100

const SPAM_KEYWORDS = [
    // Financial scams
    'get rich quick', 'make money fast', 'earn from home', 'easy money', 'no experience needed',
    'guaranteed income', 'passive income', 'work from anywhere', 'unlimited earning',
    
    // MLM/Pyramid schemes
    'mlm', 'multi-level marketing', 'pyramid', 'network marketing', 'downline', 'upline',
    'residual income', 'team building opportunity',
    
    // Fraud indicators
    'wire transfer', 'western union', 'send money', 'processing fee', 'registration fee',
    'training fee required', 'pay to apply', 'advance payment',
    
    // Common spam phrases
    'urgent hiring', 'immediate start', 'no interview', 'copy paste work', 'data entry job',
    'part time income', 'click here', 'act now', 'limited slots', 'first come first serve',
    
    // Scam warnings
    'nigerian prince', 'lottery winner', 'inheritance', 'secret shopper', 'mystery shopper',
    'reshipping', 'package forwarding', 'check cashing'
];

const SUSPICIOUS_PATTERNS = {
    excessiveCaps: /[A-Z]{10,}/g,           // 10+ consecutive caps
    excessiveExclamation: /!{3,}/g,         // 3+ exclamation marks
    excessiveSymbols: /[$€£¥₹]{3,}/g,       // 3+ currency symbols
    phoneInTitle: /\d{10,}/g,               // Phone numbers in title
    emailPattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,  // Email in description
    urlPattern: /(https?:\/\/[^\s]+)/g      // External URLs
};

/**
 * Calculate spam score for a job posting
 * @param {Object} jobData - Job posting data { title, description, requirements, salary }
 * @returns {Object} { score: 0-100, indicators: [], isSpam: boolean }
 */
export const calculateSpamScore = (jobData) => {
    let score = 0;
    const indicators = [];
    
    const { title = '', description = '', requirements = [], salary = 0 } = jobData;
    const fullText = `${title} ${description} ${requirements.join(' ')}`.toLowerCase();
    
    // 1. Keyword matching (30 points max)
    let keywordMatches = 0;
    SPAM_KEYWORDS.forEach(keyword => {
        if (fullText.includes(keyword.toLowerCase())) {
            keywordMatches++;
            indicators.push(`Spam keyword: "${keyword}"`);
        }
    });
    const keywordScore = Math.min(keywordMatches * 5, 30);
    score += keywordScore;
    
    // 2. Pattern matching (40 points max)
    let patternScore = 0;
    
    // Excessive caps
    const capsMatches = (title + description).match(SUSPICIOUS_PATTERNS.excessiveCaps);
    if (capsMatches && capsMatches.length > 0) {
        patternScore += 10;
        indicators.push(`Excessive capital letters: ${capsMatches.length} instances`);
    }
    
    // Excessive exclamation marks
    const exclamationMatches = (title + description).match(SUSPICIOUS_PATTERNS.excessiveExclamation);
    if (exclamationMatches && exclamationMatches.length > 0) {
        patternScore += 8;
        indicators.push(`Excessive exclamation marks: ${exclamationMatches.length} instances`);
    }
    
    // Currency symbols spam
    const symbolMatches = (title + description).match(SUSPICIOUS_PATTERNS.excessiveSymbols);
    if (symbolMatches && symbolMatches.length > 0) {
        patternScore += 8;
        indicators.push(`Excessive currency symbols: ${symbolMatches.length} instances`);
    }
    
    // Phone number in title (suspicious)
    const phoneMatches = title.match(SUSPICIOUS_PATTERNS.phoneInTitle);
    if (phoneMatches) {
        patternScore += 7;
        indicators.push('Phone number in job title');
    }
    
    // Email in description (suspicious)
    const emailMatches = description.match(SUSPICIOUS_PATTERNS.emailPattern);
    if (emailMatches && emailMatches.length > 0) {
        patternScore += 7;
        indicators.push(`Email address in description: ${emailMatches.length} found`);
    }
    
    score += Math.min(patternScore, 40);
    
    // 3. Content quality checks (30 points max)
    let qualityScore = 0;
    
    // Too short description (< 50 chars)
    if (description.length < 50) {
        qualityScore += 10;
        indicators.push('Description too short (< 50 characters)');
    }
    
    // Too short title (< 5 chars)
    if (title.length < 5) {
        qualityScore += 10;
        indicators.push('Title too short (< 5 characters)');
    }
    
    // No requirements specified
    if (!requirements || requirements.length === 0) {
        qualityScore += 5;
        indicators.push('No job requirements specified');
    }
    
    // Unrealistic salary (0 or > 10 crore)
    if (salary === 0 || salary > 10000) {
        qualityScore += 5;
        indicators.push('Unrealistic salary range');
    }
    
    score += Math.min(qualityScore, 30);
    
    // Cap score at 100
    score = Math.min(score, 100);
    
    return {
        score: Math.round(score),
        indicators,
        isSpam: score >= 60,  // Threshold: 60+ is likely spam
        riskLevel: score >= 80 ? 'high' : score >= 60 ? 'medium' : score >= 40 ? 'low' : 'none'
    };
};

/**
 * Check for duplicate jobs
 * @param {Object} jobData - New job data
 * @param {Array} existingJobs - Array of existing jobs from same company
 * @returns {Object} { isDuplicate: boolean, matchedJob: Object|null, similarity: 0-100 }
 */
export const checkDuplicateJob = (jobData, existingJobs) => {
    if (!existingJobs || existingJobs.length === 0) {
        return { isDuplicate: false, matchedJob: null, similarity: 0 };
    }
    
    const { title, description, location, salary } = jobData;
    
    for (const existingJob of existingJobs) {
        let similarity = 0;
        
        // Title match (40 points)
        if (existingJob.title.toLowerCase() === title.toLowerCase()) {
            similarity += 40;
        } else if (existingJob.title.toLowerCase().includes(title.toLowerCase()) || 
                   title.toLowerCase().includes(existingJob.title.toLowerCase())) {
            similarity += 20;
        }
        
        // Description similarity (30 points) - simple word overlap
        const descWords = new Set(description.toLowerCase().split(/\s+/));
        const existingWords = new Set(existingJob.description.toLowerCase().split(/\s+/));
        const commonWords = [...descWords].filter(word => existingWords.has(word));
        const overlapRatio = commonWords.length / Math.max(descWords.size, existingWords.size);
        similarity += Math.round(overlapRatio * 30);
        
        // Location match (15 points)
        if (existingJob.location.toLowerCase() === location.toLowerCase()) {
            similarity += 15;
        }
        
        // Salary match (15 points)
        if (existingJob.salary === salary) {
            similarity += 15;
        }
        
        // If similarity > 70%, likely duplicate
        if (similarity >= 70) {
            return {
                isDuplicate: true,
                matchedJob: existingJob,
                similarity
            };
        }
    }
    
    return { isDuplicate: false, matchedJob: null, similarity: 0 };
};

export default {
    calculateSpamScore,
    checkDuplicateJob
};
