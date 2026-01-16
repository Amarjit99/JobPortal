import mongoose from "mongoose";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        required: false,
        validate: {
            validator: function(v) {
                // Supports international formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
                return /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(v);
            },
            message: 'Invalid phone number format'
        }
    },
    password:{
        type:String,
        required: function() {
            // Password not required for OAuth users
            return !this.googleId && !this.linkedinId && !this.githubId;
        }
    },
    role:{
        type:String,
        enum:['student','recruiter','admin','sub-admin'],
        required:true
    },
    // OAuth provider IDs
    googleId: {
        type: String,
        sparse: true,
        unique: true
    },
    linkedinId: {
        type: String,
        sparse: true,
        unique: true
    },
    githubId: {
        type: String,
        sparse: true,
        unique: true
    },
    // OAuth provider data
    oauthProvider: {
        type: String,
        enum: ['local', 'google', 'linkedin', 'github'],
        default: 'local'
    },
    profile:{
        bio:{type:String},
        skills:[{type:String}],
        resume:{type:String}, // URL to resume file - DEPRECATED, use resumes array
        resumeOriginalName:{type:String}, // DEPRECATED, use resumes array
        company:{type:mongoose.Schema.Types.ObjectId, ref:'Company'}, 
        profilePhoto:{
            type:String,
            default:""
        }
    },
    // Multiple Resumes
    resumes: [{
        fileName: {
            type: String,
            required: true
        },
        originalName: {
            type: String,
            required: true
        },
        cloudinaryUrl: {
            type: String,
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        isDefault: {
            type: Boolean,
            default: false
        },
        fileSize: {
            type: Number // in bytes
        }
    }],
    // Education history
    education: [{
        degree: {
            type: String,
            required: true
        },
        institution: {
            type: String,
            required: true
        },
        fieldOfStudy: {
            type: String
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date
        },
        grade: {
            type: String
        },
        description: {
            type: String
        },
        current: {
            type: Boolean,
            default: false
        }
    }],
    // Work experience history
    experience: [{
        title: {
            type: String,
            required: true
        },
        company: {
            type: String,
            required: true
        },
        location: {
            type: String
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date
        },
        current: {
            type: Boolean,
            default: false
        },
        description: {
            type: String
        },
        skills: [{
            type: String
        }]
    }],
    // Certifications
    certifications: [{
        name: {
            type: String,
            required: true
        },
        issuingOrganization: {
            type: String,
            required: true
        },
        issueDate: {
            type: Date
        },
        expirationDate: {
            type: Date
        },
        credentialID: {
            type: String
        },
        credentialURL: {
            type: String
        },
        certificateFile: {
            type: String // Cloudinary URL
        }
    }],
    // Job Preferences
    preferredJobLocations: [{
        type: String
    }],
    expectedSalary: {
        min: {
            type: Number
        },
        max: {
            type: Number
        },
        currency: {
            type: String,
            default: 'INR',
            enum: ['INR', 'USD', 'EUR', 'GBP']
        }
    },
    noticePeriod: {
        value: {
            type: Number // in days
        },
        immediate: {
            type: Boolean,
            default: false
        }
    },
    // Saved/Bookmarked jobs
    savedJobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    }],
    // Email notification preferences
    emailNotifications: {
        jobAlerts: {
            type: Boolean,
            default: true
        },
        applicationUpdates: {
            type: Boolean,
            default: true
        },
        newApplicants: {
            type: Boolean,
            default: true
        }
    },
    // Job alert preferences
    jobAlertPreferences: {
        jobTypes: [{
            type: String,
            enum: ['Full Time', 'Part Time', 'Contract', 'Internship']
        }],
        locations: [String],
        minSalary: Number,
        maxSalary: Number
    },
    // Email verification fields
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String
    },
    verificationTokenExpires: {
        type: Date
    },
    // Password reset fields
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
    // Refresh token field
    refreshToken: {
        type: String
    },
    // Account locking fields
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    // Two-Factor Authentication fields
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        select: false // Don't include in queries by default for security
    },
    backupCodes: {
        type: [String],
        default: [],
        select: false // Don't include in queries by default for security
    },
    // Admin block/unblock fields
    isBlocked: {
        type: Boolean,
        default: false
    },
    blockReason: {
        type: String
    },
    blockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    blockedAt: {
        type: Date
    },
    // Role change history
    roleChangeHistory: [{
        previousRole: {
            type: String,
            enum: ['student', 'recruiter', 'admin', 'sub-admin']
        },
        newRole: {
            type: String,
            enum: ['student', 'recruiter', 'admin', 'sub-admin']
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        changedAt: {
            type: Date,
            default: Date.now
        },
        reason: String
    }]
},{timestamps:true});

// Indexes for performance (email index already created by unique: true)
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ verificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ refreshToken: 1 });
userSchema.index({ lockUntil: 1 });

// Virtual property to check if account is currently locked
userSchema.virtual('isCurrentlyLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
    // If we have a previous lock that has expired, reset attempts
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return await this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1, isLocked: 1 }
        });
    }
    
    // Otherwise, increment attempts
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock the account if we've reached max attempts (5)
    const maxAttempts = 5;
    if (this.loginAttempts + 1 >= maxAttempts && !this.isCurrentlyLocked) {
        updates.$set = { 
            lockUntil: Date.now() + 30 * 60 * 1000, // 30 minutes
            isLocked: true 
        };
    }
    
    return await this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
    return await this.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1, isLocked: 1 }
    });
};

// Method to generate verification token
userSchema.methods.generateVerificationToken = function() {
    const token = crypto.randomBytes(32).toString('hex');
    this.verificationToken = crypto.createHash('sha256').update(token).digest('hex');
    this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    return token;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
    const token = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    return token;
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
    const token = crypto.randomBytes(64).toString('hex');
    this.refreshToken = crypto.createHash('sha256').update(token).digest('hex');
    return token;
};

export const User = mongoose.model('User', userSchema);