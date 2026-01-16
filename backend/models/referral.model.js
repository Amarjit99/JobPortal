import mongoose from 'mongoose';
import crypto from 'crypto';

const referralSchema = new mongoose.Schema({
    referrer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    referralCode: {
        type: String,
        unique: true,
        required: true
    },
    referredUsers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        registeredAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['registered', 'verified', 'active', 'hired'],
            default: 'registered'
        },
        rewardEarned: {
            type: Number,
            default: 0
        }
    }],
    totalRewards: {
        type: Number,
        default: 0
    },
    rewardsRedeemed: {
        type: Number,
        default: 0
    },
    rewardsAvailable: {
        type: Number,
        default: 0
    },
    statistics: {
        totalReferrals: { type: Number, default: 0 },
        successfulReferrals: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Indexes
referralSchema.index({ referrer: 1 });
referralSchema.index({ referralCode: 1 });
referralSchema.index({ 'referredUsers.user': 1 });
referralSchema.index({ totalRewards: -1 });

// Generate unique referral code
referralSchema.statics.generateCode = function() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Update statistics
referralSchema.methods.updateStatistics = function() {
    this.statistics.totalReferrals = this.referredUsers.length;
    this.statistics.successfulReferrals = this.referredUsers.filter(r => 
        ['verified', 'active', 'hired'].includes(r.status)
    ).length;
    this.statistics.conversionRate = this.statistics.totalReferrals > 0
        ? ((this.statistics.successfulReferrals / this.statistics.totalReferrals) * 100).toFixed(2)
        : 0;
    this.rewardsAvailable = this.totalRewards - this.rewardsRedeemed;
    return this.save();
};

export const Referral = mongoose.model('Referral', referralSchema);
