import mongoose from 'mongoose';

const emailCampaignSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    template: {
        type: String,
        required: true // HTML template
    },
    segments: [{
        type: String,
        enum: ['all-users', 'students', 'recruiters', 'active-applicants', 'inactive-users', 'verified-companies', 'custom']
    }],
    customSegmentFilters: {
        roles: [String],
        locations: [String],
        skills: [String],
        lastLoginBefore: Date,
        lastLoginAfter: Date,
        registeredAfter: Date,
        hasApplied: Boolean
    },
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'],
        default: 'draft'
    },
    scheduledAt: Date,
    sentAt: Date,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetCount: {
        type: Number,
        default: 0
    },
    sentCount: {
        type: Number,
        default: 0
    },
    deliveredCount: {
        type: Number,
        default: 0
    },
    openedCount: {
        type: Number,
        default: 0
    },
    clickedCount: {
        type: Number,
        default: 0
    },
    bouncedCount: {
        type: Number,
        default: 0
    },
    unsubscribedCount: {
        type: Number,
        default: 0
    },
    abTest: {
        enabled: { type: Boolean, default: false },
        variantA: {
            subject: String,
            template: String,
            percentage: { type: Number, default: 50 }
        },
        variantB: {
            subject: String,
            template: String,
            percentage: { type: Number, default: 50 }
        },
        winningMetric: {
            type: String,
            enum: ['open-rate', 'click-rate'],
            default: 'open-rate'
        }
    },
    tags: [String],
    notes: String
}, { timestamps: true });

// Indexes
emailCampaignSchema.index({ createdBy: 1, status: 1 });
emailCampaignSchema.index({ scheduledAt: 1 });
emailCampaignSchema.index({ status: 1, scheduledAt: 1 });
emailCampaignSchema.index({ tags: 1 });

// Virtual: Open rate
emailCampaignSchema.virtual('openRate').get(function() {
    return this.deliveredCount > 0 ? ((this.openedCount / this.deliveredCount) * 100).toFixed(2) : 0;
});

// Virtual: Click rate
emailCampaignSchema.virtual('clickRate').get(function() {
    return this.deliveredCount > 0 ? ((this.clickedCount / this.deliveredCount) * 100).toFixed(2) : 0;
});

// Virtual: Bounce rate
emailCampaignSchema.virtual('bounceRate').get(function() {
    return this.sentCount > 0 ? ((this.bouncedCount / this.sentCount) * 100).toFixed(2) : 0;
});

emailCampaignSchema.set('toJSON', { virtuals: true });
emailCampaignSchema.set('toObject', { virtuals: true });

export const EmailCampaign = mongoose.model('EmailCampaign', emailCampaignSchema);
