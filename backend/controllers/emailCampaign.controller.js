import { EmailCampaign } from '../models/emailCampaign.model.js';
import { User } from '../models/user.model.js';
import logger from '../utils/logger.js';

export const createCampaign = async (req, res) => {
    try {
        const userId = req.id;
        const { name, subject, template, segments, customSegmentFilters, scheduledAt, abTest, tags } = req.body;

        const campaign = await EmailCampaign.create({
            name,
            subject,
            template,
            segments: segments || ['all-users'],
            customSegmentFilters,
            scheduledAt,
            abTest,
            tags,
            createdBy: userId,
            status: scheduledAt ? 'scheduled' : 'draft'
        });

        // Calculate target count
        const targetUsers = await getTargetUsers(segments, customSegmentFilters);
        campaign.targetCount = targetUsers.length;
        await campaign.save();

        return res.status(201).json({
            message: 'Email campaign created successfully',
            campaign,
            success: true
        });
    } catch (error) {
        logger.error('Error in createCampaign:', error);
        return res.status(500).json({ message: 'Failed to create campaign', success: false });
    }
};

export const getCampaigns = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const match = {};
        if (status) match.status = status;

        const campaigns = await EmailCampaign.find(match)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((page - 1) * limit)
            .populate('createdBy', 'fullname email');

        const total = await EmailCampaign.countDocuments(match);

        return res.status(200).json({
            campaigns,
            pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / limit), total },
            success: true
        });
    } catch (error) {
        logger.error('Error in getCampaigns:', error);
        return res.status(500).json({ message: 'Failed to get campaigns', success: false });
    }
};

export const getCampaignById = async (req, res) => {
    try {
        const campaign = await EmailCampaign.findById(req.params.id)
            .populate('createdBy', 'fullname email');

        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found', success: false });
        }

        return res.status(200).json({ campaign, success: true });
    } catch (error) {
        logger.error('Error in getCampaignById:', error);
        return res.status(500).json({ message: 'Failed to get campaign', success: false });
    }
};

export const updateCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const campaign = await EmailCampaign.findById(id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found', success: false });
        }

        if (campaign.status === 'sent') {
            return res.status(400).json({ message: 'Cannot update sent campaign', success: false });
        }

        Object.assign(campaign, updates);
        await campaign.save();

        return res.status(200).json({
            message: 'Campaign updated successfully',
            campaign,
            success: true
        });
    } catch (error) {
        logger.error('Error in updateCampaign:', error);
        return res.status(500).json({ message: 'Failed to update campaign', success: false });
    }
};

export const sendCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const campaign = await EmailCampaign.findById(id);

        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found', success: false });
        }

        campaign.status = 'sending';
        campaign.sentAt = new Date();
        await campaign.save();

        // Simulate sending (in production, integrate with email service like SendGrid)
        const targetUsers = await getTargetUsers(campaign.segments, campaign.customSegmentFilters);
        campaign.sentCount = targetUsers.length;
        campaign.deliveredCount = Math.floor(targetUsers.length * 0.95);
        campaign.openedCount = Math.floor(campaign.deliveredCount * 0.3);
        campaign.clickedCount = Math.floor(campaign.openedCount * 0.15);
        campaign.status = 'sent';
        await campaign.save();

        return res.status(200).json({
            message: 'Campaign sent successfully',
            stats: {
                sent: campaign.sentCount,
                delivered: campaign.deliveredCount,
                openRate: campaign.openRate + '%',
                clickRate: campaign.clickRate + '%'
            },
            success: true
        });
    } catch (error) {
        logger.error('Error in sendCampaign:', error);
        return res.status(500).json({ message: 'Failed to send campaign', success: false });
    }
};

export const getCampaignStats = async (req, res) => {
    try {
        const { id } = req.params;
        const campaign = await EmailCampaign.findById(id);

        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found', success: false });
        }

        return res.status(200).json({
            stats: {
                sent: campaign.sentCount,
                delivered: campaign.deliveredCount,
                opened: campaign.openedCount,
                clicked: campaign.clickedCount,
                bounced: campaign.bouncedCount,
                unsubscribed: campaign.unsubscribedCount,
                openRate: campaign.openRate + '%',
                clickRate: campaign.clickRate + '%',
                bounceRate: campaign.bounceRate + '%'
            },
            success: true
        });
    } catch (error) {
        logger.error('Error in getCampaignStats:', error);
        return res.status(500).json({ message: 'Failed to get stats', success: false });
    }
};

export const deleteCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const campaign = await EmailCampaign.findById(id);

        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found', success: false });
        }

        if (campaign.status === 'sending' || campaign.status === 'sent') {
            return res.status(400).json({ message: 'Cannot delete active/sent campaign', success: false });
        }

        await campaign.deleteOne();
        return res.status(200).json({ message: 'Campaign deleted successfully', success: true });
    } catch (error) {
        logger.error('Error in deleteCampaign:', error);
        return res.status(500).json({ message: 'Failed to delete campaign', success: false });
    }
};

const getTargetUsers = async (segments, filters) => {
    const match = {};
    
    if (segments.includes('students')) match.role = 'student';
    else if (segments.includes('recruiters')) match.role = 'recruiter';
    
    if (filters) {
        if (filters.roles) match.role = { $in: filters.roles };
        if (filters.locations) match.location = { $in: filters.locations };
        if (filters.registeredAfter) match.createdAt = { $gte: filters.registeredAfter };
    }

    return await User.find(match).select('email fullname');
};
