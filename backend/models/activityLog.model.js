import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            // User management
            'user_blocked',
            'user_unblocked',
            'user_role_changed',
            'user_deleted',
            // Company verification
            'company_approved',
            'company_rejected',
            // Job moderation
            'job_approved',
            'job_rejected',
            'job_flagged',
            'job_deleted',
            // Application actions
            'application_status_changed',
            // Sub-admin management
            'subadmin_created',
            'subadmin_updated',
            'subadmin_deleted',
            // Other
            'settings_changed',
            'bulk_action_performed'
        ]
    },
    targetType: {
        type: String,
        required: true,
        enum: ['User', 'Company', 'Job', 'Application', 'SubAdmin', 'Settings']
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    targetName: {
        type: String // For quick reference (e.g., user name, company name)
    },
    details: mongoose.Schema.Types.Mixed, // Flexible field for additional context
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    status: {
        type: String,
        enum: ['success', 'failed'],
        default: 'success'
    }
}, { timestamps: true });

// Indexes for efficient querying
activityLogSchema.index({ performedBy: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ targetType: 1, targetId: 1 });
activityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
