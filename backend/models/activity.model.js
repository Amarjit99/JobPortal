import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            // Profile activities
            'profile_updated',
            'profile_viewed',
            'resume_uploaded',
            'resume_updated',
            'skill_added',
            'certification_added',
            'education_added',
            'experience_added',
            // Job activities
            'job_viewed',
            'job_saved',
            'job_applied',
            'job_posted',
            'job_updated',
            'job_deleted',
            // Application activities
            'application_submitted',
            'application_withdrawn',
            'application_viewed',
            'application_status_changed',
            // Interview activities
            'interview_scheduled',
            'interview_accepted',
            'interview_declined',
            'interview_completed',
            'interview_feedback_submitted',
            // Assessment activities
            'assessment_started',
            'assessment_completed',
            'assessment_passed',
            'assessment_failed',
            // Messaging activities
            'message_sent',
            'conversation_started',
            // Company activities
            'company_followed',
            'company_unfollowed',
            'company_profile_updated',
            // Search activities
            'job_searched',
            'candidate_searched',
            'saved_search_created',
            // Payment activities
            'payment_made',
            'subscription_purchased',
            'subscription_renewed',
            'subscription_cancelled',
            // Other activities
            'login',
            'logout',
            'password_changed',
            '2fa_enabled',
            '2fa_disabled',
            'referral_sent',
            'referral_completed'
        ],
        index: true
    },
    description: {
        type: String,
        required: true
    },
    // Related entities
    relatedJob: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    },
    relatedApplication: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application'
    },
    relatedCompany: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    relatedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    relatedInterview: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewInvitation'
    },
    relatedAssessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment'
    },
    // Metadata
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    // Device & location info
    ipAddress: String,
    userAgent: String,
    device: String,
    browser: String,
    location: {
        city: String,
        country: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    // Visibility
    isPublic: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
activitySchema.index({ user: 1, type: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });
activitySchema.index({ relatedCompany: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

// TTL index - delete activities older than 1 year
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Virtual for time ago
activitySchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const diff = now - this.createdAt;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
});

// Static method to log activity
activitySchema.statics.logActivity = async function(activityData) {
    try {
        return await this.create(activityData);
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw error - activity logging shouldn't break main flow
        return null;
    }
};

// Static method to get user activity stats
activitySchema.statics.getUserStats = async function(userId, startDate, endDate) {
    const match = {
        user: mongoose.Types.ObjectId(userId),
        createdAt: {
            $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            ...(endDate && { $lte: endDate })
        }
    };

    const stats = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]);

    const totalActivities = await this.countDocuments(match);

    return {
        totalActivities,
        byType: stats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {})
    };
};

// Static method to get company activity (for recruiters)
activitySchema.statics.getCompanyActivity = async function(companyId, startDate, endDate) {
    const match = {
        relatedCompany: mongoose.Types.ObjectId(companyId),
        createdAt: {
            $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            ...(endDate && { $lte: endDate })
        }
    };

    const activities = await this.find(match)
        .populate('user', 'fullname profile.profilePhoto')
        .populate('relatedJob', 'title')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

    return activities;
};

// Static method to get activity timeline with grouping
activitySchema.statics.getTimeline = async function(userId, options = {}) {
    const {
        limit = 50,
        skip = 0,
        types = [],
        startDate,
        endDate
    } = options;

    const match = {
        user: mongoose.Types.ObjectId(userId),
        isPublic: true
    };

    if (types.length > 0) {
        match.type = { $in: types };
    }

    if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const activities = await this.find(match)
        .populate('relatedJob', 'title company')
        .populate('relatedCompany', 'name logo')
        .populate('relatedUser', 'fullname profile.profilePhoto')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await this.countDocuments(match);

    // Group activities by date
    const grouped = activities.reduce((acc, activity) => {
        const date = new Date(activity.createdAt).toDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(activity);
        return acc;
    }, {});

    return {
        activities,
        grouped,
        total,
        hasMore: skip + activities.length < total
    };
};

export const Activity = mongoose.model('Activity', activitySchema);
