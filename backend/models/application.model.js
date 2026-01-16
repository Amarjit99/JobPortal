import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    job:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Job',
        required:true
    },
    applicant:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    status:{
        type:String,
        enum:['pending', 'accepted', 'rejected', 'interview_scheduled', 'interview_confirmed', 'interview_declined'],
        default:'pending'
    },
    // Enhanced application tracking
    currentStage: {
        type: String,
        enum: ['applied', 'screening', 'interview', 'offer', 'rejected', 'hired', 'withdrawn'],
        default: 'applied'
    },
    stageHistory: [{
        stage: {
            type: String,
            enum: ['applied', 'screening', 'interview', 'offer', 'rejected', 'hired', 'withdrawn'],
            required: true
        },
        changedAt: {
            type: Date,
            default: Date.now
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: {
            type: String
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed
        }
    }],
    nextStepDate: {
        type: Date
    },
    nextStepDescription: {
        type: String
    },
    interviewDetails: {
        scheduledAt: Date,
        interviewType: {
            type: String,
            enum: ['phone', 'video', 'in-person', 'technical', 'hr', 'final']
        },
        duration: Number, // in minutes
        meetingLink: String,
        location: String,
        interviewers: [{
            name: String,
            role: String,
            email: String
        }],
        feedback: String,
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        completed: {
            type: Boolean,
            default: false
        },
        completedAt: Date
    },
    offerDetails: {
        offeredAt: Date,
        salary: Number,
        currency: {
            type: String,
            default: 'INR'
        },
        joiningDate: Date,
        acceptedAt: Date,
        rejectedAt: Date,
        rejectionReason: String,
        benefits: [String],
        negotiationHistory: [{
            proposedSalary: Number,
            proposedBy: {
                type: String,
                enum: ['candidate', 'company']
            },
            proposedAt: Date,
            notes: String
        }]
    },
    screeningAnswers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        question: {
            type: String,
            required: true
        },
        answer: {
            type: String,
            required: true
        }
    }],
    notes: [{
        noteText: {
            type: String,
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date
        }
    }],
    statusHistory: [{
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'interview_scheduled', 'interview_confirmed', 'interview_declined'],
            required: true
        },
        changedAt: {
            type: Date,
            default: Date.now
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        note: String
    }]
},{timestamps:true});

// Indexes for performance
applicationSchema.index({ job: 1 });
applicationSchema.index({ applicant: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ currentStage: 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ nextStepDate: 1 });
// Compound index for checking existing applications
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Middleware to track status and stage changes
applicationSchema.pre('save', function(next) {
    // Track stage changes
    if (this.isModified('currentStage') && !this.isNew) {
        this.stageHistory.push({
            stage: this.currentStage,
            changedAt: new Date()
        });
    } else if (this.isNew) {
        // For new applications, add initial applied stage
        this.stageHistory = [{
            stage: 'applied',
            changedAt: this.createdAt || new Date()
        }];
    }

    // Track status changes
    if (this.isModified('status') && !this.isNew) {
        this.statusHistory.push({
            status: this.status,
            changedAt: new Date()
        });
    } else if (this.isNew) {
        // For new applications, add initial pending status
        this.statusHistory = this.statusHistory || [{
            status: 'pending',
            changedAt: this.createdAt || new Date()
        }];
    }
    next();
});

// Method to update stage with history
applicationSchema.methods.updateStage = function(newStage, changedBy, notes, metadata) {
    this.currentStage = newStage;
    this.stageHistory.push({
        stage: newStage,
        changedAt: new Date(),
        changedBy,
        notes,
        metadata
    });
    return this.save();
};

// Method to add interview details
applicationSchema.methods.scheduleInterview = function(interviewData) {
    this.interviewDetails = {
        ...this.interviewDetails,
        ...interviewData
    };
    this.currentStage = 'interview';
    return this.save();
};

// Method to add offer details
applicationSchema.methods.makeOffer = function(offerData) {
    this.offerDetails = {
        ...this.offerDetails,
        ...offerData,
        offeredAt: new Date()
    };
    this.currentStage = 'offer';
    return this.save();
};

export const Application  = mongoose.model("Application", applicationSchema);