import mongoose from "mongoose";

const savedSearchSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    searchParams: {
        keyword: String,
        location: String,
        locationRadius: {
            type: Number, // in kilometers
            default: 50,
            min: 0,
            max: 500
        },
        jobType: String,
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company'
        },
        freshness: String,
        minExperience: Number,
        maxExperience: Number,
        minSalary: Number,
        maxSalary: Number,
        // Enhanced search parameters
        skills: [{
            type: String,
            trim: true
        }],
        skillsMatchType: {
            type: String,
            enum: ['any', 'all'],
            default: 'any'
        },
        experienceLevel: [{
            type: String,
            enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Manager', 'Director']
        }],
        companySize: [{
            type: String,
            enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
        }],
        industry: [{
            type: String
        }],
        verifiedCompaniesOnly: {
            type: Boolean,
            default: false
        },
        postedWithin: {
            type: String,
            enum: ['24h', '7d', '30d', 'all'],
            default: 'all'
        }
    },
    alertsEnabled: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastNotified: {
        type: Date
    },
    matchCount: {
        type: Number,
        default: 0
    },
    lastMatchedJobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    },
    usageCount: {
        type: Number,
        default: 0
    },
    executionCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Compound index for user + name uniqueness
savedSearchSchema.index({ userId: 1, name: 1 }, { unique: true });
savedSearchSchema.index({ userId: 1, isActive: 1 });
savedSearchSchema.index({ isActive: 1, alertsEnabled: 1 });
savedSearchSchema.index({ userId: 1, createdAt: -1 });

// Method to increment execution count
savedSearchSchema.methods.recordExecution = function() {
    this.executionCount += 1;
    this.usageCount += 1;
    return this.save();
};

// Method to update last notification time
savedSearchSchema.methods.recordNotification = function(matchCount, lastJobId) {
    this.lastNotified = new Date();
    this.matchCount = matchCount;
    if (lastJobId) {
        this.lastMatchedJobId = lastJobId;
    }
    return this.save();
};

// Static method to get active searches for notifications
savedSearchSchema.statics.getActiveSearchesForNotification = function() {
    return this.find({
        isActive: true,
        alertsEnabled: true
    }).populate('userId', 'fullname email');
};

export const SavedSearch = mongoose.model("SavedSearch", savedSearchSchema);
