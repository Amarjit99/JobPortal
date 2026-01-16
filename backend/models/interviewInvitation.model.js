import mongoose from "mongoose";

const interviewInvitationSchema = new mongoose.Schema({
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        required: true
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recruiter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    interviewDate: {
        type: Date,
        required: true
    },
    interviewTime: {
        type: String,
        required: true
    },
    duration: {
        type: Number, // in minutes
        default: 60
    },
    interviewType: {
        type: String,
        enum: ['in-person', 'phone', 'video'],
        required: true
    },
    location: {
        type: String
    },
    meetingLink: {
        type: String
    },
    interviewRound: {
        type: String,
        enum: ['screening', 'technical', 'hr', 'final', 'other'],
        default: 'screening'
    },
    roundNumber: {
        type: Number,
        default: 1,
        min: 1
    },
    instructions: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'rescheduled', 'completed', 'cancelled', 'confirmed', 'in-progress', 'no-show'],
        default: 'pending'
    },
    candidateResponse: {
        respondedAt: Date,
        message: String
    },
    candidateConfirmed: {
        type: Boolean,
        default: false
    },
    confirmedAt: Date,
    
    // Interviewers/panel members
    interviewers: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        name: {
            type: String,
            required: true
        },
        role: String,
        email: {
            type: String,
            lowercase: true,
            trim: true
        },
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    
    // Enhanced reschedule history (array for multiple reschedules)
    rescheduleHistory: [{
        previousDate: Date,
        previousTime: String,
        newDate: Date,
        newTime: String,
        rescheduledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rescheduledAt: {
            type: Date,
            default: Date.now
        },
        reason: String
    }],
    
    // Legacy single reschedule (keep for backward compatibility)
    rescheduledFrom: {
        date: Date,
        time: String,
        reason: String
    },
    
    // Cancellation details
    cancellation: {
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        cancelledAt: Date,
        reason: String
    },
    
    // Internal notes (visible to recruiters only)
    internalNotes: [{
        note: String,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Enhanced feedback with detailed scoring
    feedback: {
        overallRating: {
            type: Number,
            min: 1,
            max: 5
        },
        technicalSkills: {
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            comments: String
        },
        communication: {
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            comments: String
        },
        cultureFit: {
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            comments: String
        },
        problemSolving: {
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            comments: String
        },
        strengths: [String],
        weaknesses: [String],
        generalComments: String,
        recommendation: {
            type: String,
            enum: ['strong-hire', 'hire', 'maybe', 'no-hire', 'strong-no-hire', 'next_round', 'hold']
        },
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        submittedAt: Date
    },
    
    // Reminder emails sent
    remindersSent: {
        oneDayBefore: {
            type: Boolean,
            default: false
        },
        oneHourBefore: {
            type: Boolean,
            default: false
        }
    },
    
    // Time tracking
    startedAt: Date,
    completedAt: Date
}, { timestamps: true });

// Indexes
interviewInvitationSchema.index({ application: 1 });
interviewInvitationSchema.index({ candidate: 1, interviewDate: -1 });
interviewInvitationSchema.index({ recruiter: 1, interviewDate: -1 });
interviewInvitationSchema.index({ status: 1 });
interviewInvitationSchema.index({ company: 1, status: 1 });
interviewInvitationSchema.index({ interviewDate: 1, status: 1 });
interviewInvitationSchema.index({ application: 1, status: 1 });

// Virtuals
interviewInvitationSchema.virtual('isUpcoming').get(function() {
    return this.interviewDate > new Date() && 
           ['pending', 'accepted', 'confirmed', 'rescheduled'].includes(this.status);
});

interviewInvitationSchema.virtual('isPast').get(function() {
    return this.interviewDate < new Date();
});

// Methods
interviewInvitationSchema.methods.reschedule = async function(newDate, newTime, rescheduledBy, reason) {
    this.rescheduleHistory.push({
        previousDate: this.interviewDate,
        previousTime: this.interviewTime,
        newDate: newDate,
        newTime: newTime,
        rescheduledBy: rescheduledBy,
        rescheduledAt: new Date(),
        reason: reason
    });
    
    this.interviewDate = newDate;
    this.interviewTime = newTime;
    this.status = 'rescheduled';
    this.candidateConfirmed = false; // Reset confirmation
    
    return this.save();
};

interviewInvitationSchema.methods.cancel = async function(cancelledBy, reason) {
    this.cancellation = {
        cancelledBy: cancelledBy,
        cancelledAt: new Date(),
        reason: reason
    };
    
    this.status = 'cancelled';
    
    return this.save();
};

interviewInvitationSchema.methods.submitFeedback = async function(feedbackData, submittedBy) {
    this.feedback = {
        ...feedbackData,
        submittedBy: submittedBy,
        submittedAt: new Date()
    };
    
    if (this.status !== 'completed') {
        this.status = 'completed';
        this.completedAt = new Date();
    }
    
    return this.save();
};

interviewInvitationSchema.methods.addNote = function(note, createdBy) {
    this.internalNotes.push({
        note: note,
        createdBy: createdBy,
        createdAt: new Date()
    });
    
    return this.save();
};

interviewInvitationSchema.methods.confirmAttendance = function() {
    this.candidateConfirmed = true;
    this.confirmedAt = new Date();
    
    if (this.status === 'pending' || this.status === 'accepted') {
        this.status = 'confirmed';
    }
    
    return this.save();
};

// Pre-save middleware to update application
interviewInvitationSchema.pre('save', async function(next) {
    if (this.isNew || this.isModified('interviewDate') || this.isModified('status')) {
        try {
            const Application = mongoose.model('Application');
            const application = await Application.findById(this.application);
            
            if (application) {
                // Update application's interview details
                application.interviewDetails = {
                    ...application.interviewDetails,
                    scheduledAt: this.interviewDate,
                    interviewType: this.interviewType,
                    duration: this.duration,
                    meetingLink: this.meetingLink,
                    location: this.location,
                    completed: this.status === 'completed',
                    completedAt: this.completedAt
                };
                
                // Update stage to interview if accepted/confirmed
                if (['accepted', 'confirmed', 'in-progress'].includes(this.status) && 
                    application.currentStage !== 'interview') {
                    application.currentStage = 'interview';
                }
                
                await application.save();
            }
        } catch (error) {
            console.error('Error updating application from interview:', error);
        }
    }
    
    next();
});

// Static methods
interviewInvitationSchema.statics.getUpcomingInterviews = function(candidateId) {
    return this.find({
        candidate: candidateId,
        interviewDate: { $gte: new Date() },
        status: { $in: ['pending', 'accepted', 'confirmed', 'rescheduled'] }
    })
    .populate('job', 'title company')
    .populate('company', 'name logo')
    .populate('interviewers.userId', 'fullname email')
    .sort({ interviewDate: 1 });
};

interviewInvitationSchema.statics.getCompanyInterviews = function(companyId, filters = {}) {
    const query = { company: companyId, ...filters };
    
    return this.find(query)
    .populate('candidate', 'fullname email phone profile.resume')
    .populate('job', 'title')
    .populate('application')
    .sort({ interviewDate: -1 });
};

export const InterviewInvitation = mongoose.model('InterviewInvitation', interviewInvitationSchema);
