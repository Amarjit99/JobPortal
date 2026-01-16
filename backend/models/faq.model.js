import mongoose from "mongoose";

const faqSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    answer: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['general', 'job-seekers', 'employers', 'payments', 'technical', 'account', 'privacy'],
        default: 'general'
    },
    order: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    views: {
        type: Number,
        default: 0
    },
    helpful: {
        type: Number,
        default: 0
    },
    notHelpful: {
        type: Number,
        default: 0
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Index for efficient querying
faqSchema.index({ category: 1, order: 1 });
faqSchema.index({ isPublished: 1 });

// Method to record view
faqSchema.methods.recordView = function() {
    this.views += 1;
    return this.save();
};

// Method to record feedback
faqSchema.methods.recordFeedback = function(isHelpful) {
    if (isHelpful) {
        this.helpful += 1;
    } else {
        this.notHelpful += 1;
    }
    return this.save();
};

export const FAQ = mongoose.model("FAQ", faqSchema);
