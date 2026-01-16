import mongoose from 'mongoose';
import logger from './logger.js';

/**
 * Create database indexes for optimal query performance
 */
export const createOptimizedIndexes = async () => {
    try {
        const db = mongoose.connection.db;

        // Job collection indexes
        await db.collection('jobs').createIndexes([
            { key: { isActive: 1, createdAt: -1 } },
            { key: { company: 1, isActive: 1 } },
            { key: { location: 1, jobType: 1, isActive: 1 } },
            { key: { salary: 1, isActive: 1 } },
            { key: { experienceLevel: 1, isActive: 1 } },
            { key: { title: 'text', description: 'text', requirements: 'text' } },
            { key: { createdAt: -1 } },
            { key: { 'moderation.status': 1 } }
        ]);

        // Application collection indexes
        await db.collection('applications').createIndexes([
            { key: { applicant: 1, createdAt: -1 } },
            { key: { job: 1, currentStage: 1 } },
            { key: { currentStage: 1, updatedAt: -1 } },
            { key: { applicant: 1, job: 1 }, unique: true },
            { key: { createdAt: -1 } }
        ]);

        // User collection indexes
        await db.collection('users').createIndexes([
            { key: { email: 1 }, unique: true },
            { key: { role: 1, createdAt: -1 } },
            { key: { 'profile.skills': 1 } },
            { key: { lastLogin: -1 } },
            { key: { isVerified: 1, role: 1 } }
        ]);

        // Company collection indexes
        await db.collection('companies').createIndexes([
            { key: { name: 1 } },
            { key: { location: 1 } },
            { key: { 'verification.status': 1 } },
            { key: { createdAt: -1 } }
        ]);

        // Notification collection indexes
        await db.collection('notifications').createIndexes([
            { key: { recipient: 1, isRead: 1, createdAt: -1 } },
            { key: { recipient: 1, type: 1, createdAt: -1 } },
            { key: { recipient: 1, priority: 1, isRead: 1 } },
            { key: { expiresAt: 1 }, expireAfterSeconds: 0 }
        ]);

        // Activity collection indexes
        await db.collection('activities').createIndexes([
            { key: { user: 1, type: 1, createdAt: -1 } },
            { key: { user: 1, createdAt: -1 } },
            { key: { type: 1, createdAt: -1 } },
            { key: { relatedCompany: 1, createdAt: -1 } },
            { key: { createdAt: -1 } },
            { key: { createdAt: 1 }, expireAfterSeconds: 31536000 } // 1 year TTL
        ]);

        logger.info('✓ Database indexes created successfully');
    } catch (error) {
        logger.error('Error creating indexes:', error);
    }
};

/**
 * Analyze slow queries and suggest optimizations
 */
export const analyzeQueryPerformance = async () => {
    try {
        const db = mongoose.connection.db;
        
        // Enable profiling (level 1 = slow operations only)
        await db.admin().command({ profile: 1, slowms: 100 });
        
        logger.info('Query profiling enabled (threshold: 100ms)');
        
        // Get current profiling stats
        const stats = await db.admin().command({ profile: -1 });
        logger.info('Current profiling level:', stats.was);
        
    } catch (error) {
        logger.error('Error analyzing query performance:', error);
    }
};

/**
 * Clean up old/expired data to maintain performance
 */
export const cleanupOldData = async () => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        
        // Clean old search history (>90 days)
        const searchHistoryResult = await mongoose.connection.db
            .collection('searchhistories')
            .deleteMany({ createdAt: { $lt: ninetyDaysAgo } });
        
        // Clean old notifications (>30 days and read)
        const notificationResult = await mongoose.connection.db
            .collection('notifications')
            .deleteMany({ 
                createdAt: { $lt: thirtyDaysAgo },
                isRead: true 
            });
        
        logger.info(`Cleanup completed: ${searchHistoryResult.deletedCount} search histories, ${notificationResult.deletedCount} notifications removed`);
        
    } catch (error) {
        logger.error('Error cleaning up old data:', error);
    }
};

/**
 * Get database statistics
 */
export const getDatabaseStats = async () => {
    try {
        const db = mongoose.connection.db;
        const stats = await db.stats();
        
        return {
            database: db.databaseName,
            collections: stats.collections,
            dataSize: (stats.dataSize / (1024 * 1024)).toFixed(2) + ' MB',
            indexSize: (stats.indexSize / (1024 * 1024)).toFixed(2) + ' MB',
            totalSize: (stats.storageSize / (1024 * 1024)).toFixed(2) + ' MB',
            avgObjSize: (stats.avgObjSize / 1024).toFixed(2) + ' KB'
        };
    } catch (error) {
        logger.error('Error getting database stats:', error);
        return null;
    }
};

export default {
    createOptimizedIndexes,
    analyzeQueryPerformance,
    cleanupOldData,
    getDatabaseStats
};
