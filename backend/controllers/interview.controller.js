import { InterviewInvitation } from "../models/interviewInvitation.model.js";
import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import { Conversation } from "../models/conversation.model.js";
import { sendInterviewNotificationEmail } from "../utils/emailService.js";
import logger from "../utils/logger.js";
import { getIO, getSocketId } from "../utils/socket.js";

/**
 * Send interview invitation
 */
export const sendInvitation = async (req, res) => {
    try {
        const recruiterId = req.id;
        const {
            applicationId,
            interviewDate,
            interviewTime,
            duration = 60,
            interviewType,
            location,
            meetingLink,
            interviewRound = 'screening',
            instructions
        } = req.body;

        // Validate required fields
        if (!applicationId || !interviewDate || !interviewTime || !interviewType) {
            return res.status(400).json({
                success: false,
                message: 'Application ID, date, time, and interview type are required'
            });
        }

        // Fetch application
        const application = await Application.findById(applicationId)
            .populate('job')
            .populate('applicant', 'fullname email');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Create interview invitation
        const invitation = await InterviewInvitation.create({
            application: applicationId,
            job: application.job._id,
            candidate: application.applicant._id,
            recruiter: recruiterId,
            company: application.job.company,
            interviewDate,
            interviewTime,
            duration,
            interviewType,
            location: location || '',
            meetingLink: meetingLink || '',
            interviewRound,
            instructions: instructions || '',
            status: 'pending'
        });

        // Update application status
        application.status = 'interview_scheduled';
        await application.save();

        // Send message via in-app messaging
        let conversation = await Conversation.findOne({
            participants: { $all: [recruiterId, application.applicant._id] }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [recruiterId, application.applicant._id],
                relatedJob: application.job._id,
                relatedApplication: applicationId,
                unreadCount: new Map([[application.applicant._id.toString(), 0]])
            });
        }

        const messageContent = `Interview Invitation for ${application.job.title}\n\nDate: ${new Date(interviewDate).toDateString()}\nTime: ${interviewTime}\nType: ${interviewType}\nDuration: ${duration} minutes\n${instructions ? `\nInstructions: ${instructions}` : ''}`;

        await Message.create({
            conversationId: conversation._id,
            senderId: recruiterId,
            receiverId: application.applicant._id,
            content: messageContent,
            messageType: 'interview_invite',
            interviewData: {
                applicationId,
                scheduledDate: interviewDate,
                scheduledTime: interviewTime,
                location,
                meetingLink,
                interviewType,
                notes: instructions
            }
        });

        // Real-time notification
        const candidateSocketId = getSocketId(application.applicant._id.toString());
        if (candidateSocketId) {
            const io = getIO();
            io.to(candidateSocketId).emit('interview_invitation', {
                invitation,
                job: application.job
            });
        }

        // Send email notification
        await sendInterviewNotificationEmail(
            application.applicant.email,
            application.applicant.fullname,
            application.job.title,
            interviewType,
            `${new Date(interviewDate).toDateString()} at ${interviewTime}`,
            meetingLink,
            location
        );

        logger.info(`Interview invitation sent for application ${applicationId}`);

        return res.status(201).json({
            success: true,
            message: 'Interview invitation sent successfully',
            invitation
        });

    } catch (error) {
        logger.error('Error sending interview invitation:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send interview invitation'
        });
    }
};

/**
 * Accept interview invitation
 */
