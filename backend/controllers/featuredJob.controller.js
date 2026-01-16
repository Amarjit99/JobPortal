import { Job } from "../models/job.model.js";
import { Subscription } from "../models/subscription.model.js";

// Feature a job
export const featureJob = async (req, res) => {
    try {
        const { jobId, duration = 30, badge } = req.body; // duration in days
        const userId = req.id;

        // Find job
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Verify ownership
        if (job.created_by.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only feature your own jobs"
            });
        }

        // Check if already featured and active
        if (job.isFeatured && job.featuredUntil > new Date()) {
            return res.status(400).json({
                success: false,
                message: "Job is already featured",
                featuredUntil: job.featuredUntil
            });
        }

        // Get active subscription
        const subscription = await Subscription.getActiveSubscription(userId);

        if (!subscription) {
            return res.status(403).json({
                success: false,
                message: "No active subscription. Please upgrade your plan to feature jobs."
            });
        }

        // Check if can use featured job credit
        const canUse = await subscription.canPerformAction('featuredJob', 1);

        if (!canUse.allowed) {
            return res.status(403).json({
                success: false,
                message: canUse.reason
            });
        }

        // Calculate featured until date
        const featuredUntil = new Date();
        featuredUntil.setDate(featuredUntil.getDate() + duration);

        // Update job
        job.isFeatured = true;
        job.featuredUntil = featuredUntil;
        if (badge) {
            job.badge = badge;
        }
        await job.save();

        // Increment usage
        await subscription.incrementUsage('featuredJob', 1);

        console.log(`Job featured: ${jobId} by user ${userId} until ${featuredUntil}`);

        return res.status(200).json({
            success: true,
            message: "Job featured successfully",
            job,
            creditsRemaining: subscription.usage.featuredJobs
        });
    } catch (error) {
        console.error('Feature job error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Unfeature a job
export const unfeatureJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.id;

        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Verify ownership
        if (job.created_by.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        job.isFeatured = false;
        job.featuredUntil = null;
        job.badge = null;
        await job.save();

        console.log(`Job unfeatured: ${jobId} by user ${userId}`);

        return res.status(200).json({
            success: true,
            message: "Job unfeatured successfully",
            job
        });
    } catch (error) {
        console.error('Unfeature job error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get featured jobs
export const getFeaturedJobs = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const featuredJobs = await Job.find({
            isFeatured: true,
            featuredUntil: { $gt: new Date() },
            isActive: true
        })
        .populate('company', 'name logo')
        .sort({ featuredUntil: -1 })
        .limit(limit * 1);

        return res.status(200).json({
            success: true,
            jobs: featuredJobs,
            count: featuredJobs.length
        });
    } catch (error) {
        console.error('Get featured jobs error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get my featured jobs
export const getMyFeaturedJobs = async (req, res) => {
    try {
        const userId = req.id;

        const featuredJobs = await Job.find({
            created_by: userId,
            isFeatured: true
        })
        .populate('company', 'name logo')
        .sort({ featuredUntil: -1 });

        return res.status(200).json({
            success: true,
            jobs: featuredJobs,
            count: featuredJobs.length
        });
    } catch (error) {
        console.error('Get my featured jobs error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
