import { createClient } from 'redis';
import logger from './logger.js';

// Create Redis client
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                logger.error('Redis: Max reconnection attempts reached');
                return new Error('Redis reconnection failed');
            }
            return Math.min(retries * 100, 3000);
        }
    }
});

// Error handling
redisClient.on('error', (err) => {
    logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    logger.info('Redis Client Connected');
});

redisClient.on('ready', () => {
    logger.info('Redis Client Ready');
});

redisClient.on('reconnecting', () => {
    logger.warn('Redis Client Reconnecting...');
});

// Connect to Redis
export const connectRedis = async () => {
    try {
        // Check if Redis is enabled
        const redisEnabled = process.env.REDIS_ENABLED !== 'false';
        if (!redisEnabled) {
            logger.info('Redis is disabled - running without cache');
            return;
        }

        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    } catch (error) {
        logger.error('Failed to connect to Redis:', error);
        logger.info('Continuing without Redis cache...');
        // Don't throw error - app should work without Redis
    }
};

// Cache helper functions
export const cacheHelper = {
    /**
     * Get cached data
     * @param {string} key - Cache key
     * @returns {Promise<any|null>} - Parsed JSON data or null
     */
    async get(key) {
        try {
            if (!redisClient.isOpen) return null;
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error(`Redis get error for key ${key}:`, error);
            return null;
        }
    },

    /**
     * Set cached data with TTL
     * @param {string} key - Cache key
     * @param {any} value - Data to cache (will be JSON stringified)
     * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
     * @returns {Promise<boolean>} - Success status
     */
    async set(key, value, ttl = 300) {
        try {
            if (!redisClient.isOpen) return false;
            await redisClient.setEx(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            logger.error(`Redis set error for key ${key}:`, error);
            return false;
        }
    },

    /**
     * Delete cached data by key
     * @param {string} key - Cache key or pattern
     * @returns {Promise<boolean>} - Success status
     */
    async del(key) {
        try {
            if (!redisClient.isOpen) return false;
            await redisClient.del(key);
            return true;
        } catch (error) {
            logger.error(`Redis del error for key ${key}:`, error);
            return false;
        }
    },

    /**
     * Delete multiple keys by pattern
     * @param {string} pattern - Key pattern (e.g., 'jobs:*')
     * @returns {Promise<number>} - Number of keys deleted
     */
    async delPattern(pattern) {
        try {
            if (!redisClient.isOpen) return 0;
            const keys = await redisClient.keys(pattern);
            if (keys.length === 0) return 0;
            return await redisClient.del(keys);
        } catch (error) {
            logger.error(`Redis delPattern error for pattern ${pattern}:`, error);
            return 0;
        }
    },

    /**
     * Check if key exists
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} - Exists status
     */
    async exists(key) {
        try {
            if (!redisClient.isOpen) return false;
            return await redisClient.exists(key) === 1;
        } catch (error) {
            logger.error(`Redis exists error for key ${key}:`, error);
            return false;
        }
    },

    /**
     * Get cache statistics
     * @returns {Promise<Object>} - Cache stats
     */
    async getStats() {
        try {
            if (!redisClient.isOpen) return { connected: false };
            const info = await redisClient.info('stats');
            return {
                connected: true,
                info: info
            };
        } catch (error) {
            logger.error('Redis stats error:', error);
            return { connected: false, error: error.message };
        }
    }
};

// Cache key generators
export const cacheKeys = {
    allJobs: (query) => {
        const queryString = JSON.stringify(query);
        return `jobs:all:${Buffer.from(queryString).toString('base64')}`;
    },
    jobById: (id) => `job:${id}`,
    allCompanies: (userId) => `companies:user:${userId}`,
    companyById: (id) => `company:${id}`,
    jobApplicants: (jobId) => `job:${jobId}:applicants`,
    userProfile: (userId) => `user:${userId}:profile`
};

// TTL constants (in seconds)
export const TTL = {
    SHORT: 60,           // 1 minute
    MEDIUM: 300,         // 5 minutes
    LONG: 900,           // 15 minutes
    VERY_LONG: 3600      // 1 hour
};

export default redisClient;
