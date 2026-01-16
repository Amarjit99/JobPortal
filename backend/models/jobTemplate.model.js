import mongoose from "mongoose";

const jobTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    template: {
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
            type: Number
        },
        location: {
            type: String
        },
        jobType: {
            type: String
        },
        experienceLevel: {
            type: Number
        },
        position: {
            type: Number,
            default: 1
        },
        skills: [{
            type: String
        }],
        screeningQuestions: [{
            question: String,
            answerType: {
                type: String,
                enum: ['text', 'multipleChoice', 'yesNo']
            },
            required: Boolean,
            options: [String]
        }]
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false // Private to creator by default
    },
    usageCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Indexes
jobTemplateSchema.index({ createdBy: 1 });
jobTemplateSchema.index({ name: 'text' });

export const JobTemplate = mongoose.model("JobTemplate", jobTemplateSchema);