export const acceptInvitation = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const { message } = req.body;
        const candidateId = req.id;

        const invitation = await InterviewInvitation.findById(invitationId);

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'Invitation not found'
            });
        }

        if (invitation.candidate.toString() !== candidateId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to accept this invitation'
            });
        }

        invitation.status = 'accepted';
        invitation.candidateResponse = {
            respondedAt: new Date(),
            message: message || 'I confirm my attendance'
        };

        await invitation.save();

        // Update application status
        await Application.findByIdAndUpdate(invitation.application, {
            status: 'interview_confirmed'
        });

        // Notify recruiter
        const recruiterSocketId = getSocketId(invitation.recruiter.toString());
        if (recruiterSocketId) {
            const io = getIO();
            io.to(recruiterSocketId).emit('interview_accepted', {
                invitationId,
                candidateId
            });
        }

        // Send email notification to recruiter
        const recruiter = await User.findById(invitation.recruiter).select('email fullname');
        if (recruiter) {
            await sendInterviewNotificationEmail(
                recruiter.email,
                recruiter.fullname,
                invitation.job.title,
                invitation.interviewType,
                `${new Date(invitation.interviewDate).toDateString()} at ${invitation.interviewTime}`,
                invitation.meetingLink,
                invitation.location,
                'accepted'
            );
        }

        logger.info(`Interview invitation ${invitationId} accepted by candidate ${candidateId}`);

        return res.status(200).json({
            success: true,
            message: 'Interview invitation accepted',
            invitation
        });

    } catch (error) {
        logger.error('Error accepting invitation:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to accept invitation'
        });
    }
};

/**
 * Decline interview invitation
 */
export const declineInvitation = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const { reason } = req.body;
        const candidateId = req.id;

        const invitation = await InterviewInvitation.findById(invitationId);

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'Invitation not found'
            });
        }

        if (invitation.candidate.toString() !== candidateId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to decline this invitation'
            });
        }

        invitation.status = 'declined';
        invitation.candidateResponse = {
            respondedAt: new Date(),
            message: reason || 'Unable to attend'
        };

        await invitation.save();

        // Update application status
        await Application.findByIdAndUpdate(invitation.application, {
            status: 'interview_declined'
        });

        // Notify recruiter
        const recruiterSocketId = getSocketId(invitation.recruiter.toString());
        if (recruiterSocketId) {
            const io = getIO();
            io.to(recruiterSocketId).emit('interview_declined', {
                invitationId,
                candidateId,
                reason
            });
        }

        // Send email notification to recruiter
        const recruiter = await User.findById(invitation.recruiter).select('email fullname');
        if (recruiter) {
            await sendInterviewNotificationEmail(
                recruiter.email,
                recruiter.fullname,
                invitation.job.title,
                invitation.interviewType,
                `${new Date(invitation.interviewDate).toDateString()} at ${invitation.interviewTime}`,
                invitation.meetingLink,
                invitation.location,
                'declined',
                reason
            );
        }

        logger.info(`Interview invitation ${invitationId} declined by candidate ${candidateId}`);

        return res.status(200).json({
            success: true,
            message: 'Interview invitation declined',
            invitation
        });

    } catch (error) {
        logger.error('Error declining invitation:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to decline invitation'
        });
    }
};

/**
 * Reschedule interview
 */
export const rescheduleInvitation = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const { newDate, newTime, reason } = req.body;
        const userId = req.id;

        if (!newDate || !newTime) {
            return res.status(400).json({
                success: false,
                message: 'New date and time are required'
            });
        }

        const invitation = await InterviewInvitation.findById(invitationId);

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'Invitation not found'
            });
        }

        // Allow both recruiter and candidate to reschedule
        if (invitation.recruiter.toString() !== userId && invitation.candidate.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to reschedule this invitation'
            });
        }

        // Store old schedule
        invitation.rescheduledFrom = {
            date: invitation.interviewDate,
            time: invitation.interviewTime,
            reason: reason || 'Rescheduled'
        };

        invitation.interviewDate = newDate;
        invitation.interviewTime = newTime;
        invitation.status = 'rescheduled';

        await invitation.save();

        // Notify other party
        const otherPartyId = userId === invitation.recruiter.toString() 
            ? invitation.candidate.toString() 
            : invitation.recruiter.toString();

        const otherPartySocketId = getSocketId(otherPartyId);
        if (otherPartySocketId) {
            const io = getIO();
            io.to(otherPartySocketId).emit('interview_rescheduled', {
                invitationId,
                newDate,
                newTime,
                reason
            });
        }

        // Send email notification to the other party
        const otherPartyUser = await User.findById(otherPartyId).select('email fullname');
        const job = await Job.findById(invitation.job).select('title');
        
        if (otherPartyUser && job) {
            await sendInterviewNotificationEmail(
                otherPartyUser.email,
                otherPartyUser.fullname,
                job.title,
                invitation.interviewType,
                `${new Date(newDate).toDateString()} at ${newTime}`,
                invitation.meetingLink,
                invitation.location,
                'rescheduled',
                reason
            );
        }

        logger.info(`Interview ${invitationId} rescheduled by user ${userId}`);

        return res.status(200).json({
            success: true,
            message: 'Interview rescheduled successfully',
            invitation
        });

    } catch (error) {
        logger.error('Error rescheduling invitation:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reschedule invitation'
        });
    }
};

