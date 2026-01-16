import express from 'express';
import { metrics } from '../utils/metrics.js';
import connectDB from '../utils/db.js';
import redisClient from '../utils/redis.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import { isAdmin } from '../middlewares/isAdmin.js';
import { adminLimiter } from '../config/rateLimiter.js';
import { healthCheck, getMetrics } from '../controllers/monitoring.controller.js';

const router = express.Router();

// Health check and metrics endpoints
router.get('/health', healthCheck);
router.get('/system-metrics', getMetrics);

// Health check endpoint (public)
router.get('/health', async (req, res) => {
    try {
        const health = metrics.getHealthStatus();

        // Check database connection
        try {
            const mongoose = await import('mongoose');
            health.checks.database = {
                status: mongoose.default.connection.readyState === 1 ? 'healthy' : 'unhealthy',
                state: mongoose.default.connection.readyState,
                stateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.default.connection.readyState]
            };
        } catch (error) {
            health.checks.database = {
                status: 'critical',
                error: error.message
            };
        }

        // Check Redis connection
        try {
            if (redisClient && redisClient.isOpen) {
                await redisClient.ping();
                health.checks.redis = {
                    status: 'healthy',
                    connected: true
                };
            } else {
                health.checks.redis = {
                    status: 'warning',
                    connected: false
                };
            }
        } catch (error) {
            health.checks.redis = {
                status: 'critical',
                error: error.message
            };
        }

        // Update overall status based on all checks
        const statuses = Object.values(health.checks).map(check => check.status);
        if (statuses.includes('critical')) {
            health.status = 'critical';
        } else if (statuses.includes('unhealthy') || statuses.includes('warning')) {
            health.status = 'degraded';
        } else {
            health.status = 'healthy';
        }

        const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
        res.status(statusCode).json(health);
    } catch (error) {
        res.status(503).json({
            status: 'critical',
            error: error.message
        });
    }
});

// Detailed metrics endpoint (authenticated admin only)
router.get('/metrics', isAuthenticated, isAdmin, adminLimiter, async (req, res) => {
    try {
        const metricsData = metrics.getMetrics();
        res.status(200).json({
            success: true,
            metrics: metricsData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve metrics',
            error: error.message
        });
    }
});

// Reset metrics (admin only)
router.post('/metrics/reset', isAuthenticated, isAdmin, adminLimiter, (req, res) => {
    try {
        metrics.reset();
        res.status(200).json({
            success: true,
            message: 'Metrics reset successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to reset metrics',
            error: error.message
        });
    }
});

// Get system information (admin only)
router.get('/system', isAuthenticated, isAdmin, adminLimiter, async (req, res) => {
    try {
        const metricsData = metrics.getMetrics();
        res.status(200).json({
            success: true,
            system: metricsData.system
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve system info',
            error: error.message
        });
    }
});

export default router;
