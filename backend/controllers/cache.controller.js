import { cacheHelper } from '../utils/redis.js';
import logger from '../utils/logger.js';

// Get cache statistics
export const getCacheStats = async (req, res) => {
    try {
        const stats = await cacheHelper.getStats();
        
        return res.status(200).json({
            message: 'Cache statistics retrieved',
            stats,
            success: true
        });
    } catch (error) {
        logger.error('Error getting cache stats:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Clear all caches (admin only)
export const clearAllCaches = async (req, res) => {
    try {
        await cacheHelper.delPattern('*');
        
        logger.info('All caches cleared by admin');
        
        return res.status(200).json({
            message: 'All caches cleared successfully',
            success: true
        });
    } catch (error) {
        logger.error('Error clearing caches:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

// Clear specific cache pattern
export const clearCachePattern = async (req, res) => {
    try {
        const { pattern } = req.body;
        
        if (!pattern) {
            return res.status(400).json({
                message: 'Pattern is required',
                success: false
            });
        }
        
        const deletedCount = await cacheHelper.delPattern(pattern);
        
        logger.info(`Cleared ${deletedCount} cache keys matching pattern: ${pattern}`);
        
        return res.status(200).json({
            message: `Cleared ${deletedCount} cache entries`,
            deletedCount,
            success: true
        });
    } catch (error) {
        logger.error('Error clearing cache pattern:', error);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};
