import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployerPlan',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired', 'pending'],
        default: 'pending'
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'annual'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    autoRenew: {
        type: Boolean,
        default: true
    },
    currentPeriodStart: {
        type: Date
    },
    currentPeriodEnd: {
        type: Date
    },
    cancelledAt: {
        type: Date
    },
    // Usage tracking
    usage: {
        jobPostings: {
            type: Number,
            default: 0
        },
        featuredJobs: {
            type: Number,
            default: 0
        },
        resumeCredits: {
            type: Number,
            default: 0
        }
    },
    // Payment information
    lastPaymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    stripeSubscriptionId: {
        type: String
    },
    razorpaySubscriptionId: {
        type: String
    }
}, { timestamps: true });

// Index for efficient querying
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
    return this.status === 'active' && this.endDate > new Date();
});

// Method to check if user can perform action
subscriptionSchema.methods.canPerformAction = async function(action, count = 1) {
    if (this.status !== 'active' || this.endDate < new Date()) {
        return { allowed: false, reason: 'Subscription is not active' };
    }

    const plan = await mongoose.model('EmployerPlan').findById(this.planId);
    if (!plan) {
        return { allowed: false, reason: 'Plan not found' };
    }

    switch (action) {
        case 'jobPosting':
            if (plan.limits.jobPostings === 0) return { allowed: true }; // unlimited
            if (this.usage.jobPostings + count <= plan.limits.jobPostings) {
                return { allowed: true };
            }
            return { 
                allowed: false, 
                reason: `Job posting limit reached (${this.usage.jobPostings}/${plan.limits.jobPostings})`
            };

        case 'featuredJob':
            if (plan.limits.featuredJobs === 0) return { allowed: true };
            if (this.usage.featuredJobs + count <= plan.limits.featuredJobs) {
                return { allowed: true };
            }
            return { 
                allowed: false, 
                reason: `Featured job limit reached (${this.usage.featuredJobs}/${plan.limits.featuredJobs})`
            };

        case 'resumeCredit':
            if (plan.limits.resumeCredits === 0) return { allowed: true };
            if (this.usage.resumeCredits + count <= plan.limits.resumeCredits) {
                return { allowed: true };
            }
            return { 
                allowed: false, 
                reason: `Resume credit limit reached (${this.usage.resumeCredits}/${plan.limits.resumeCredits})`
            };

        default:
            return { allowed: false, reason: 'Unknown action' };
    }
};

// Method to increment usage
subscriptionSchema.methods.incrementUsage = function(action, count = 1) {
    switch (action) {
        case 'jobPosting':
            this.usage.jobPostings += count;
            break;
        case 'featuredJob':
            this.usage.featuredJobs += count;
            break;
        case 'resumeCredit':
            this.usage.resumeCredits += count;
            break;
    }
    return this.save();
};

// Method to reset usage (for new billing cycle)
subscriptionSchema.methods.resetUsage = function() {
    this.usage = {
        jobPostings: 0,
        featuredJobs: 0,
        resumeCredits: 0
    };
    return this.save();
};

// Static method to get active subscription for user
subscriptionSchema.statics.getActiveSubscription = function(userId) {
    return this.findOne({
        userId,
        status: 'active',
        endDate: { $gt: new Date() }
    }).populate('planId');
};

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
