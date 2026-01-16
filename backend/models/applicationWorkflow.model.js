import mongoose from 'mongoose';

const workflowStageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    order: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['screening', 'assessment', 'interview', 'offer', 'hired', 'rejected', 'custom'],
        default: 'custom'
    },
    isRequired: {
        type: Boolean,
        default: true
    },
    autoTransition: {
        enabled: { type: Boolean, default: false },
        conditions: [{
            field: String, // e.g., 'assessmentScore', 'daysInStage'
            operator: {
                type: String,
                enum: ['equals', 'greaterThan', 'lessThan', 'contains']
            },
            value: mongoose.Schema.Types.Mixed
        }],
        targetStage: String,
        delayDays: { type: Number, default: 0 }
    },
    notifications: [{
        trigger: {
            type: String,
            enum: ['onEntry', 'onExit', 'afterDays']
        },
        daysDelay: { type: Number, default: 0 },
        recipients: [{
            type: String,
            enum: ['applicant', 'recruiter', 'hiring-manager', 'team']
        }],
        template: String,
        subject: String,
        body: String
    }],
    actions: [{
        type: {
            type: String,
            enum: ['sendEmail', 'createTask', 'webhook', 'updateField']
        },
        config: mongoose.Schema.Types.Mixed
    }]
});

const applicationWorkflowSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    },
    stages: [workflowStageSchema],
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    webhooks: [{
        event: {
            type: String,
            enum: ['application_received', 'stage_changed', 'application_completed', 'application_rejected']
        },
        url: String,
        method: {
            type: String,
            enum: ['POST', 'PUT'],
            default: 'POST'
        },
        headers: mongoose.Schema.Types.Mixed,
        isActive: { type: Boolean, default: true }
    }],
    statistics: {
        applicationsProcessed: { type: Number, default: 0 },
        averageCompletionDays: { type: Number, default: 0 },
        stageConversionRates: mongoose.Schema.Types.Mixed
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Indexes
applicationWorkflowSchema.index({ company: 1, isActive: 1 });
applicationWorkflowSchema.index({ job: 1 });
applicationWorkflowSchema.index({ isDefault: 1, company: 1 });

export const ApplicationWorkflow = mongoose.model('ApplicationWorkflow', applicationWorkflowSchema);
