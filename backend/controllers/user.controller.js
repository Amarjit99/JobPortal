import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import logger from "../utils/logger.js";
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendAccountLockEmail } from "../utils/emailService.js";
import crypto from "crypto";
import speakeasy from 'speakeasy';
import { calculateProfileCompletion, getProfileCompletionTips, getProfileCompletionBadge } from "../utils/profileCompletion.js";

export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, password, role } = req.body;
        
        // Detailed logging
        logger.info('Registration attempt:', { fullname, email, phoneNumber: phoneNumber?.substring(0, 3) + '***', role });
         
        if (!fullname || !email || !phoneNumber || !password || !role) {
            logger.warn('Missing fields:', { 
                hasFullname: !!fullname, 
                hasEmail: !!email, 
                hasPhone: !!phoneNumber, 
                hasPassword: !!password, 
                hasRole: !!role 
            });
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };
        
        // Validate role
        if (!['student', 'recruiter', 'admin'].includes(role)) {
            logger.error('Invalid role:', role);
            return res.status(400).json({
                message: `Invalid role: ${role}. Must be student, recruiter, or admin.`,
                success: false
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exist with this email.',
                success: false,
            })
        }

        // Handle optional file upload
        let profilePhotoUrl = "";
        const file = req.file;
        if (file) {
            const fileUri = getDataUri(file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            profilePhotoUrl = cloudResponse.secure_url;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        logger.info('Creating user with role:', role);
        const user = await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            profile:{
                profilePhoto: profilePhotoUrl,
            }
        });
        
        logger.info('User created successfully:', { id: user._id, email: user.email, role: user.role });

        // Generate verification token
        const verificationToken = user.generateVerificationToken();
        await user.save();

        // Send verification email (skip if SMTP not configured in development)
        const hasSmtpConfig = process.env.SMTP_USER && process.env.SMTP_PASS;
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        if (!hasSmtpConfig && isDevelopment) {
            logger.warn(`Development mode: SMTP not configured, skipping verification email for ${email}`);
            return res.status(201).json({
                message: "Account created successfully. Email verification bypassed in development mode.",
                success: true,
                devMode: true
            });
        }
        
        try {
            await sendVerificationEmail(email, fullname, verificationToken);
            return res.status(201).json({
                message: "Account created successfully. Please check your email to verify your account.",
                success: true
            });
        } catch (emailError) {
            logger.error('Error sending verification email:', emailError);
            
            // In development, allow bypass if SMTP fails
            if (isDevelopment) {
                logger.warn(`Development mode: Email failed, allowing registration anyway for ${email}`);
                return res.status(201).json({
                    message: "Account created successfully. Email service unavailable in development mode.",
                    success: true,
                    devMode: true
                });
            }
            
            // User is created, but email failed in production
            return res.status(201).json({
                message: "Account created successfully, but verification email could not be sent. Please contact support.",
                success: true
            });
        }
    } catch (error) {
        logger.error('Error in register:', error);
        
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: messages.join(', '),
                success: false
            });
        }
        
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
export const login = async (req, res) => {
    try {
        const { email, password, role, twoFactorToken, backupCode } = req.body;
        
        logger.info('Login attempt:', { email, role, has2FAToken: !!twoFactorToken, hasBackupCode: !!backupCode });
        
        if (!email || !password || !role) {
            logger.warn('Missing login fields:', { hasEmail: !!email, hasPassword: !!password, hasRole: !!role });
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };
        
        let user = await User.findOne({ email }).select('+twoFactorSecret +backupCodes');
        if (!user) {
            logger.warn('User not found:', email);
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            })
        }
        
        logger.info('User found:', { email, storedRole: user.role, isVerified: user.isVerified, twoFactorEnabled: user.twoFactorEnabled });
        
        // Check if user is blocked by admin
        if (user.isBlocked) {
            logger.warn('Blocked user attempted login:', { email, blockReason: user.blockReason });
            return res.status(403).json({
                message: `Your account has been blocked. Reason: ${user.blockReason || 'Violation of terms of service'}. Please contact support.`,
                success: false,
                blocked: true
            });
        }
        
        // Check if account is locked
        if (user.isCurrentlyLocked) {
            const timeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
            logger.warn('Account locked:', { email, timeRemaining });
            return res.status(423).json({
                message: `Account is locked due to too many failed login attempts. Please try again in ${timeRemaining} minute${timeRemaining !== 1 ? 's' : ''}.`,
                success: false,
                locked: true,
                timeRemaining
            });
        }
        
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            logger.warn('Password mismatch for:', email);
            
            // Increment login attempts
            await user.incrementLoginAttempts();
            
            // Reload user to get updated loginAttempts and lock status
            user = await User.findOne({ email });
            
            const attemptsLeft = 5 - user.loginAttempts;
            
            // If account just got locked, send notification email
            if (user.isCurrentlyLocked) {
                const unlockTime = new Date(user.lockUntil).toLocaleString();
                logger.error('Account locked after failed attempts:', { email, attempts: user.loginAttempts });
                
                // Send lock notification email (don't block response)
                try {
                    await sendAccountLockEmail(user.email, user.fullname, unlockTime);
                } catch (emailError) {
                    logger.error('Failed to send account lock email:', emailError);
                }
                
                return res.status(423).json({
                    message: "Account has been locked due to too many failed login attempts. Please check your email for instructions or try again in 30 minutes.",
                    success: false,
                    locked: true,
                    timeRemaining: 30
                });
            }
            
            return res.status(400).json({
                message: attemptsLeft > 0 
                    ? `Incorrect email or password. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining before account lock.`
                    : "Incorrect email or password.",
                success: false,
                attemptsLeft
            });
        };
        
        logger.info('Password match successful for:', email);
        
        // Reset login attempts on successful authentication
        if (user.loginAttempts > 0 || user.isLocked) {
            await user.resetLoginAttempts();
            logger.info('Reset login attempts for:', email);
        }
        
        // Check if email is verified (skip in development mode without SMTP)
        if (!user.isVerified) {
            // Allow login in development if SMTP is not configured
            const isDevelopment = process.env.NODE_ENV === 'development';
            const hasSmtpConfig = process.env.SMTP_USER && process.env.SMTP_PASS;
            
            if (!isDevelopment || hasSmtpConfig) {
                return res.status(403).json({
                    message: "Please verify your email before logging in. Check your inbox for the verification link.",
                    success: false
                });
            }
            
            // Dev mode bypass - log warning
            logger.warn(`Development mode: Allowing unverified login for ${email}`);
        }
        
        // check role is correct or not
        logger.info('Role validation:', { requestedRole: role, userRole: user.role });
        if (role !== user.role) {
            logger.error('Role mismatch:', { requestedRole: role, userRole: user.role });
            return res.status(400).json({
                message: `Account doesn't exist with current role. Your account role is '${user.role}', but you selected '${role}'.`,
                success: false
            })
        };

        // ===== TWO-FACTOR AUTHENTICATION =====
        if (user.twoFactorEnabled) {
            // If 2FA is enabled but no token/code provided, request it
            if (!twoFactorToken && !backupCode) {
                logger.info('2FA required for user:', email);
                return res.status(200).json({
                    message: "Two-factor authentication required",
                    success: false,
                    requires2FA: true,
                    email: user.email
                });
            }

            // Verify 2FA token or backup code
            let verified = false;

            if (twoFactorToken) {
                // Verify TOTP token
                verified = speakeasy.totp.verify({
                    secret: user.twoFactorSecret,
                    encoding: 'base32',
                    token: twoFactorToken,
                    window: 2
                });

                if (!verified) {
                    logger.warn('Invalid 2FA token for:', email);
                    return res.status(400).json({
                        message: "Invalid two-factor authentication code",
                        success: false,
                        requires2FA: true
                    });
                }

                logger.info('2FA token verified for:', email);
            } else if (backupCode) {
                // Verify backup code
                const hashedCode = crypto.createHash('sha256').update(backupCode.toUpperCase()).digest('hex');
                const codeIndex = user.backupCodes.indexOf(hashedCode);

                if (codeIndex === -1) {
                    logger.warn('Invalid backup code for:', email);
                    return res.status(400).json({
                        message: "Invalid backup code",
                        success: false,
                        requires2FA: true
                    });
                }

                // Remove used backup code
                user.backupCodes.splice(codeIndex, 1);
                await user.save();

                verified = true;
                logger.info('Backup code verified and removed for:', email);
            }

            if (!verified) {
                return res.status(400).json({
                    message: "Invalid two-factor authentication",
                    success: false,
                    requires2FA: true
                });
            }
        }
        // ===== END TWO-FACTOR AUTHENTICATION =====

        // Generate access token (short-lived)
        const tokenData = {
            userId: user._id
        }
        const accessToken = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '15m' });
        
        // Generate refresh token (long-lived)
        const refreshToken = user.generateRefreshToken();
        await user.save();

        const userData = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        return res.status(200)
            .cookie("token", accessToken, { maxAge: 15 * 60 * 1000, httpOnly: true, sameSite: 'strict' })
            .cookie("refreshToken", refreshToken, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'strict' })
            .json({
                message: `Welcome back ${userData.fullname}`,
                user: userData,
                success: true
            })
    } catch (error) {
        logger.error('Error in login:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
export const logout = async (req, res) => {
    try {
        // Clear refresh token from database
        const userId = req.id;
        if (userId) {
            await User.findByIdAndUpdate(userId, { refreshToken: null });
        }
        
        return res.status(200)
            .cookie("token", "", { maxAge: 0 })
            .cookie("refreshToken", "", { maxAge: 0 })
            .json({
            message: "Logged out successfully.",
            success: true
        })
    } catch (error) {
        logger.error('Error in logout:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
export const updateProfile = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, bio, skills } = req.body;
        
        let skillsArray;
        if(skills){
            // Handle both array and comma-separated string
            skillsArray = Array.isArray(skills) ? skills : skills.split(",");
        }
        const userId = req.id; // middleware authentication
        let user = await User.findById(userId);

        if (!user) {
            return res.status(400).json({
                message: "User not found.",
                success: false
            })
        }
        // updating data
        if(fullname) user.fullname = fullname
        if(email) user.email = email
        if(phoneNumber)  user.phoneNumber = phoneNumber
        if(bio) user.profile.bio = bio
        if(skills) user.profile.skills = skillsArray
      
        // Handle optional file upload for resume
        const file = req.file;
        if(file){
            const fileUri = getDataUri(file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            user.profile.resume = cloudResponse.secure_url // save the cloudinary url
            user.profile.resumeOriginalName = file.originalname // Save the original file name
        }


        await user.save();

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        return res.status(200).json({
            message:"Profile updated successfully.",
            user,
            success:true
        })
    } catch (error) {
        logger.error('Error updating profile:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}

// Save/bookmark a job
export const saveJob = async (req, res) => {
    try {
        const userId = req.id;
        const { jobId } = req.body;

        if (!jobId) {
            return res.status(400).json({
                message: "Job ID is required",
                success: false
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Check if job already saved
        if (user.savedJobs.includes(jobId)) {
            return res.status(400).json({
                message: "Job already saved",
                success: false
            });
        }

        user.savedJobs.push(jobId);
        await user.save();

        return res.status(200).json({
            message: "Job saved successfully",
            success: true
        });
    } catch (error) {
        logger.error('Error saving job:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Unsave/remove bookmark from a job
export const unsaveJob = async (req, res) => {
    try {
        const userId = req.id;
        const { jobId } = req.body;

        if (!jobId) {
            return res.status(400).json({
                message: "Job ID is required",
                success: false
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Remove job from saved list
        user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId);
        await user.save();

        return res.status(200).json({
            message: "Job unsaved successfully",
            success: true
        });
    } catch (error) {
        logger.error('Error unsaving job:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get all saved jobs
export const getSavedJobs = async (req, res) => {
    try {
        const userId = req.id;

        const user = await User.findById(userId).populate({
            path: 'savedJobs',
            populate: {
                path: 'company',
                select: 'name logo'
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        return res.status(200).json({
            savedJobs: user.savedJobs || [],
            success: true
        });
    } catch (error) {
        logger.error('Error getting saved jobs:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Verify email endpoint
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                message: "Verification token is required",
                success: false
            });
        }

        // Hash the token to match stored hash
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid token
        const user = await User.findOne({
            verificationToken: hashedToken,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired verification token",
                success: false
            });
        }

        // Update user verification status
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        // Send welcome email
        try {
            await sendWelcomeEmail(user.email, user.fullname);
        } catch (emailError) {
            logger.error('Error sending welcome email:', emailError);
        }

        return res.status(200).json({
            message: "Email verified successfully. You can now login.",
            success: true
        });
    } catch (error) {
        logger.error('Error verifying email:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Resend verification email endpoint
export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
                success: false
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                message: "Email is already verified",
                success: false
            });
        }

        // Generate new verification token
        const verificationToken = user.generateVerificationToken();
        await user.save();

        // Send verification email
        await sendVerificationEmail(user.email, user.fullname, verificationToken);

        return res.status(200).json({
            message: "Verification email sent successfully",
            success: true
        });
    } catch (error) {
        logger.error('Error resending verification email:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Forgot password endpoint
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
                success: false
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            // Don't reveal if user exists
            return res.status(200).json({
                message: "If an account with that email exists, a password reset link has been sent.",
                success: true
            });
        }

        // Generate password reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save();

        // Send password reset email
        try {
            await sendPasswordResetEmail(user.email, user.fullname, resetToken);
            return res.status(200).json({
                message: "If an account with that email exists, a password reset link has been sent.",
                success: true
            });
        } catch (emailError) {
            logger.error('Error sending password reset email:', emailError);
            return res.status(500).json({
                message: "Error sending password reset email. Please try again.",
                success: false
            });
        }
    } catch (error) {
        logger.error('Error in forgot password:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Reset password endpoint
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.query;
        const { password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                message: "Token and new password are required",
                success: false
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long",
                success: false
            });
        }

        // Hash the token to match stored hash
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid reset token
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired password reset token",
                success: false
            });
        }

        // Update password
        user.password = await bcrypt.hash(password, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        return res.status(200).json({
            message: "Password reset successfully. You can now login with your new password.",
            success: true
        });
    } catch (error) {
        logger.error('Error resetting password:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}

// Refresh access token using refresh token
export const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token not found. Please login again.",
                success: false
            });
        }

        // Hash the token to match stored hash
        const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

        // Find user with this refresh token
        const user = await User.findOne({ refreshToken: hashedToken });

        if (!user) {
            return res.status(401).json({
                message: "Invalid refresh token. Please login again.",
                success: false
            });
        }

        // Generate new access token
        const tokenData = {
            userId: user._id
        };
        const newAccessToken = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '15m' });

        // Optional: Rotate refresh token for additional security
        const newRefreshToken = user.generateRefreshToken();
        await user.save();

        return res.status(200)
            .cookie("token", newAccessToken, { maxAge: 15 * 60 * 1000, httpOnly: true, sameSite: 'strict' })
            .cookie("refreshToken", newRefreshToken, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'strict' })
            .json({
                message: "Access token refreshed successfully",
                success: true
            });
    } catch (error) {
        logger.error('Error refreshing token:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Update email notification preferences
export const updateEmailNotifications = async (req, res) => {
    try {
        const userId = req.id;
        const { jobAlerts, applicationUpdates, newApplicants } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Update notification preferences
        if (jobAlerts !== undefined) {
            user.emailNotifications.jobAlerts = jobAlerts;
        }
        if (applicationUpdates !== undefined) {
            user.emailNotifications.applicationUpdates = applicationUpdates;
        }
        if (newApplicants !== undefined) {
            user.emailNotifications.newApplicants = newApplicants;
        }

        await user.save();

        return res.status(200).json({
            message: "Email notification preferences updated successfully",
            emailNotifications: user.emailNotifications,
            success: true
        });
    } catch (error) {
        logger.error('Error updating email notifications:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Update job alert preferences
export const updateJobAlertPreferences = async (req, res) => {
    try {
        const userId = req.id;
        const { jobTypes, locations, minSalary, maxSalary } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Update job alert preferences
        if (jobTypes !== undefined) {
            user.jobAlertPreferences.jobTypes = jobTypes;
        }
        if (locations !== undefined) {
            user.jobAlertPreferences.locations = locations;
        }
        if (minSalary !== undefined) {
            user.jobAlertPreferences.minSalary = minSalary;
        }
        if (maxSalary !== undefined) {
            user.jobAlertPreferences.maxSalary = maxSalary;
        }

        await user.save();

        return res.status(200).json({
            message: "Job alert preferences updated successfully",
            jobAlertPreferences: user.jobAlertPreferences,
            success: true
        });
    } catch (error) {
        logger.error('Error updating job alert preferences:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get user notification preferences
export const getNotificationPreferences = async (req, res) => {
    try {
        const userId = req.id;

        const user = await User.findById(userId).select('emailNotifications jobAlertPreferences');
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        return res.status(200).json({
            emailNotifications: user.emailNotifications,
            jobAlertPreferences: user.jobAlertPreferences,
            success: true
        });
    } catch (error) {
        logger.error('Error getting notification preferences:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get all users (for admin to select when creating sub-admin)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('fullname email phoneNumber role createdAt')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        logger.error('Error fetching all users:', error);
        return res.status(500).json({
            message: "Failed to fetch users",
            success: false
        });
    }
};

// Get profile completion status
export const getProfileCompletion = async (req, res) => {
    try {
        const userId = req.id;

        const user = await User.findById(userId)
            .select('fullname email phoneNumber profile resumes education experience certifications preferredJobLocations expectedSalary');

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Calculate completion
        const completion = calculateProfileCompletion(user);
        
        // Get tips for missing fields
        const tips = getProfileCompletionTips(completion.missingFields);
        
        // Get badge based on percentage
        const badge = getProfileCompletionBadge(completion.percentage);

        return res.status(200).json({
            success: true,
            completion: {
                percentage: completion.percentage,
                completedFields: completion.completedFields,
                missingFields: completion.missingFields,
                breakdown: completion.breakdown,
                badge: badge,
                tips: tips
            }
        });
    } catch (error) {
        logger.error('Error getting profile completion:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};
