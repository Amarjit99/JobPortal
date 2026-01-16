import logger from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';

export const performanceMonitor = (req, res, next) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    // Capture original end function
    const originalEnd = res.end;
    const originalJson = res.json;

    // Track response
    let responseSize = 0;

    // Override json to capture response size
    res.json = function(data) {
        responseSize = JSON.stringify(data).length;
        return originalJson.call(this, data);
    };

    // Override end to capture metrics
    res.end = function(...args) {
        const duration = Date.now() - startTime;
        const memoryUsed = process.memoryUsage().heapUsed - startMemory;

        // Log performance metrics
        const perfData = {
            method: req.method,
            url: req.originalUrl || req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            memoryDelta: `${(memoryUsed / 1024 / 1024).toFixed(2)}MB`,
            responseSize: `${(responseSize / 1024).toFixed(2)}KB`,
            userAgent: req.get('user-agent'),
            ip: req.ip || req.connection.remoteAddress
        };

        // Log based on status code
        if (res.statusCode >= 500) {
            logger.error('Server Error', perfData);
        } else if (res.statusCode >= 400) {
            logger.warn('Client Error', perfData);
        } else if (duration > 1000) {
            logger.warn('Slow Response', perfData);
        } else {
            logger.http('Request', perfData);
        }

        // Record metrics
        metrics.recordRequest(req.method, req.route?.path || req.path, res.statusCode, duration);

        // Alert on slow queries
        if (duration > 3000) {
            logger.error('CRITICAL: Very slow response detected', {
                ...perfData,
                threshold: '3000ms',
                action: 'immediate_investigation_required'
            });
        }

        return originalEnd.apply(this, args);
    };

    next();
};

export const apiMetricsMiddleware = (req, res, next) => {
    // Track endpoint usage
    metrics.incrementEndpointHit(req.route?.path || req.path);
    next();
};
