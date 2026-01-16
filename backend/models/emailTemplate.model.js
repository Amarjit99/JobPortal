import mongoose from "mongoose";

const emailTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    subject: {
        type: String,
        required: true
    },
    htmlBody: {
        type: String,
        required: true
    },
    textBody: {
        type: String // Plain text version for email clients that don't support HTML
    },
    category: {
        type: String,
        required: true,
        enum: [
            'verification',
            'password-reset',
            'job-alert',
            'application-update',
            'interview-invitation',
            'job-posted',
            'profile-update',
            'welcome',
            'notification',
            'other'
        ]
    },
    variables: [{
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        example: {
            type: String,
            required: true
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    isDefault: {
        type: Boolean,
        default: false // System default templates cannot be deleted
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Helper method to render template with variables
emailTemplateSchema.methods.render = function(data = {}) {
    let html = this.htmlBody;
    let subject = this.subject;
    let text = this.textBody || '';

    // Replace variables in format {{variableName}}
    Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, data[key] || '');
        subject = subject.replace(regex, data[key] || '');
        text = text.replace(regex, data[key] || '');
    });

    return { html, subject, text };
};

export const EmailTemplate = mongoose.model("EmailTemplate", emailTemplateSchema);
