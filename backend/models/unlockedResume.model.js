import mongoose from "mongoose";

const unlockedResumeSchema = new mongoose.Schema({
    recruiterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    },
    creditsUsed: {
        type: Number,
        default: 1
    },
    unlockedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date
    }
}, { timestamps: true });

// Compound index to prevent duplicate unlocks
unlockedResumeSchema.index({ recruiterId: 1, candidateId: 1 }, { unique: true });
unlockedResumeSchema.index({ recruiterId: 1, unlockedAt: -1 });

// Check if resume is still accessible
unlockedResumeSchema.methods.isAccessible = function() {
    if (!this.expiresAt) return true;
    return this.expiresAt > new Date();
};

export const UnlockedResume = mongoose.model("UnlockedResume", unlockedResumeSchema);
