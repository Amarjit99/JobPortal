import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    requirements: [{
        type: String
    }],
    salary: {
        type: Number,
        required: true
    },
    experienceLevel:{
        type:Number,
        required:true,
    },
    location: {
        type: String,
        required: true
    },
    jobType: {
        type: String,
        required: true
    },
    position: {
        type: Number,
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    applications: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Application',
        }
    ],
    screeningQuestions: [{
        question: {
            type: String,
            required: true
        },
        answerType: {
            type: String,
            enum: ['text', 'multipleChoice', 'yesNo'],
            default: 'text'
        },
        required: {
            type: Boolean,
            default: false
        },
        options: [{
            type: String
        }] // For multipleChoice type
    }],
    isDraft: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        default: function() {
            // Default expiry: 30 days from creation
            return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    moderation: {
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'flagged'],
            default: 'pending'
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reviewedAt: {
            type: Date
        },
        rejectionReason: {
            type: String
        },
        autoApproved: {
            type: Boolean,
            default: false
        },
        spamScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        qualityScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    reports: [{
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        reason: {
            type: String,
            enum: ['spam', 'inappropriate', 'fraud', 'duplicate', 'other'],
            required: true
        },
        description: {
            type: String
        },
        status: {
            type: String,
            enum: ['pending', 'resolved', 'dismissed'],
            default: 'pending'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Featured Job Fields
    isFeatured: {
        type: Boolean,
        default: false
    },
    featuredUntil: {
        type: Date
    },
    highlightColor: {
        type: String,
        default: '#F83002'
    },
    badge: {
        type: String,
        enum: ['hot', 'urgent', 'featured', 'new', null],
        default: null
    }
},{timestamps:true});

// Indexes for performance
jobSchema.index({ title: 'text', description: 'text' }); // Text search
jobSchema.index({ company: 1 });
jobSchema.index({ created_by: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ expiresAt: 1 });
jobSchema.index({ isActive: 1 });
jobSchema.index({ isFeatured: 1, featuredUntil: 1 });

// Virtual to check if job is expired
jobSchema.virtual('isExpired').get(function() {
    return this.expiresAt && new Date() > this.expiresAt;
});

// Ensure virtuals are included in JSON
jobSchema.set('toJSON', { virtuals: true });
jobSchema.set('toObject', { virtuals: true });

export const Job = mongoose.model("Job", jobSchema);