import express from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export const healthCheck = async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0'
        };

        const dbStatus = mongoose.connection.readyState;
        health.database = dbStatus === 1 ? 'connected' : 'disconnected';

        if (dbStatus !== 1) {
            health.status = 'unhealthy';
            return res.status(503).json(health);
        }

        return res.status(200).json(health);
    } catch (error) {
        logger.error('Health check failed:', error);
        return res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
};

export const getMetrics = async (req, res) => {
    try {
        const metrics = {
            memory: {
                used: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
                total: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + ' MB'
            },
            uptime: Math.floor(process.uptime()) + ' seconds',
            cpu: process.cpuUsage(),
            nodeVersion: process.version,
            platform: process.platform
        };

        return res.status(200).json({ metrics, success: true });
    } catch (error) {
        logger.error('Error getting metrics:', error);
        return res.status(500).json({ message: 'Failed to get metrics', success: false });
    }
};