/**
 * Get upcoming interviews for user
 */
export const getUpcomingInterviews = async (req, res) => {
    try {
        const userId = req.id;
        const userRole = req.user.role;

        let query;
        if (userRole === 'recruiter' || userRole === 'admin') {
            query = { recruiter: userId };
        } else {
            query = { candidate: userId };
        }

        // Only upcoming and pending/accepted
        query.interviewDate = { $gte: new Date() };
        query.status = { $in: ['pending', 'accepted', 'rescheduled'] };

        const interviews = await InterviewInvitation.find(query)
            .populate('job', 'title')
            .populate('candidate', 'fullname email')
            .populate('recruiter', 'fullname email')
            .populate('company', 'name logo')
            .sort({ interviewDate: 1, interviewTime: 1 });

        return res.status(200).json({
            success: true,
            interviews
        });

    } catch (error) {
        logger.error('Error fetching upcoming interviews:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch interviews'
        });
    }
};

/**
 * Get company interviews with filters
 */
export const getCompanyInterviews = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { status, date, page = 1, limit = 20 } = req.query;

        let query = { company: companyId };

        if (status) {
            query.status = status;
        }

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            
            query.interviewDate = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const interviews = await InterviewInvitation.find(query)
            .populate('candidate', 'fullname email phone profile.resume')
            .populate('job', 'title')
            .populate('application')
            .populate('interviewers.userId', 'fullname email role')
            .sort({ interviewDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalInterviews = await InterviewInvitation.countDocuments(query);

        const stats = {
            pending: await InterviewInvitation.countDocuments({ company: companyId, status: 'pending' }),
            confirmed: await InterviewInvitation.countDocuments({ company: companyId, status: 'confirmed' }),
            completed: await InterviewInvitation.countDocuments({ company: companyId, status: 'completed' }),
            cancelled: await InterviewInvitation.countDocuments({ company: companyId, status: 'cancelled' })
        };

        return res.status(200).json({
            success: true,
            interviews,
            stats,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalInterviews / parseInt(limit)),
                totalInterviews,
                hasMore: skip + interviews.length < totalInterviews
            }
        });

    } catch (error) {
        logger.error('Error fetching company interviews:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch company interviews'
        });
    }
};

/**
 * Submit detailed interview feedback
 */
export const submitDetailedFeedback = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const feedbackData = req.body;
        const userId = req.id;

        const invitation = await InterviewInvitation.findById(invitationId)
            .populate('candidate', 'fullname email')
            .populate('job', 'title');

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'Interview not found'
            });
        }

        // Authorization: interviewer or recruiter
        const isInterviewer = invitation.interviewers?.some(
            interviewer => interviewer.userId?.toString() === userId
        );
        const isRecruiter = invitation.recruiter.toString() === userId;

        if (!isInterviewer && !isRecruiter) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to submit feedback'
            });
        }

        await invitation.submitFeedback(feedbackData, userId);

        logger.info(`Detailed feedback submitted for interview ${invitationId}`);

        return res.status(200).json({
            success: true,
            message: 'Feedback submitted successfully',
            invitation
        });

    } catch (error) {
        logger.error('Error submitting feedback:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to submit feedback'
        });
    }
};

