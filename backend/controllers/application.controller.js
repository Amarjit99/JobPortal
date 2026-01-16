import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import logger from "../utils/logger.js";
import { sendApplicationStatusEmail, sendNewApplicantEmail } from "../utils/emailService.js";
import { cacheHelper, cacheKeys } from "../utils/redis.js";
import { emitToUser, NOTIFICATION_TYPES } from "../utils/socket.js";

export const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;
        if (!jobId) {
            return res.status(400).json({
                message: "Job id is required.",
                success: false
            })
        };
        // check if the user has already applied for the job
        const existingApplication = await Application.findOne({ job: jobId, applicant: userId });

        if (existingApplication) {
            return res.status(400).json({
                message: "You have already applied for this jobs",
                success: false
            });
        }

        // check if the jobs exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            })
        }

        // Check if job is inactive
        if (!job.isActive) {
            return res.status(400).json({
                message: "This job is no longer accepting applications",
                success: false
            })
        }

        // Check if job has expired
        if (job.expiresAt && new Date() > new Date(job.expiresAt)) {
            return res.status(400).json({
                message: "Applications for this job have closed",
                success: false
            })
        }

        // create a new application
        const newApplication = await Application.create({
            job:jobId,
            applicant:userId,
        });

        job.applications.push(newApplication._id);
        await job.save();

        // Invalidate job cache (application count changed)
        await cacheHelper.del(cacheKeys.jobById(jobId));
        await cacheHelper.del(cacheKeys.jobApplicants(jobId));

        // Send notification to recruiter
        try {
            const applicant = await User.findById(userId);
            const jobWithCompany = await Job.findById(jobId).populate('company');
            const recruiter = await User.findById(jobWithCompany.created_by);

            if (recruiter && recruiter.emailNotifications?.newApplicants) {
                await sendNewApplicantEmail(
                    recruiter.email,
                    recruiter.fullname,
                    jobWithCompany.title,
                    applicant.fullname,
                    applicant.email
                );
            }

            // Send real-time notification to recruiter
            emitToUser(recruiter._id.toString(), NOTIFICATION_TYPES.NEW_APPLICANT, {
                jobId: jobId,
                jobTitle: jobWithCompany.title,
                applicantName: applicant.fullname,
                applicantId: applicant._id,
                timestamp: new Date()
            });
        } catch (emailError) {
            logger.error('Error sending new applicant email:', emailError);
            // Don't fail the application if email fails
        }

        return res.status(201).json({
            message:"Job applied successfully.",
            success:true
        })
    } catch (error) {
        logger.error('Error in applyJob:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};
export const getAppliedJobs = async (req,res) => {
    try {
        const userId = req.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [applications, total] = await Promise.all([
            Application.find({ applicant: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'job',
                    options: { sort: { createdAt: -1 } },
                    populate: {
                        path: 'company',
                        options: { sort: { createdAt: -1 } }
                    }
                }),
            Application.countDocuments({ applicant: userId })
        ]);

        if(!applications){
            return res.status(404).json({
                message:"No Applications",
                success:false
            })
        };

        return res.status(200).json({
            application: applications,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalApplications: total,
                applicationsPerPage: limit
            },
            success:true
        })
    } catch (error) {
        logger.error('Error in getAppliedJobs:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
// admin dekhega kitna user ne apply kiya hai
export const getApplicants = async (req,res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({
            path:'applications',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'applicant'
            }
        });
        if(!job){
            return res.status(404).json({
                message:'Job not found.',
                success:false
            })
        };
        return res.status(200).json({
            job, 
            success:true
        });
    } catch (error) {
        logger.error('Error in getApplicants:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
export const updateStatus = async (req,res) => {
    try {
        const {status, message} = req.body;
        const applicationId = req.params.id;
        if(!status){
            return res.status(400).json({
                message:'status is required',
                success:false
            })
        };

        // find the application by applicantion id
        const application = await Application.findOne({_id:applicationId})
            .populate('job')
            .populate('applicant');
        if(!application){
            return res.status(404).json({
                message:"Application not found.",
                success:false
            })
        };

        // update the status
        const oldStatus = application.status;
        application.status = status.toLowerCase();
        await application.save();

        // Send notification email if status changed
        if (oldStatus !== status.toLowerCase()) {
            try {
                const applicant = application.applicant;
                const job = await Job.findById(application.job._id).populate('company');

                if (applicant && applicant.emailNotifications?.applicationUpdates) {
                    await sendApplicationStatusEmail(
                        applicant.email,
                        applicant.fullname,
                        job.title,
                        job.company.name,
                        status.toLowerCase(),
                        message || ''
                    );
                }

                // Send real-time notification to applicant
                emitToUser(applicant._id.toString(), NOTIFICATION_TYPES.APPLICATION_STATUS, {
                    applicationId: applicationId,
                    jobTitle: job.title,
                    companyName: job.company.name,
                    status: status.toLowerCase(),
                    message: message || '',
                    timestamp: new Date()
                });
            } catch (emailError) {
                logger.error('Error sending application status email:', emailError);
                // Don't fail the update if email fails
            }
        }

        return res.status(200).json({
            message:"Status updated successfully.",
            success:true
        });

    } catch (error) {
        logger.error('Error in updateStatus:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}

// Withdraw application
export const withdrawApplication = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.id;

        const application = await Application.findById(applicationId)
            .populate({
                path: 'job',
                populate: {
                    path: 'company created_by'
                }
            });

        if (!application) {
            return res.status(404).json({
                message: "Application not found",
                success: false
            });
        }

        // Check if user owns this application
        if (application.applicant.toString() !== userId) {
            return res.status(403).json({
                message: "You are not authorized to withdraw this application",
                success: false
            });
        }

        // Check if application can be withdrawn (only pending applications)
        if (application.status !== 'pending') {
            return res.status(400).json({
                message: `Cannot withdraw ${application.status} application`,
                success: false
            });
        }

        // Remove application from job's applications array
        const { Job } = await import("../models/job.model.js");
        await Job.findByIdAndUpdate(application.job._id, {
            $pull: { applications: applicationId }
        });

        // Delete the application
        await Application.findByIdAndDelete(applicationId);

        // Notify recruiter
        const recruiterId = application.job.created_by._id.toString();
        emitToUser(recruiterId, NOTIFICATION_TYPES.APPLICATION_STATUS, {
            type: 'withdrawal',
            jobTitle: application.job.title,
            applicantName: userId, // Will be populated in real scenario
            timestamp: new Date()
        });

        return res.status(200).json({
            message: "Application withdrawn successfully",
            success: true
        });
    } catch (error) {
        logger.error('Error in withdrawApplication:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

/**
 * Update application stage (recruiter/admin only)
 * PUT /api/v1/application/:id/stage
 */
export const updateApplicationStage = async (req, res) => {
    try {
        const { id } = req.params;
        const { stage, notes, nextStepDate, nextStepDescription } = req.body;
        const userId = req.id;

        if (!stage) {
            return res.status(400).json({
                message: "Stage is required",
                success: false
            });
        }

        const validStages = ['applied', 'screening', 'interview', 'offer', 'rejected', 'hired', 'withdrawn'];
        if (!validStages.includes(stage)) {
            return res.status(400).json({
                message: `Invalid stage. Must be one of: ${validStages.join(', ')}`,
                success: false
            });
        }

        const application = await Application.findById(id)
            .populate('job', 'title company')
            .populate('applicant', 'fullname email');

        if (!application) {
            return res.status(404).json({
                message: "Application not found",
                success: false
            });
        }

        // Update stage with history
        await application.updateStage(stage, userId, notes);

        // Update next step info if provided
        if (nextStepDate) {
            application.nextStepDate = nextStepDate;
        }
        if (nextStepDescription) {
            application.nextStepDescription = nextStepDescription;
        }
        await application.save();

        // Send email notification to applicant
        const stageMessages = {
            screening: 'Your application is under review',
            interview: 'You have been shortlisted for an interview',
            offer: 'Congratulations! You have received a job offer',
            rejected: 'Your application was not successful this time',
            hired: 'Welcome aboard! Your hiring process is complete'
        };

        if (stageMessages[stage]) {
            await sendApplicationStatusEmail(
                application.applicant.email,
                application.applicant.fullname,
                application.job.title,
                application.job.company?.name || 'the company',
                stage,
                stageMessages[stage]
            );
        }

        // Send real-time notification
        await emitToUser(application.applicant._id.toString(), NOTIFICATION_TYPES.APPLICATION_UPDATE, {
            applicationId: application._id,
            jobTitle: application.job.title,
            stage,
            message: stageMessages[stage] || `Application stage updated to ${stage}`,
            timestamp: new Date()
        });

        // Invalidate cache
        await cacheHelper.del(cacheKeys.userApplications(application.applicant._id.toString()));

        logger.info(`Application ${id} stage updated to ${stage} by user ${userId}`);

        return res.status(200).json({
            message: "Application stage updated successfully",
            application,
            success: true
        });

    } catch (error) {
        logger.error('Error updating application stage:', error);
        return res.status(500).json({
            message: "Failed to update application stage",
            success: false
        });
    }
};

/**
 * Get application stage history
 * GET /api/v1/application/:id/history
 */
export const getApplicationHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;

        const application = await Application.findById(id)
            .populate('stageHistory.changedBy', 'fullname email role')
            .populate('applicant', '_id')
            .populate('job', '_id created_by')
            .lean();

        if (!application) {
            return res.status(404).json({
                message: "Application not found",
                success: false
            });
        }

        // Check authorization - applicant or job owner can view
        const isApplicant = application.applicant._id.toString() === userId;
        const isJobOwner = application.job.created_by?.toString() === userId;

        if (!isApplicant && !isJobOwner && req.role !== 'admin') {
            return res.status(403).json({
                message: "You don't have permission to view this application history",
                success: false
            });
        }

        return res.status(200).json({
            stageHistory: application.stageHistory,
            statusHistory: application.statusHistory,
            currentStage: application.currentStage,
            currentStatus: application.status,
            success: true
        });

    } catch (error) {
        logger.error('Error getting application history:', error);
        return res.status(500).json({
            message: "Failed to retrieve application history",
            success: false
        });
    }
};

/**
 * Add notes to application
 * POST /api/v1/application/:id/notes
 */
export const addApplicationNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { noteText } = req.body;
        const userId = req.id;

        if (!noteText || noteText.trim().length === 0) {
            return res.status(400).json({
                message: "Note text is required",
                success: false
            });
        }

        const application = await Application.findById(id)
            .populate('job', 'created_by');

        if (!application) {
            return res.status(404).json({
                message: "Application not found",
                success: false
            });
        }

        // Only job owner/admin can add notes
        if (application.job.created_by.toString() !== userId && req.role !== 'admin') {
            return res.status(403).json({
                message: "You don't have permission to add notes to this application",
                success: false
            });
        }

        application.notes.push({
            noteText: noteText.trim(),
            createdBy: userId,
            createdAt: new Date()
        });

        await application.save();

        // Populate the note's creator info
        await application.populate('notes.createdBy', 'fullname email role');

        logger.info(`Note added to application ${id} by user ${userId}`);

        return res.status(201).json({
            message: "Note added successfully",
            notes: application.notes,
            success: true
        });

    } catch (error) {
        logger.error('Error adding application note:', error);
        return res.status(500).json({
            message: "Failed to add note",
            success: false
        });
    }
};

/**
 * Schedule interview for application
 * POST /api/v1/application/:id/interview
 */
export const scheduleInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { scheduledAt, interviewType, duration, meetingLink, location, interviewers } = req.body;
        const userId = req.id;

        if (!scheduledAt || !interviewType) {
            return res.status(400).json({
                message: "Scheduled time and interview type are required",
                success: false
            });
        }

        const application = await Application.findById(id)
            .populate('job', 'title company created_by')
            .populate('applicant', 'fullname email');

        if (!application) {
            return res.status(404).json({
                message: "Application not found",
                success: false
            });
        }

        // Only job owner/admin can schedule interviews
        if (application.job.created_by.toString() !== userId && req.role !== 'admin') {
            return res.status(403).json({
                message: "You don't have permission to schedule interviews for this application",
                success: false
            });
        }

        // Update interview details
        await application.scheduleInterview({
            scheduledAt,
            interviewType,
            duration: duration || 60,
            meetingLink,
            location,
            interviewers,
            completed: false
        });

        // Update next step
        application.nextStepDate = scheduledAt;
        application.nextStepDescription = `${interviewType} interview scheduled`;
        await application.save();

        // Send email notification
        await sendApplicationStatusEmail(
            application.applicant.email,
            application.applicant.fullname,
            application.job.title,
            application.job.company?.name || 'the company',
            'interview',
            `Your ${interviewType} interview has been scheduled for ${new Date(scheduledAt).toLocaleString()}`
        );

        // Send real-time notification
        await emitToUser(application.applicant._id.toString(), NOTIFICATION_TYPES.INTERVIEW_SCHEDULED, {
            applicationId: application._id,
            jobTitle: application.job.title,
            scheduledAt,
            interviewType,
            timestamp: new Date()
        });

        logger.info(`Interview scheduled for application ${id} on ${scheduledAt}`);

        return res.status(200).json({
            message: "Interview scheduled successfully",
            application,
            success: true
        });

    } catch (error) {
        logger.error('Error scheduling interview:', error);
        return res.status(500).json({
            message: "Failed to schedule interview",
            success: false
        });
    }
};

/**
 * Make job offer for application
 * POST /api/v1/application/:id/offer
 */
export const makeJobOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { salary, joiningDate, benefits } = req.body;
        const userId = req.id;

        if (!salary || !joiningDate) {
            return res.status(400).json({
                message: "Salary and joining date are required",
                success: false
            });
        }

        const application = await Application.findById(id)
            .populate('job', 'title company created_by')
            .populate('applicant', 'fullname email');

        if (!application) {
            return res.status(404).json({
                message: "Application not found",
                success: false
            });
        }

        // Only job owner/admin can make offers
        if (application.job.created_by.toString() !== userId && req.role !== 'admin') {
            return res.status(403).json({
                message: "You don't have permission to make offers for this application",
                success: false
            });
        }

        // Make offer
        await application.makeOffer({
            salary,
            joiningDate,
            benefits
        });

        // Send email notification
        await sendApplicationStatusEmail(
            application.applicant.email,
            application.applicant.fullname,
            application.job.title,
            application.job.company?.name || 'the company',
            'offer',
            `Congratulations! You have received a job offer with a salary of ₹${salary} LPA. Please review and respond.`
        );

        // Send real-time notification
        await emitToUser(application.applicant._id.toString(), NOTIFICATION_TYPES.JOB_OFFER, {
            applicationId: application._id,
            jobTitle: application.job.title,
            salary,
            joiningDate,
            timestamp: new Date()
        });

        logger.info(`Job offer made for application ${id} with salary ${salary}`);

        return res.status(200).json({
            message: "Job offer sent successfully",
            application,
            success: true
        });

    } catch (error) {
        logger.error('Error making job offer:', error);
        return res.status(500).json({
            message: "Failed to make job offer",
            success: false
        });
    }
};