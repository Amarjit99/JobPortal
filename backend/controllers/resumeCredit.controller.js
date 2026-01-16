import { UnlockedResume } from "../models/unlockedResume.model.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";

// Check if resume is unlocked
export const checkResumeAccess = async (req, res) => {
    try {
        const recruiterId = req.id;
        const { candidateId } = req.params;

        const unlocked = await UnlockedResume.findOne({
            recruiterId,
            candidateId
        });

        if (!unlocked) {
            return res.status(200).json({
                success: true,
                hasAccess: false
            });
        }

        const hasAccess = unlocked.isAccessible();

        return res.status(200).json({
            success: true,
            hasAccess,
            unlockedAt: unlocked.unlockedAt,
            expiresAt: unlocked.expiresAt
        });
    } catch (error) {
        console.error('Check resume access error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Unlock resume
export const unlockResume = async (req, res) => {
    try {
        const recruiterId = req.id;
        const { candidateId, jobId } = req.body;

        // Check if already unlocked
        const existing = await UnlockedResume.findOne({ recruiterId, candidateId });
        if (existing && existing.isAccessible()) {
            return res.status(200).json({
                success: true,
                message: "Resume already unlocked",
                unlocked: existing
            });
        }

        // Get active subscription
        const subscription = await Subscription.getActiveSubscription(recruiterId);
        
        if (!subscription) {
            return res.status(403).json({
                success: false,
                message: "No active subscription"
            });
        }

        // Check if can use resume credit
        const canUse = await subscription.canPerformAction('resumeCredit', 1);
        
        if (!canUse.allowed) {
            return res.status(403).json({
                success: false,
                message: canUse.reason
            });
        }

        // Unlock resume
        const unlocked = await UnlockedResume.create({
            recruiterId,
            candidateId,
            jobId,
            creditsUsed: 1
            // expiresAt: null means lifetime access
        });

        // Increment usage
        await subscription.incrementUsage('resumeCredit', 1);

        console.log(`Resume unlocked: recruiter ${recruiterId} -> candidate ${candidateId}`);

        return res.status(201).json({
            success: true,
            message: "Resume unlocked successfully",
            unlocked,
            creditsRemaining: subscription.usage.resumeCredits
        });
    } catch (error) {
        // Handle duplicate unlock attempt
        if (error.code === 11000) {
            return res.status(200).json({
                success: true,
                message: "Resume already unlocked"
            });
        }
        
        console.error('Unlock resume error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get unlocked resumes
export const getUnlockedResumes = async (req, res) => {
    try {
        const recruiterId = req.id;
        const { page = 1, limit = 10 } = req.query;

        const unlocked = await UnlockedResume.find({ recruiterId })
            .populate('candidateId', 'fullname email phoneNumber profile')
            .populate('jobId', 'title company')
            .sort({ unlockedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await UnlockedResume.countDocuments({ recruiterId });

        return res.status(200).json({
            success: true,
            unlocked,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        console.error('Get unlocked resumes error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get credit balance
export const getCreditBalance = async (req, res) => {
    try {
        const userId = req.id;

        const subscription = await Subscription.getActiveSubscription(userId);

        if (!subscription) {
            return res.status(200).json({
                success: true,
                credits: {
                    total: 0,
                    used: 0,
                    remaining: 0
                }
            });
        }

        const plan = await subscription.populate('planId');
        const totalCredits = plan.planId.limits.resumeCredits;
        const usedCredits = subscription.usage.resumeCredits;
        const remaining = totalCredits === 0 ? Infinity : totalCredits - usedCredits;

        return res.status(200).json({
            success: true,
            credits: {
                total: totalCredits,
                used: usedCredits,
                remaining: totalCredits === 0 ? 'Unlimited' : remaining
            }
        });
    } catch (error) {
        console.error('Get credit balance error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
