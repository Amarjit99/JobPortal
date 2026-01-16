import { User } from '../models/user.model.js';

/**
 * Calculate profile completion percentage for a user
 * @param {Object} user - User object
 * @returns {Object} - { percentage, missingFields, completedFields }
 */
export const calculateProfileCompletion = (user) => {
    const fields = {
        // Basic Information (30 points total)
        fullname: { weight: 5, value: !!user.fullname },
        email: { weight: 5, value: !!user.email },
        phoneNumber: { weight: 5, value: !!user.phoneNumber },
        bio: { weight: 10, value: !!(user.profile?.bio && user.profile.bio.length >= 50) },
        profilePhoto: { weight: 5, value: !!user.profile?.profilePhoto },
        
        // Skills & Resume (25 points total)
        skills: { weight: 10, value: !!(user.profile?.skills && user.profile.skills.length >= 3) },
        resume: { weight: 15, value: !!(user.resumes && user.resumes.length > 0) },
        
        // Education (15 points total)
        education: { weight: 15, value: !!(user.education && user.education.length > 0) },
        
        // Work Experience (15 points total)
        experience: { weight: 15, value: !!(user.experience && user.experience.length > 0) },
        
        // Additional Information (15 points total)
        certifications: { weight: 5, value: !!(user.certifications && user.certifications.length > 0) },
        preferredLocations: { weight: 5, value: !!(user.preferredJobLocations && user.preferredJobLocations.length > 0) },
        expectedSalary: { weight: 5, value: !!(user.expectedSalary && user.expectedSalary.min) },
    };

    const completedFields = [];
    const missingFields = [];
    let totalWeight = 0;
    let achievedWeight = 0;

    for (const [fieldName, fieldData] of Object.entries(fields)) {
        totalWeight += fieldData.weight;
        if (fieldData.value) {
            achievedWeight += fieldData.weight;
            completedFields.push(fieldName);
        } else {
            missingFields.push(fieldName);
        }
    }

    const percentage = Math.round((achievedWeight / totalWeight) * 100);

    return {
        percentage,
        completedFields,
        missingFields,
        breakdown: {
            basic: {
                total: 30,
                achieved: ['fullname', 'email', 'phoneNumber', 'bio', 'profilePhoto']
                    .reduce((acc, field) => acc + (fields[field].value ? fields[field].weight : 0), 0)
            },
            skillsAndResume: {
                total: 25,
                achieved: ['skills', 'resume']
                    .reduce((acc, field) => acc + (fields[field].value ? fields[field].weight : 0), 0)
            },
            education: {
                total: 15,
                achieved: fields.education.value ? 15 : 0
            },
            experience: {
                total: 15,
                achieved: fields.experience.value ? 15 : 0
            },
            additional: {
                total: 15,
                achieved: ['certifications', 'preferredLocations', 'expectedSalary']
                    .reduce((acc, field) => acc + (fields[field].value ? fields[field].weight : 0), 0)
            }
        }
    };
};

/**
 * Get tips for completing profile based on missing fields
 * @param {Array} missingFields - Array of missing field names
 * @returns {Array} - Array of tip objects with field, title, and description
 */
export const getProfileCompletionTips = (missingFields) => {
    const tips = {
        bio: {
            field: 'bio',
            title: 'Add a compelling bio',
            description: 'Write a short bio (50+ characters) highlighting your skills and experience. Make it engaging!',
            priority: 'high',
            points: 10
        },
        resume: {
            field: 'resume',
            title: 'Upload your resume',
            description: 'Add your latest resume in PDF format. This is the most important field for employers.',
            priority: 'critical',
            points: 15
        },
        skills: {
            field: 'skills',
            title: 'Add relevant skills',
            description: 'List at least 3 skills that match your expertise. More skills increase your visibility!',
            priority: 'high',
            points: 10
        },
        education: {
            field: 'education',
            title: 'Add education details',
            description: 'Include your educational qualifications with degree, institution, and dates.',
            priority: 'high',
            points: 15
        },
        experience: {
            field: 'experience',
            title: 'Add work experience',
            description: 'Showcase your work history with company names, job titles, and achievements.',
            priority: 'high',
            points: 15
        },
        profilePhoto: {
            field: 'profilePhoto',
            title: 'Upload profile photo',
            description: 'Add a professional profile photo to make your profile stand out.',
            priority: 'medium',
            points: 5
        },
        phoneNumber: {
            field: 'phoneNumber',
            title: 'Add phone number',
            description: 'Provide your contact number so employers can reach you easily.',
            priority: 'medium',
            points: 5
        },
        certifications: {
            field: 'certifications',
            title: 'Add certifications',
            description: 'Include any relevant certifications or training programs you\'ve completed.',
            priority: 'low',
            points: 5
        },
        preferredLocations: {
            field: 'preferredLocations',
            title: 'Set preferred locations',
            description: 'Specify where you\'d like to work to get relevant job recommendations.',
            priority: 'low',
            points: 5
        },
        expectedSalary: {
            field: 'expectedSalary',
            title: 'Set expected salary',
            description: 'Add your salary expectations to help employers match you with suitable positions.',
            priority: 'low',
            points: 5
        }
    };

    return missingFields
        .filter(field => tips[field])
        .map(field => tips[field])
        .sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
};

/**
 * Get profile completion badge based on percentage
 * @param {number} percentage - Profile completion percentage
 * @returns {Object} - Badge object with level, color, and message
 */
export const getProfileCompletionBadge = (percentage) => {
    if (percentage >= 90) {
        return {
            level: 'expert',
            color: 'emerald',
            icon: '🌟',
            message: 'Excellent! Your profile is almost perfect!',
            benefit: 'You get 3x more profile views from employers'
        };
    } else if (percentage >= 70) {
        return {
            level: 'advanced',
            color: 'blue',
            icon: '⭐',
            message: 'Great! Your profile looks good!',
            benefit: 'You get 2x more profile views from employers'
        };
    } else if (percentage >= 50) {
        return {
            level: 'intermediate',
            color: 'yellow',
            icon: '📌',
            message: 'Good start! Complete a few more sections.',
            benefit: 'Complete your profile to get more visibility'
        };
    } else {
        return {
            level: 'beginner',
            color: 'gray',
            icon: '📝',
            message: 'Let\'s complete your profile!',
            benefit: 'Completed profiles are 3x more likely to get interviews'
        };
    }
};

export default {
    calculateProfileCompletion,
    getProfileCompletionTips,
    getProfileCompletionBadge
};
