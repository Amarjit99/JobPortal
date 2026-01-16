import nodemailer from 'nodemailer';
import logger from './logger.js';

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

// Send verification email
export const sendVerificationEmail = async (email, fullname, verificationToken) => {
    try {
        const transporter = createTransporter();
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

        const mailOptions = {
            from: `"Job Portal" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Verify Your Email - Job Portal',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome to Job Portal, ${fullname}!</h2>
                    <p>Thank you for registering. Please verify your email address to activate your account.</p>
                    <div style="margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background-color: #4F46E5; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        Or copy and paste this link in your browser:<br>
                        <a href="${verificationUrl}">${verificationUrl}</a>
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        This link will expire in 24 hours.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">
                        If you didn't create an account, please ignore this email.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Verification email sent to ${email}`);
        return true;
    } catch (error) {
        logger.error('Error sending verification email:', error);
        throw error;
    }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, fullname, resetToken) => {
    try {
        const transporter = createTransporter();
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: `"Job Portal" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Reset Your Password - Job Portal',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>Hi ${fullname},</p>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    <div style="margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #DC2626; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        Or copy and paste this link in your browser:<br>
                        <a href="${resetUrl}">${resetUrl}</a>
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        This link will expire in 1 hour.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">
                        If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Password reset email sent to ${email}`);
        return true;
    } catch (error) {
        logger.error('Error sending password reset email:', error);
        throw error;
    }
};

// Send welcome email (after verification)
export const sendWelcomeEmail = async (email, fullname) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"Job Portal" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Welcome to Job Portal!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome to Job Portal! 🎉</h2>
                    <p>Hi ${fullname},</p>
                    <p>Your email has been verified successfully. You can now access all features of Job Portal.</p>
                    <div style="margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}/login" 
                           style="background-color: #10B981; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Get Started
                        </a>
                    </div>
                    <p>Happy job hunting!</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">
                        Need help? Contact us at support@jobportal.com
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Welcome email sent to ${email}`);
        return true;
    } catch (error) {
        logger.error('Error sending welcome email:', error);
        throw error;
    }
};

// Send application status update email
export const sendApplicationStatusEmail = async (email, fullname, jobTitle, companyName, status, message) => {
    try {
        const transporter = createTransporter();
        
        const statusColors = {
            accepted: '#10B981',
            rejected: '#DC2626',
            pending: '#F59E0B'
        };

        const statusEmojis = {
            accepted: '🎉',
            rejected: '😔',
            pending: '⏳'
        };

        const statusMessages = {
            accepted: 'Congratulations! Your application has been accepted.',
            rejected: 'Unfortunately, your application was not successful this time.',
            pending: 'Your application is currently under review.'
        };

        const mailOptions = {
            from: `"Job Portal" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Application Update: ${jobTitle} at ${companyName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Application Status Update ${statusEmojis[status]}</h2>
                    <p>Hi ${fullname},</p>
                    <p>${statusMessages[status]}</p>
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333;">Application Details</h3>
                        <p style="margin: 5px 0;"><strong>Position:</strong> ${jobTitle}</p>
                        <p style="margin: 5px 0;"><strong>Company:</strong> ${companyName}</p>
                        <p style="margin: 5px 0;"><strong>Status:</strong> 
                            <span style="color: ${statusColors[status]}; font-weight: bold; text-transform: capitalize;">
                                ${status}
                            </span>
                        </p>
                        ${message ? `<p style="margin: 15px 0 5px 0;"><strong>Message from employer:</strong></p>
                        <p style="background-color: white; padding: 10px; border-radius: 4px; margin: 5px 0;">${message}</p>` : ''}
                    </div>
                    ${status === 'accepted' ? `
                    <div style="margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}/jobs" 
                           style="background-color: ${statusColors[status]}; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            View My Applications
                        </a>
                    </div>
                    ` : status === 'rejected' ? `
                    <p>Don't give up! There are many other great opportunities waiting for you.</p>
                    <div style="margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}/jobs" 
                           style="background-color: #4F46E5; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Browse More Jobs
                        </a>
                    </div>
                    ` : ''}
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">
                        You received this email because you applied for a position through Job Portal.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Application status email sent to ${email} for ${jobTitle}`);
        return true;
    } catch (error) {
        logger.error('Error sending application status email:', error);
        throw error;
    }
};

// Send new applicant notification to recruiter
export const sendNewApplicantEmail = async (email, recruiterName, jobTitle, applicantName, applicantEmail) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"Job Portal" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `New Application: ${jobTitle}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">New Job Application Received 📋</h2>
                    <p>Hi ${recruiterName},</p>
                    <p>You have received a new application for your job posting!</p>
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333;">Application Details</h3>
                        <p style="margin: 5px 0;"><strong>Position:</strong> ${jobTitle}</p>
                        <p style="margin: 5px 0;"><strong>Applicant:</strong> ${applicantName}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${applicantEmail}</p>
                        <p style="margin: 5px 0;"><strong>Applied:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    <div style="margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}/admin/jobs" 
                           style="background-color: #4F46E5; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Review Application
                        </a>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">
                        Manage your notification preferences in your account settings.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`New applicant notification sent to ${email} for ${jobTitle}`);
        return true;
    } catch (error) {
        logger.error('Error sending new applicant email:', error);
        throw error;
    }
};

