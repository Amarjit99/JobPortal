import os from 'os';
import logger from './logger.js';

class MetricsCollector {
    constructor() {
        this.requests = {
            total: 0,
            success: 0,
            clientError: 0,
            serverError: 0,
            byEndpoint: new Map(),
            byMethod: new Map(),
            responseTimes: [],
            slowQueries: []
        };

        this.errors = {
            total: 0,
            byType: new Map(),
            recent: []
        };

        this.system = {
            startTime: Date.now(),
            lastCheck: Date.now()
        };

        // Keep only last 1000 response times
        this.maxResponseTimes = 1000;
        this.maxRecentErrors = 100;
        this.maxSlowQueries = 50;
    }

    recordRequest(method, endpoint, statusCode, duration) {
        this.requests.total++;

        // Categorize by status code
        if (statusCode >= 200 && statusCode < 300) {
            this.requests.success++;
        } else if (statusCode >= 400 && statusCode < 500) {
            this.requests.clientError++;
        } else if (statusCode >= 500) {
            this.requests.serverError++;
        }

        // Track by endpoint
        const endpointKey = `${method} ${endpoint}`;
        const endpointStats = this.requests.byEndpoint.get(endpointKey) || {
            count: 0,
            totalDuration: 0,
            minDuration: Infinity,
            maxDuration: 0,
            errors: 0
        };

        endpointStats.count++;
        endpointStats.totalDuration += duration;
        endpointStats.minDuration = Math.min(endpointStats.minDuration, duration);
        endpointStats.maxDuration = Math.max(endpointStats.maxDuration, duration);
        
        if (statusCode >= 400) {
            endpointStats.errors++;
        }

        this.requests.byEndpoint.set(endpointKey, endpointStats);

        // Track by method
        const methodCount = this.requests.byMethod.get(method) || 0;
        this.requests.byMethod.set(method, methodCount + 1);

        // Record response time
        this.requests.responseTimes.push({
            timestamp: Date.now(),
            duration,
            endpoint: endpointKey,
            statusCode
        });

        // Trim to max size
        if (this.requests.responseTimes.length > this.maxResponseTimes) {
            this.requests.responseTimes.shift();
        }

        // Track slow queries
        if (duration > 1000) {
            this.requests.slowQueries.push({
                timestamp: Date.now(),
                duration,
                endpoint: endpointKey,
                method,
                statusCode
            });

            if (this.requests.slowQueries.length > this.maxSlowQueries) {
                this.requests.slowQueries.shift();
            }
        }
    }

    recordError(error, context = {}) {
        this.errors.total++;

        const errorType = error.name || 'Unknown';
        const errorCount = this.errors.byType.get(errorType) || 0;
        this.errors.byType.set(errorType, errorCount + 1);

        this.errors.recent.push({
            timestamp: Date.now(),
            message: error.message,
            type: errorType,
            stack: error.stack,
            context
        });

        if (this.errors.recent.length > this.maxRecentErrors) {
            this.errors.recent.shift();
        }

        logger.error('Error recorded in metrics', {
            type: errorType,
            message: error.message,
            context
        });
    }

    incrementEndpointHit(endpoint) {
        // Simple counter for dashboard
    }

