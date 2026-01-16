import { Referral } from '../models/referral.model.js';
import { User } from '../models/user.model.js';
import logger from '../utils/logger.js';

export const getMyReferralInfo = async (req, res) => {
    try {
        const userId = req.id;
        let referral = await Referral.findOne({ referrer: userId })
            .populate('referredUsers.user', 'fullname email createdAt');

        if (!referral) {
            const code = Referral.generateCode();
            referral = await Referral.create({
                referrer: userId,
                referralCode: code
            });
        }

        return res.status(200).json({
            message: 'Referral info retrieved',
            referral: {
                code: referral.referralCode,
                link: `${process.env.FRONTEND_URL}/register?ref=${referral.referralCode}`,
                totalRewards: referral.totalRewards,
                rewardsAvailable: referral.rewardsAvailable,
                statistics: referral.statistics,
                referredUsers: referral.referredUsers
            },
            success: true
        });
    } catch (error) {
        logger.error('Error in getMyReferralInfo:', error);
        return res.status(500).json({ message: 'Failed to get referral info', success: false });
    }
};

export const applyReferralCode = async (req, res) => {
    try {
        const userId = req.id;
        const { referralCode } = req.body;

        const referral = await Referral.findOne({ referralCode });
        if (!referral) {
            return res.status(404).json({ message: 'Invalid referral code', success: false });
        }

        if (referral.referrer.toString() === userId) {
            return res.status(400).json({ message: 'Cannot use your own referral code', success: false });
        }

        const alreadyReferred = referral.referredUsers.some(r => r.user.toString() === userId);
        if (alreadyReferred) {
            return res.status(400).json({ message: 'Referral already applied', success: false });
        }

        referral.referredUsers.push({ user: userId, status: 'registered', rewardEarned: 10 });
        referral.totalRewards += 10;
        await referral.updateStatistics();

        return res.status(200).json({
            message: 'Referral code applied successfully',
            reward: 10,
            success: true
        });
    } catch (error) {
        logger.error('Error in applyReferralCode:', error);
        return res.status(500).json({ message: 'Failed to apply referral code', success: false });
    }
};

export const getLeaderboard = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const leaderboard = await Referral.find()
            .sort({ totalRewards: -1 })
            .limit(parseInt(limit))
            .populate('referrer', 'fullname email')
            .select('referrer totalRewards statistics');

        return res.status(200).json({
            message: 'Leaderboard retrieved',
            leaderboard: leaderboard.map((item, index) => ({
                rank: index + 1,
                user: item.referrer,
                totalRewards: item.totalRewards,
                referrals: item.statistics.totalReferrals,
                conversionRate: item.statistics.conversionRate + '%'
            })),
            success: true
        });
    } catch (error) {
        logger.error('Error in getLeaderboard:', error);
        return res.status(500).json({ message: 'Failed to get leaderboard', success: false });
    }
};

export const redeemRewards = async (req, res) => {
    try {
        const userId = req.id;
        const { amount } = req.body;

        const referral = await Referral.findOne({ referrer: userId });
        if (!referral) {
            return res.status(404).json({ message: 'No referral account found', success: false });
        }

        if (referral.rewardsAvailable < amount) {
            return res.status(400).json({ message: 'Insufficient rewards', success: false });
        }

        referral.rewardsRedeemed += amount;
        await referral.updateStatistics();

        return res.status(200).json({
            message: 'Rewards redeemed successfully',
            redeemed: amount,
            remaining: referral.rewardsAvailable,
            success: true
        });
    } catch (error) {
        logger.error('Error in redeemRewards:', error);
        return res.status(500).json({ message: 'Failed to redeem rewards', success: false });
    }
};
