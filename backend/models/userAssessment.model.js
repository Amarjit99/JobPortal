import mongoose from "mongoose";

const userAssessmentSchema = new mongoose.Schema({
    // User taking the assessment
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    
    // Assessment being taken
    assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assessment",
        required: true,
        index: true
    },
    
    // User's answers
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        questionText: String,
        userAnswer: mongoose.Schema.Types.Mixed, // Can be string, array, or object
        isCorrect: Boolean,
        pointsEarned: Number,
        timeSpent: Number // seconds spent on this question
    }],
    
    // Overall score (0-100)
    score: {
        type: Number,
        min: 0,
        max: 100
    },
    
    // Total points earned vs total possible
    pointsEarned: {
        type: Number,
        default: 0
    },
    
    totalPoints: {
        type: Number,
        default: 0
    },
    
    // Pass/fail status
    passed: {
        type: Boolean,
        index: true
    },
    
    // Status of the assessment attempt
    status: {
        type: String,
        enum: ['in-progress', 'completed', 'abandoned', 'expired'],
        default: 'in-progress',
        index: true
    },
    
    // Timing information
    startedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    
    completedAt: {
        type: Date
    },
    
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    
    // Time spent in seconds
    timeSpent: {
        type: Number,
        default: 0
    },
    
    // Duration allowed (copied from assessment at start)
    allowedDuration: {
        type: Number,
        required: true
    },
    
    // IP address for security
    ipAddress: String,
    
    // User agent
    userAgent: String,
    
    // Tab switches / suspicious activity
    suspiciousActivity: {
        tabSwitches: {
            type: Number,
            default: 0
        },
        copyPasteAttempts: {
            type: Number,
            default: 0
        },
        fullscreenExits: {
            type: Number,
            default: 0
        }
    },
    
    // Skill-wise breakdown
    skillBreakdown: [{
        skill: String,
        questionsAttempted: Number,
        questionsCorrect: Number,
        accuracy: Number,
        pointsEarned: Number,
        totalPoints: Number
    }],
    
    // Attempt number (for retakes)
    attemptNumber: {
        type: Number,
        default: 1
    },
    
    // Certificate details (if passed)
    certificate: {
        certificateId: String,
        issuedAt: Date,
        expiresAt: Date,
        verificationUrl: String
    },
    
    // Feedback from reviewer (for subjective questions)
    reviewerFeedback: {
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        reviewedAt: Date,
        comments: String,
        manualPointsAdjustment: Number
    }
    
}, { timestamps: true });

// Compound indexes
userAssessmentSchema.index({ user: 1, assessment: 1 });
userAssessmentSchema.index({ user: 1, status: 1 });
userAssessmentSchema.index({ assessment: 1, status: 1 });
userAssessmentSchema.index({ user: 1, passed: 1 });
userAssessmentSchema.index({ completedAt: -1 });

// TTL index to automatically delete abandoned assessments after 7 days
// Removed duplicate - expiresAt TTL should be defined once

// Virtual for percentage score
userAssessmentSchema.virtual('percentage').get(function() {
    if (this.totalPoints > 0) {
        return Math.round((this.pointsEarned / this.totalPoints) * 100);
    }
    return 0;
});

