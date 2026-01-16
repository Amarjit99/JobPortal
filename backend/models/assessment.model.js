import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    
    description: {
        type: String,
        required: true
    },
    
    // Skills this assessment tests
    skills: [{
        type: String,
        required: true,
        trim: true
    }],
    
    // Category/domain
    category: {
        type: String,
        enum: ['technical', 'soft-skills', 'language', 'domain-specific', 'cognitive', 'general'],
        default: 'technical'
    },
    
    // Difficulty level
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate'
    },
    
    // Questions array
    questions: [{
        questionText: {
            type: String,
            required: true
        },
        questionType: {
            type: String,
            enum: ['multiple-choice', 'single-choice', 'true-false', 'text', 'code'],
            required: true
        },
        // For choice-based questions
        options: [{
            optionText: String,
            optionId: String
        }],
        // Correct answer(s)
        correctAnswer: {
            type: mongoose.Schema.Types.Mixed, // Can be string, array, or object depending on questionType
            required: true
        },
        // Points for this question
        points: {
            type: Number,
            default: 1,
            min: 0
        },
        // Explanation shown after submission
        explanation: String,
        // Skills tested by this question
        skillsTested: [String],
        // Code template for coding questions
        codeTemplate: String,
        // Test cases for coding questions
        testCases: [{
            input: String,
            expectedOutput: String,
            points: Number
        }]
    }],
    
    // Time limit in minutes
    duration: {
        type: Number,
        required: true,
        default: 30,
        min: 5,
        max: 180
    },
    
    // Passing score (out of 100)
    passingScore: {
        type: Number,
        required: true,
        default: 70,
        min: 0,
        max: 100
    },
    
    // Total possible points (calculated from questions)
    totalPoints: {
        type: Number,
        default: 0
    },
    
    // Active/inactive status
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    
    // Is this assessment public or company-specific
    isPublic: {
        type: Boolean,
        default: true
    },
    
    // Company that created this (if company-specific)
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company"
    },
    
    // Creator
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    
    // Statistics
    stats: {
        totalAttempts: {
            type: Number,
            default: 0
        },
        averageScore: {
            type: Number,
            default: 0
        },
        passRate: {
            type: Number,
            default: 0
        }
    },
    
    // Tags for searchability
    tags: [String],
    
    // Prerequisites
    prerequisites: {
        type: String
    }
    
}, { timestamps: true });

// Indexes
assessmentSchema.index({ skills: 1 });
assessmentSchema.index({ category: 1, level: 1 });
assessmentSchema.index({ isActive: 1, isPublic: 1 });
assessmentSchema.index({ company: 1, isActive: 1 });
assessmentSchema.index({ tags: 1 });

// Calculate total points before saving
assessmentSchema.pre('save', function(next) {
    if (this.questions && this.questions.length > 0) {
        this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    }
    next();
});

// Method to update statistics
assessmentSchema.methods.updateStats = async function(score, passed) {
    const totalAttempts = this.stats.totalAttempts + 1;
    const totalScore = (this.stats.averageScore * this.stats.totalAttempts) + score;
    const averageScore = totalScore / totalAttempts;
    
    const previousPasses = Math.round(this.stats.passRate * this.stats.totalAttempts / 100);
    const totalPasses = previousPasses + (passed ? 1 : 0);
    const passRate = (totalPasses / totalAttempts) * 100;
    
    this.stats = {
        totalAttempts,
        averageScore: Math.round(averageScore * 100) / 100,
        passRate: Math.round(passRate * 100) / 100
    };
    
    return this.save();
};

// Static method to get assessments by skill
assessmentSchema.statics.findBySkill = function(skill) {
    return this.find({
        skills: { $in: [skill] },
        isActive: true,
        isPublic: true
    }).select('title description skills category level duration passingScore stats');
};

// Static method to get popular assessments
assessmentSchema.statics.getPopular = function(limit = 10) {
    return this.find({
        isActive: true,
        isPublic: true
    })
    .sort({ 'stats.totalAttempts': -1 })
    .limit(limit)
    .select('title description skills category level duration passingScore stats');
};

export const Assessment = mongoose.model("Assessment", assessmentSchema);
