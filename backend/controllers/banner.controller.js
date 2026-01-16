import { Banner } from "../models/banner.model.js";
import logger from "../utils/logger.js";

// Create new banner (Admin only)
export const createBanner = async (req, res) => {
    try {
        const {
            title,
            subtitle,
            image,
            link,
            linkText,
            displayOrder,
            startDate,
            endDate,
            backgroundColor,
            textColor,
            targetAudience
        } = req.body;

        // Validate required fields
        if (!title || !image) {
            return res.status(400).json({
                success: false,
                message: "Title and image are required"
            });
        }

        // Validate date range
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({
                success: false,
                message: "Start date cannot be after end date"
            });
        }

        const banner = await Banner.create({
            title,
            subtitle,
            image,
            link,
            linkText,
            displayOrder: displayOrder || 0,
            startDate,
            endDate,
            backgroundColor,
            textColor,
            targetAudience: targetAudience || 'all'
        });

        logger.info(`Banner created: ${banner._id} by admin ${req.id}`);

        return res.status(201).json({
            success: true,
            message: "Banner created successfully",
            banner
        });
    } catch (error) {
        logger.error('Create banner error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to create banner",
            error: error.message
        });
    }
};

// Get all banners (Admin)
export const getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.find()
            .sort({ displayOrder: 1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            banners,
            count: banners.length
        });
    } catch (error) {
        logger.error('Get all banners error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch banners",
            error: error.message
        });
    }
};

// Get active banners (Public)
export const getActiveBanners = async (req, res) => {
    try {
        const { targetAudience } = req.query;
        
        const banners = await Banner.getActiveBanners(targetAudience);

        // Record impressions
        if (banners.length > 0) {
            await Promise.all(banners.map(banner => banner.recordImpression()));
        }

        return res.status(200).json({
            success: true,
            banners,
            count: banners.length
        });
    } catch (error) {
        logger.error('Get active banners error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch active banners",
            error: error.message
        });
    }
};

// Get single banner by ID
export const getBannerById = async (req, res) => {
    try {
        const { id } = req.params;

        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found"
            });
        }

        return res.status(200).json({
            success: true,
            banner
        });
    } catch (error) {
        logger.error('Get banner by ID error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch banner",
            error: error.message
        });
    }
};

// Update banner (Admin only)
export const updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Validate date range if both provided
        if (updates.startDate && updates.endDate && 
            new Date(updates.startDate) > new Date(updates.endDate)) {
            return res.status(400).json({
                success: false,
                message: "Start date cannot be after end date"
            });
        }

        const banner = await Banner.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found"
            });
        }

        logger.info(`Banner updated: ${banner._id} by admin ${req.id}`);

        return res.status(200).json({
            success: true,
            message: "Banner updated successfully",
            banner
        });
    } catch (error) {
        logger.error('Update banner error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to update banner",
            error: error.message
        });
    }
};

// Toggle banner active status (Admin only)
export const toggleBannerStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found"
            });
        }

        banner.isActive = !banner.isActive;
        await banner.save();

        logger.info(`Banner ${id} status toggled to ${banner.isActive} by admin ${req.id}`);

        return res.status(200).json({
            success: true,
            message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`,
            banner
        });
    } catch (error) {
        logger.error('Toggle banner status error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to toggle banner status",
            error: error.message
        });
    }
};

// Delete banner (Admin only)
export const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;

        const banner = await Banner.findByIdAndDelete(id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found"
            });
        }

        logger.info(`Banner deleted: ${id} by admin ${req.id}`);

        return res.status(200).json({
            success: true,
            message: "Banner deleted successfully"
        });
    } catch (error) {
        logger.error('Delete banner error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete banner",
            error: error.message
        });
    }
};

// Record banner click (Public)
export const recordBannerClick = async (req, res) => {
    try {
        const { id } = req.params;

        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found"
            });
        }

        await banner.recordClick();

        return res.status(200).json({
            success: true,
            message: "Click recorded"
        });
    } catch (error) {
        logger.error('Record banner click error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to record click",
            error: error.message
        });
    }
};

// Update banner display order (Admin only)
export const updateBannerOrder = async (req, res) => {
    try {
        const { banners } = req.body; // Array of { id, displayOrder }

        if (!Array.isArray(banners)) {
            return res.status(400).json({
                success: false,
                message: "Banners must be an array"
            });
        }

        // Update all banners in bulk
        const updatePromises = banners.map(({ id, displayOrder }) =>
            Banner.findByIdAndUpdate(id, { displayOrder })
        );

        await Promise.all(updatePromises);

        logger.info(`Banner order updated by admin ${req.id}`);

        return res.status(200).json({
            success: true,
            message: "Banner order updated successfully"
        });
    } catch (error) {
        logger.error('Update banner order error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to update banner order",
            error: error.message
        });
    }
};

// Get banner analytics (Admin only)
export const getBannerAnalytics = async (req, res) => {
    try {
        const banners = await Banner.find().select('title clicks impressions isActive');

        const analytics = banners.map(banner => ({
            id: banner._id,
            title: banner.title,
            clicks: banner.clicks,
            impressions: banner.impressions,
            ctr: banner.impressions > 0 ? ((banner.clicks / banner.impressions) * 100).toFixed(2) : 0,
            isActive: banner.isActive
        }));

        return res.status(200).json({
            success: true,
            analytics
        });
    } catch (error) {
        logger.error('Get banner analytics error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch banner analytics",
            error: error.message
        });
    }
};