// Method to calculate score
userAssessmentSchema.methods.calculateScore = function(assessment) {
    let totalPoints = 0;
    let pointsEarned = 0;
    
    // Create a map of correct answers for quick lookup
    const correctAnswers = new Map();
    assessment.questions.forEach(q => {
        correctAnswers.set(q._id.toString(), {
            correct: q.correctAnswer,
            points: q.points || 1,
            type: q.questionType,
            skillsTested: q.skillsTested || []
        });
    });
    
    // Skill tracking
    const skillScores = new Map();
    
    // Evaluate each answer
    this.answers.forEach(answer => {
        const questionId = answer.questionId.toString();
        const correctData = correctAnswers.get(questionId);
        
        if (!correctData) return;
        
        totalPoints += correctData.points;
        
        // Check if answer is correct based on question type
        let isCorrect = false;
        
        if (correctData.type === 'multiple-choice') {
            // For multiple choice, compare arrays
            const userAnswerSet = new Set(Array.isArray(answer.userAnswer) ? answer.userAnswer : [answer.userAnswer]);
            const correctAnswerSet = new Set(Array.isArray(correctData.correct) ? correctData.correct : [correctData.correct]);
            
            isCorrect = userAnswerSet.size === correctAnswerSet.size && 
                       [...userAnswerSet].every(ans => correctAnswerSet.has(ans));
        } else if (correctData.type === 'text') {
            // For text, case-insensitive comparison
            isCorrect = answer.userAnswer?.toString().trim().toLowerCase() === 
                       correctData.correct?.toString().trim().toLowerCase();
        } else {
            // For single-choice, true-false, etc.
            isCorrect = answer.userAnswer === correctData.correct;
        }
        
        // Update answer with correctness and points
        answer.isCorrect = isCorrect;
        answer.pointsEarned = isCorrect ? correctData.points : 0;
        
        if (isCorrect) {
            pointsEarned += correctData.points;
        }
        
        // Update skill scores
        correctData.skillsTested.forEach(skill => {
            if (!skillScores.has(skill)) {
                skillScores.set(skill, {
                    skill,
                    questionsAttempted: 0,
                    questionsCorrect: 0,
                    pointsEarned: 0,
                    totalPoints: 0
                });
            }
            
            const skillData = skillScores.get(skill);
            skillData.questionsAttempted++;
            skillData.totalPoints += correctData.points;
            if (isCorrect) {
                skillData.questionsCorrect++;
                skillData.pointsEarned += correctData.points;
            }
            skillScores.set(skill, skillData);
        });
    });
    
    // Calculate percentages for skills
    this.skillBreakdown = Array.from(skillScores.values()).map(skill => ({
        ...skill,
        accuracy: skill.questionsAttempted > 0 
            ? Math.round((skill.questionsCorrect / skill.questionsAttempted) * 100) 
            : 0
    }));
    
    // Update totals
    this.pointsEarned = pointsEarned;
    this.totalPoints = totalPoints;
    this.score = totalPoints > 0 ? Math.round((pointsEarned / totalPoints) * 100) : 0;
    this.passed = this.score >= assessment.passingScore;
    this.status = 'completed';
    this.completedAt = new Date();
    
    // Calculate time spent
    if (this.startedAt) {
        this.timeSpent = Math.round((this.completedAt - this.startedAt) / 1000); // in seconds
    }
    
    return this;
};

// Method to check if assessment has expired
userAssessmentSchema.methods.hasExpired = function() {
    return new Date() > this.expiresAt && this.status === 'in-progress';
};

// Method to mark as abandoned
userAssessmentSchema.methods.abandon = function() {
    this.status = 'abandoned';
    return this.save();
};

// Static method to get user's completed assessments
userAssessmentSchema.statics.getUserCompletedAssessments = function(userId) {
    return this.find({
        user: userId,
        status: 'completed'
    })
    .populate('assessment', 'title skills category level')
    .sort({ completedAt: -1 });
};

// Static method to check if user has already completed an assessment
userAssessmentSchema.statics.hasCompleted = async function(userId, assessmentId) {
    const count = await this.countDocuments({
        user: userId,
        assessment: assessmentId,
        status: 'completed'
    });
    return count > 0;
};

// Static method to get user's average score
userAssessmentSchema.statics.getUserAverageScore = async function(userId) {
    const result = await this.aggregate([
        {
            $match: {
                user: mongoose.Types.ObjectId(userId),
                status: 'completed'
            }
        },
        {
            $group: {
                _id: null,
                avgScore: { $avg: '$score' },
                totalCompleted: { $sum: 1 },
                totalPassed: {
                    $sum: {
                        $cond: ['$passed', 1, 0]
                    }
                }
            }
        }
    ]);
    
    if (result.length > 0) {
        return {
            averageScore: Math.round(result[0].avgScore),
            totalCompleted: result[0].totalCompleted,
            passRate: Math.round((result[0].totalPassed / result[0].totalCompleted) * 100)
        };
    }
    
    return {
        averageScore: 0,
        totalCompleted: 0,
        passRate: 0
    };
};

export const UserAssessment = mongoose.model("UserAssessment", userAssessmentSchema);
