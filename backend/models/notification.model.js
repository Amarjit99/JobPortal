import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        required: true,
        enum: [
            'application_received',
            'application_status',
            'application_viewed',
            'interview_invitation',
            'interview_reminder',
            'interview_accepted',
            'interview_declined',
            'interview_rescheduled',
            'interview_cancelled',
            'interview_feedback',
            'message_received',
            'job_alert',
            'job_posted',
            'job_expired',
            'assessment_assigned',
            'assessment_completed',
            'offer_received',
            'offer_accepted',
            'offer_declined',
            'payment_received',
            'subscription_expiring',
            'subscription_expired',
            'resume_unlocked',
            'profile_viewed',
            'company_verified',
            'job_approved',
            'job_rejected',
            'referral_reward',
            'system_announcement',
            'maintenance_scheduled',
            'security_alert'
        ]
    },
    title: {
        type: String,
        required: true
    },
    message: {
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
    relatedInterview: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewInvitation'
    },
    relatedMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    relatedCompany: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    relatedAssessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment'
    },
    // Action link for notification click
    actionUrl: {
        type: String
    },
    actionText: {
        type: String,
        default: 'View'
    },
    // Priority level
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    // Status
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: {
        type: Date
    },
    // Delivery status
    deliveryChannel: {
        type: String,
        enum: ['in-app', 'email', 'sms', 'push'],
        default: 'in-app'
    },
    deliveryStatus: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed'],
        default: 'pending'
    },
    deliveredAt: {
        type: Date
    },
    // Additional metadata
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    // For grouped notifications
    groupKey: {
        type: String,
        index: true
    },
    groupCount: {
        type: Number,
        default: 1
    },
    // Expiration (optional)
    expiresAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, priority: 1, isRead: 1 });
notificationSchema.index({ groupKey: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const diff = now - this.createdAt;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
});

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
    if (!this.isRead) {
        this.isRead = true;
        this.readAt = new Date();
        await this.save();
    }
    return this;
};

// Method to archive notification
notificationSchema.methods.archive = async function() {
    if (!this.isArchived) {
        this.isArchived = true;
        this.archivedAt = new Date();
        await this.save();
    }
    return this;
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = async function(userId) {
    return await this.countDocuments({
        recipient: userId,
        isRead: false,
        isArchived: false
    });
};

// Static method to get unread count by type
notificationSchema.statics.getUnreadCountByType = async function(userId) {
    const results = await this.aggregate([
        {
            $match: {
                recipient: mongoose.Types.ObjectId(userId),
                isRead: false,
                isArchived: false
            }
        },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 }
            }
        }
    ]);

    return results.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
    }, {});
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = async function(userId, filters = {}) {
    const query = {
        recipient: userId,
        isRead: false,
        ...filters
    };

    return await this.updateMany(query, {
        isRead: true,
        readAt: new Date()
    });
};

// Static method to create notification with grouping
notificationSchema.statics.createNotification = async function(notificationData) {
    const { groupKey, recipient, type } = notificationData;

    // Check for existing notification in the same group (last 5 minutes)
    if (groupKey) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const existingNotification = await this.findOne({
            recipient,
            type,
            groupKey,
            createdAt: { $gte: fiveMinutesAgo },
            isRead: false
        });

        if (existingNotification) {
            // Update existing notification
            existingNotification.groupCount += 1;
            existingNotification.message = notificationData.message || existingNotification.message;
            existingNotification.createdAt = new Date(); // Update timestamp
            await existingNotification.save();
            return existingNotification;
        }
    }

    // Create new notification
    return await this.create(notificationData);
};

// Static method to clean up old archived notifications
notificationSchema.statics.cleanupOldNotifications = async function(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await this.deleteMany({
        isArchived: true,
        archivedAt: { $lte: cutoffDate }
    });
};

// Pre-save middleware to set delivery status
notificationSchema.pre('save', function(next) {
    if (this.isNew) {
        this.deliveryStatus = 'sent';
        this.deliveredAt = new Date();
    }
    next();
});

export const Notification = mongoose.model('Notification', notificationSchema);
