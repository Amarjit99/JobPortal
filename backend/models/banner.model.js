import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    subtitle: {
        type: String,
        trim: true,
        maxlength: 200
    },
    image: {
        type: String,
        required: true
    },
    link: {
        type: String,
        trim: true
    },
    linkText: {
        type: String,
        trim: true,
        default: 'Learn More'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    backgroundColor: {
        type: String,
        default: '#ffffff'
    },
    textColor: {
        type: String,
        default: '#000000'
    },
    targetAudience: {
        type: String,
        enum: ['all', 'job-seekers', 'recruiters'],
        default: 'all'
    },
    clicks: {
        type: Number,
        default: 0
    },
    impressions: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Index for efficient queries
bannerSchema.index({ isActive: 1, displayOrder: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

// Virtual to check if banner is currently active based on dates
bannerSchema.virtual('isCurrentlyActive').get(function() {
    const now = new Date();
    const isWithinDateRange = (!this.startDate || this.startDate <= now) &&
                              (!this.endDate || this.endDate >= now);
    return this.isActive && isWithinDateRange;
});

// Method to increment impressions
bannerSchema.methods.recordImpression = function() {
    this.impressions += 1;
    return this.save();
};

// Method to increment clicks
bannerSchema.methods.recordClick = function() {
    this.clicks += 1;
    return this.save();
};

// Static method to get active banners
bannerSchema.statics.getActiveBanners = function(targetAudience = 'all') {
    const now = new Date();
    const query = {
        isActive: true,
        $or: [
            { startDate: { $lte: now }, endDate: { $gte: now } },
            { startDate: { $lte: now }, endDate: null },
            { startDate: null, endDate: { $gte: now } },
            { startDate: null, endDate: null }
        ]
    };
    
    if (targetAudience !== 'all') {
        query.$or = [
            { targetAudience: 'all' },
            { targetAudience }
        ];
    }
    
    return this.find(query).sort({ displayOrder: 1, createdAt: -1 });
};

export const Banner = mongoose.model("Banner", bannerSchema);