    getMetrics() {
        const now = Date.now();
        const uptime = now - this.system.startTime;

        // Calculate average response time
        const avgResponseTime = this.requests.responseTimes.length > 0
            ? this.requests.responseTimes.reduce((sum, rt) => sum + rt.duration, 0) / this.requests.responseTimes.length
            : 0;

        // Calculate success rate
        const successRate = this.requests.total > 0
            ? (this.requests.success / this.requests.total) * 100
            : 100;

        // Get endpoint statistics
        const endpointStats = Array.from(this.requests.byEndpoint.entries()).map(([endpoint, stats]) => ({
            endpoint,
            count: stats.count,
            avgDuration: Math.round(stats.totalDuration / stats.count),
            minDuration: stats.minDuration === Infinity ? 0 : stats.minDuration,
            maxDuration: stats.maxDuration,
            errorRate: ((stats.errors / stats.count) * 100).toFixed(2) + '%'
        })).sort((a, b) => b.count - a.count);

        // Get method distribution
        const methodStats = Array.from(this.requests.byMethod.entries()).map(([method, count]) => ({
            method,
            count,
            percentage: ((count / this.requests.total) * 100).toFixed(2) + '%'
        }));

        // System metrics
        const systemMetrics = {
            uptime: Math.floor(uptime / 1000), // seconds
            uptimeFormatted: this.formatUptime(uptime),
            memory: {
                total: Math.round(os.totalmem() / 1024 / 1024),
                free: Math.round(os.freemem() / 1024 / 1024),
                used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024),
                usagePercent: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(2) + '%'
            },
            cpu: {
                cores: os.cpus().length,
                model: os.cpus()[0]?.model,
                loadAverage: os.loadavg().map(load => load.toFixed(2))
            },
            process: {
                memory: process.memoryUsage(),
                memoryMB: {
                    heapUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
                    heapTotal: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2),
                    rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2)
                },
                pid: process.pid,
                version: process.version
            }
        };

        return {
            timestamp: now,
            requests: {
                total: this.requests.total,
                success: this.requests.success,
                clientError: this.requests.clientError,
                serverError: this.requests.serverError,
                successRate: successRate.toFixed(2) + '%',
                avgResponseTime: Math.round(avgResponseTime),
                endpoints: endpointStats,
                methods: methodStats,
                slowQueries: this.requests.slowQueries.slice(-20) // Last 20
            },
            errors: {
                total: this.errors.total,
                byType: Array.from(this.errors.byType.entries()).map(([type, count]) => ({
                    type,
                    count
                })),
                recent: this.errors.recent.slice(-10) // Last 10
            },
            system: systemMetrics
        };
    }

    getHealthStatus() {
        const metrics = this.getMetrics();
        const health = {
            status: 'healthy',
            timestamp: Date.now(),
            uptime: metrics.system.uptime,
            checks: {}
        };

        // Check memory usage
        const memoryUsage = parseFloat(metrics.system.memory.usagePercent);
        health.checks.memory = {
            status: memoryUsage > 90 ? 'critical' : memoryUsage > 75 ? 'warning' : 'healthy',
            usage: metrics.system.memory.usagePercent,
            details: metrics.system.memory
        };

        // Check error rate
        const errorRate = this.requests.total > 0 
            ? (this.errors.total / this.requests.total) * 100 
            : 0;
        health.checks.errors = {
            status: errorRate > 10 ? 'critical' : errorRate > 5 ? 'warning' : 'healthy',
            rate: errorRate.toFixed(2) + '%',
            total: this.errors.total
        };

        // Check response time
        const avgResponseTime = metrics.requests.avgResponseTime;
        health.checks.responseTime = {
            status: avgResponseTime > 2000 ? 'critical' : avgResponseTime > 1000 ? 'warning' : 'healthy',
            avgMs: avgResponseTime,
            slowQueries: this.requests.slowQueries.length
        };

        // Determine overall status
        const statuses = Object.values(health.checks).map(check => check.status);
        if (statuses.includes('critical')) {
            health.status = 'critical';
        } else if (statuses.includes('warning')) {
            health.status = 'warning';
        }

        return health;
    }

    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    reset() {
        this.requests = {
            total: 0,
            success: 0,
            clientError: 0,
            serverError: 0,
            byEndpoint: new Map(),
            byMethod: new Map(),
            responseTimes: [],
            slowQueries: []
        };

        this.errors = {
            total: 0,
            byType: new Map(),
            recent: []
        };

        logger.info('Metrics reset');
    }
}

export const metrics = new MetricsCollector();
