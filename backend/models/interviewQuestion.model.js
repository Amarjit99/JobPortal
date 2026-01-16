import mongoose from 'mongoose';

const interviewQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'technical', 
            'behavioral', 
            'situational', 
            'problem-solving',
            'system-design',
            'coding',
            'hr',
            'leadership',
            'general'
        ]
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    jobRole: [{
        type: String, // e.g., 'Software Engineer', 'Data Scientist', etc.
        trim: true
    }],
    skills: [{
        type: String, // Related skills
        trim: true
    }],
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    companyName: {
        type: String, // For general company questions
        trim: true
    },
    sampleAnswer: {
        type: String
    },
    tips: [{
        type: String
    }],
    keyPoints: [{
        type: String
    }],
    relatedQuestions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewQuestion'
    }],
    upvotes: {
        type: Number,
        default: 0
    },
    downvotes: {
        type: Number,
        default: 0
    },
    askedCount: {
        type: Number,
        default: 0 // How many times reported as asked
    },
    source: {
        type: String,
        enum: ['admin', 'user', 'company', 'ai-generated'],
        default: 'admin'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Indexes
interviewQuestionSchema.index({ category: 1, difficulty: 1 });
interviewQuestionSchema.index({ jobRole: 1 });
interviewQuestionSchema.index({ skills: 1 });
interviewQuestionSchema.index({ company: 1 });
interviewQuestionSchema.index({ upvotes: -1, askedCount: -1 });
interviewQuestionSchema.index({ isActive: 1, isVerified: 1 });

// Text index for search
interviewQuestionSchema.index({ question: 'text', sampleAnswer: 'text' });

// Static method: Get questions by role
interviewQuestionSchema.statics.getByRole = function(role, options = {}) {
    const {
        category,
        difficulty,
        limit = 20,
        skip = 0,
        sort = { upvotes: -1, askedCount: -1 }
    } = options;

    const match = {
        jobRole: { $in: [role, new RegExp(role, 'i')] },
        isActive: true
    };

    if (category) match.category = category;
    if (difficulty) match.difficulty = difficulty;

    return this.find(match)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .populate('addedBy', 'fullname')
        .populate('company', 'name');
};

// Static method: Get questions by company
interviewQuestionSchema.statics.getByCompany = function(companyId, options = {}) {
    const { limit = 20, skip = 0 } = options;

    return this.find({
        company: companyId,
        isActive: true
    })
        .sort({ askedCount: -1, upvotes: -1 })
        .limit(limit)
        .skip(skip)
        .populate('addedBy', 'fullname');
};

// Instance method: Upvote question
interviewQuestionSchema.methods.upvote = function() {
    this.upvotes += 1;
    return this.save();
};

// Instance method: Downvote question
interviewQuestionSchema.methods.downvote = function() {
    this.downvotes += 1;
    return this.save();
};

// Instance method: Mark as asked
interviewQuestionSchema.methods.markAsAsked = function() {
    this.askedCount += 1;
    return this.save();
};

export const InterviewQuestion = mongoose.model('InterviewQuestion', interviewQuestionSchema);