/**
 * Confirm interview attendance
 */
export const confirmInterview = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const candidateId = req.id;

        const invitation = await InterviewInvitation.findById(invitationId)
            .populate('job', 'title')
            .populate('candidate', 'fullname');

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'Interview not found'
            });
        }

        if (invitation.candidate._id.toString() !== candidateId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to confirm this interview'
            });
        }

        await invitation.confirmAttendance();

        // Notify recruiter
        const recruiterSocketId = getSocketId(invitation.recruiter.toString());
        if (recruiterSocketId) {
            const io = getIO();
            io.to(recruiterSocketId).emit('interview_confirmed', {
                invitationId,
                candidateName: invitation.candidate.fullname,
                jobTitle: invitation.job.title,
                interviewDate: invitation.interviewDate
            });
        }

        logger.info(`Interview ${invitationId} confirmed by candidate ${candidateId}`);

        return res.status(200).json({
            success: true,
            message: 'Interview attendance confirmed',
            invitation
        });

    } catch (error) {
        logger.error('Error confirming interview:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to confirm interview'
        });
    }
};

/**
 * Add internal note to interview
 */
export const addInternalNote = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const { note } = req.body;
        const userId = req.id;

        if (!note || note.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Note text is required'
            });
        }

        const invitation = await InterviewInvitation.findById(invitationId);

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'Interview not found'
            });
        }

        // Only recruiter or interviewers can add notes
        const isRecruiter = invitation.recruiter.toString() === userId;
        const isInterviewer = invitation.interviewers?.some(
            interviewer => interviewer.userId?.toString() === userId
        );

        if (!isRecruiter && !isInterviewer) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to add notes'
            });
        }

        await invitation.addNote(note.trim(), userId);
        
        await invitation.populate('internalNotes.createdBy', 'fullname email role');

        logger.info(`Note added to interview ${invitationId} by user ${userId}`);

        return res.status(201).json({
            success: true,
            message: 'Note added successfully',
            notes: invitation.internalNotes
        });

    } catch (error) {
        logger.error('Error adding note:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add note'
        });
    }
};

/**
 * Cancel interview
 */
export const cancelInterview = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const { reason } = req.body;
        const userId = req.id;

        const invitation = await InterviewInvitation.findById(invitationId)
            .populate('candidate', 'fullname email')
            .populate('job', 'title');

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'Interview not found'
            });
        }

        // Both candidate and recruiter can cancel
        const isCandidate = invitation.candidate._id.toString() === userId;
        const isRecruiter = invitation.recruiter.toString() === userId;

        if (!isCandidate && !isRecruiter) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to cancel this interview'
            });
        }

        await invitation.cancel(userId, reason);

        // Notify the other party
        const otherPartyId = isCandidate ? invitation.recruiter.toString() : invitation.candidate._id.toString();
        const otherPartySocketId = getSocketId(otherPartyId);
        
        if (otherPartySocketId) {
            const io = getIO();
            io.to(otherPartySocketId).emit('interview_cancelled', {
                invitationId,
                cancelledBy: isCandidate ? 'candidate' : 'recruiter',
                reason
            });
        }

        logger.info(`Interview ${invitationId} cancelled by user ${userId}`);

        return res.status(200).json({
            success: true,
            message: 'Interview cancelled successfully',
            invitation
        });

    } catch (error) {
        logger.error('Error cancelling interview:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to cancel interview'
        });
    }
};

export default {
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    rescheduleInvitation,
    getUpcomingInterviews,
    getCompanyInterviews,
    submitDetailedFeedback,
    confirmInterview,
    addInternalNote,
    cancelInterview
};