// Send job alert email (matching user preferences)
export const sendJobAlertEmail = async (email, fullname, searchName, jobs) => {
    try {
        const transporter = createTransporter();

        const jobListHtml = jobs.map(job => `
            <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 10px 0; color: #333;">${job.title}</h3>
                <p style="margin: 5px 0; color: #666;"><strong>${job.company.name}</strong></p>
                <p style="margin: 5px 0; color: #666;">📍 ${job.location}</p>
                <p style="margin: 5px 0; color: #666;">💰 ${job.salary ? `₹${job.salary} LPA` : 'Not disclosed'}</p>
                <p style="margin: 5px 0; color: #666;">💼 ${job.jobType}</p>
                <a href="${process.env.FRONTEND_URL}/job/${job._id}" 
                   style="color: #4F46E5; text-decoration: none; font-weight: 500;">
                    View Details →
                </a>
            </div>
        `).join('');

        const mailOptions = {
            from: `"Job Portal" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `${jobs.length} New Job${jobs.length > 1 ? 's' : ''} for "${searchName}"`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                        <h2 style="color: white; margin: 0;">🔔 New Job Alert: ${searchName}</h2>
                    </div>
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                        <p>Hi ${fullname},</p>
                        <p>Great news! We found <strong>${jobs.length} new job${jobs.length > 1 ? 's' : ''}</strong> matching your saved search "<strong>${searchName}</strong>":</p>
                        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            ${jobListHtml}
                        </div>
                        <div style="margin: 30px 0; text-align: center;">
                            <a href="${process.env.FRONTEND_URL}/jobs" 
                               style="background-color: #4F46E5; color: white; padding: 14px 35px; 
                                      text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                                Browse All Jobs
                            </a>
                        </div>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #999; font-size: 12px;">
                            You received this email based on your saved search "${searchName}". 
                            <a href="${process.env.FRONTEND_URL}/saved-searches" style="color: #4F46E5;">Manage your saved searches</a>
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Job alert email sent to ${email} for "${searchName}" with ${jobs.length} jobs`);
        return true;
    } catch (error) {
        logger.error('Error sending job alert email:', error);
        throw error;
    }
};

// Send account lock notification email
export const sendAccountLockEmail = async (email, fullname, unlockTime) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"Job Portal" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Account Locked - Security Alert',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #FEE2E2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h2 style="color: #DC2626; margin: 0;">🔒 Account Temporarily Locked</h2>
                    </div>
                    <p>Hi ${fullname},</p>
                    <p>Your account has been temporarily locked due to multiple failed login attempts.</p>
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333;">Security Details</h3>
                        <p style="margin: 5px 0;"><strong>Locked at:</strong> ${new Date().toLocaleString()}</p>
                        <p style="margin: 5px 0;"><strong>Unlock time:</strong> ${unlockTime}</p>
                        <p style="margin: 5px 0;"><strong>Lock duration:</strong> 30 minutes</p>
                    </div>
                    <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
                        <p style="margin: 0;"><strong>⚠️ Security Recommendation:</strong></p>
                        <p style="margin: 10px 0 0 0;">If you don't recognize these login attempts, we strongly recommend resetting your password immediately.</p>
                    </div>
                    <div style="margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL}/forgot-password" 
                           style="background-color: #DC2626; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Reset Password Now
                        </a>
                    </div>
                    <p style="color: #666;">Your account will automatically unlock in 30 minutes. You can try logging in again after:</p>
                    <p style="background-color: #DBEAFE; padding: 10px; border-radius: 4px; text-align: center; font-weight: bold; color: #1E40AF;">
                        ${unlockTime}
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">
                        If you need immediate assistance, please contact our support team at support@jobportal.com
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Account lock notification sent to ${email}`);
        return true;
    } catch (error) {
        logger.error('Error sending account lock email:', error);
        throw error;
    }
};

// Send company verification status email
export const sendInterviewNotificationEmail = async (email, fullname, jobTitle, companyName, interviewDate, interviewTime, meetingLink = null) => {
    try {
        const subject = `Interview Scheduled - ${jobTitle} at ${companyName}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Interview Scheduled</h2>
                <p>Hi ${fullname},</p>
                <p>Your interview has been scheduled for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Date:</strong> ${interviewDate}</p>
                    <p><strong>Time:</strong> ${interviewTime}</p>
                    ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
                </div>
                <p>Please make sure to arrive on time and be well-prepared.</p>
                <p>Good luck!</p>
            </div>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject,
            html
        });

        logger.info(`Interview notification email sent to ${email}`);
    } catch (error) {
        logger.error('Error sending interview notification email:', error);
        throw error;
    }
};

