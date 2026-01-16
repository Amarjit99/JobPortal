import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    searchQuery: {
        // Store the actual search parameters used
        keywords: String,
        skills: [String],
        location: String,
        salaryMin: Number,
        salaryMax: Number,
        jobType: [String],
        experienceLevel: [String],
        verifiedOnly: Boolean
    },
    // Serialized query string for deduplication
    queryHash: {
        type: String,
        index: true
    },
    resultsCount: {
        type: Number,
        default: 0
    },
    // Track if user clicked on any result
    hasInteraction: {
        type: Boolean,
        default: false
    },
    clickedJobs: [{
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job'
        },
        clickedAt: Date
    }],
    // IP and user agent for analytics
    ipAddress: String,
    userAgent: String,
    // Session tracking
    sessionId: String
}, {
    timestamps: true
});

// Compound indexes for efficient queries
searchHistorySchema.index({ userId: 1, createdAt: -1 });
searchHistorySchema.index({ userId: 1, queryHash: 1 });
searchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // Auto-delete after 90 days

// Method to record job click
searchHistorySchema.methods.recordClick = function(jobId) {
    this.hasInteraction = true;
    this.clickedJobs.push({
        jobId,
        clickedAt: new Date()
    });
    return this.save();
};

// Static method to get popular searches
searchHistorySchema.statics.getPopularSearches = function(limit = 10) {
    return this.aggregate([
        {
            $match: {
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
            }
        },
        {
            $group: {
                _id: '$queryHash',
                count: { $sum: 1 },
                sampleQuery: { $first: '$searchQuery' },
                avgResults: { $avg: '$resultsCount' }
            }
        },
        {
            $match: {
                count: { $gte: 5 } // Minimum 5 searches
            }
        },
        {
            $sort: { count: -1 }
        },
        {
            $limit: limit
        }
    ]);
};

// Static method to get user's recent searches
searchHistorySchema.statics.getUserRecentSearches = function(userId, limit = 10) {
    return this.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('searchQuery resultsCount createdAt hasInteraction')
        .lean();
};

// Static method to get trending skills
searchHistorySchema.statics.getTrendingSkills = function(days = 7) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return this.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
                'searchQuery.skills': { $exists: true, $ne: [] }
            }
        },
        {
            $unwind: '$searchQuery.skills'
        },
        {
            $group: {
                _id: '$searchQuery.skills',
                searchCount: { $sum: 1 },
                avgResults: { $avg: '$resultsCount' }
            }
        },
        {
            $sort: { searchCount: -1 }
        },
        {
            $limit: 20
        }
    ]);
};

export const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);