export const sendCompanyVerificationEmail = async (email, fullname, companyName, status, rejectionReason = null) => {
    try {
        const transporter = createTransporter();
        
        let subject, html;
        
        if (status === 'approved') {
            subject = `${companyName} - Verification Approved! 🎉`;
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; text-align: center;">✅ Verification Approved!</h1>
                    </div>
                    <div style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 10px 10px;">
                        <p style="font-size: 16px;">Hi ${fullname},</p>
                        <p style="font-size: 16px;">Great news! Your company <strong>${companyName}</strong> has been successfully verified.</p>
                        
                        <div style="background-color: #DEF7EC; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #065F46; font-weight: 600;">✓ Benefits of Verified Status:</p>
                            <ul style="color: #065F46; margin: 10px 0;">
                                <li>Verified badge on your company profile</li>
                                <li>Increased visibility to job seekers</li>
                                <li>Auto-approval for quality job postings</li>
                                <li>Priority placement in search results</li>
                            </ul>
                        </div>
                        
                        <p style="font-size: 16px;">You can now start posting jobs and enjoy all the benefits of being a verified employer.</p>
                        
                        <div style="margin: 30px 0; text-align: center;">
                            <a href="${process.env.FRONTEND_URL}/admin/companies" 
                               style="background-color: #10B981; color: white; padding: 14px 32px; 
                                      text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                                View Company Profile
                            </a>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        <p style="color: #6b7280; font-size: 14px; text-align: center;">
                            Thank you for choosing Job Portal!
                        </p>
                    </div>
                </div>
            `;
        } else if (status === 'rejected') {
            subject = `${companyName} - Verification Update Required`;
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; text-align: center;">⚠️ Verification Needs Update</h1>
                    </div>
                    <div style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 10px 10px;">
                        <p style="font-size: 16px;">Hi ${fullname},</p>
                        <p style="font-size: 16px;">We've reviewed your verification request for <strong>${companyName}</strong>. Unfortunately, we need some additional information or corrections before we can approve your verification.</p>
                        
                        <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #92400E; font-weight: 600;">Reason:</p>
                            <p style="color: #92400E; margin: 10px 0 0 0;">${rejectionReason || 'Please review your submitted documents.'}</p>
                        </div>
                        
                        <div style="background-color: #DBEAFE; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #1E40AF; font-weight: 600;">Next Steps:</p>
                            <ol style="color: #1E40AF; margin: 10px 0;">
                                <li>Review the reason above carefully</li>
                                <li>Update or resubmit the required documents</li>
                                <li>Ensure all information is clear and accurate</li>
                                <li>Resubmit for verification</li>
                            </ol>
                        </div>
                        
                        <p style="font-size: 16px;">We're here to help! Please correct the issues and resubmit your verification documents.</p>
                        
                        <div style="margin: 30px 0; text-align: center;">
                            <a href="${process.env.FRONTEND_URL}/admin/companies" 
                               style="background-color: #3B82F6; color: white; padding: 14px 32px; 
                                      text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                                Update Documents
                            </a>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        <p style="color: #6b7280; font-size: 14px; text-align: center;">
                            Need help? Contact us at support@jobportal.com
                        </p>
                    </div>
                </div>
            `;
        }
        
        const mailOptions = {
            from: `"Job Portal" <${process.env.SMTP_USER}>`,
            to: email,
            subject,
            html
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Company verification ${status} email sent to ${email} for ${companyName}`);
        return true;
    } catch (error) {
        logger.error('Error sending company verification email:', error);
        throw error;
    }
};
