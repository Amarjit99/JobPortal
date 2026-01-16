import React from 'react';
import { useMonitoring } from '@/hooks/useMonitoring';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Activity, Server, Database, Zap, AlertTriangle, CheckCircle, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const Monitoring = () => {
    const { health, metrics, system, loading, error, fetchAll, resetMetrics } = useMonitoring(true, 10000);

    const handleReset = async () => {
        try {
            await resetMetrics();
            await fetchAll();
            toast.success('Metrics reset successfully');
        } catch (err) {
            toast.error('Failed to reset metrics');
        }
    };

    if (loading && !metrics) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error && !metrics) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-lg text-gray-700">{error}</p>
                    <Button onClick={fetchAll} className="mt-4">Retry</Button>
                </div>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        const variants = {
            healthy: 'default',
            warning: 'secondary',
            degraded: 'secondary',
            critical: 'destructive',
            unhealthy: 'destructive'
        };
        const colors = {
            healthy: 'bg-green-500',
            warning: 'bg-yellow-500',
            degraded: 'bg-orange-500',
            critical: 'bg-red-500',
            unhealthy: 'bg-red-500'
        };
        return (
            <Badge variant={variants[status]} className={colors[status]}>
                {status.toUpperCase()}
            </Badge>
        );
    };

    // Prepare chart data
    const methodData = metrics?.requests?.methods?.map(m => ({
        name: m.method,
        count: parseInt(m.count)
    })) || [];

    const errorTypeData = metrics?.errors?.byType?.map(e => ({
        name: e.type,
        value: e.count
    })) || [];

    const COLORS = ['#6A38C2', '#F83002', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">System Monitoring</h1>
                    <p className="text-gray-600 mt-1">Real-time application performance & health</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchAll} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={handleReset} variant="destructive" size="sm">
                        Reset Metrics
                    </Button>
                </div>
            </div>

            {/* Health Status Cards */}
            {health && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Server className="h-4 w-4" />
                                Overall Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                {getStatusBadge(health.status)}
                                <CheckCircle className="h-6 w-6 text-green-500" />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Uptime: {health.checks?.memory?.details?.uptimeFormatted || system?.uptimeFormatted || 'N/A'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Database className="h-4 w-4" />
                                Database
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                {getStatusBadge(health.checks?.database?.status || 'unknown')}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {health.checks?.database?.stateText || 'Checking...'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Redis Cache
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                {getStatusBadge(health.checks?.redis?.status || 'unknown')}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {health.checks?.redis?.connected ? 'Connected' : 'Disconnected'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Response Time
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                {getStatusBadge(health.checks?.responseTime?.status || 'unknown')}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Avg: {health.checks?.responseTime?.avgMs || 0}ms
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Key Metrics */}
            {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{metrics.requests?.total?.toLocaleString() || 0}</div>
                            <p className="text-xs text-green-600 mt-1">
                                ✓ {metrics.requests?.success || 0} successful
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{metrics.requests?.successRate || '0%'}</div>
                            <p className="text-xs text-red-600 mt-1">
                                ✗ {(metrics.requests?.clientError || 0) + (metrics.requests?.serverError || 0)} errors
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Avg Response</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{metrics.requests?.avgResponseTime || 0}ms</div>
                            <p className="text-xs text-orange-600 mt-1">
                                ⚠ {metrics.requests?.slowQueries?.length || 0} slow queries
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Memory Usage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{system?.process?.memoryMB?.heapUsed || 0} MB</div>
                            <p className="text-xs text-gray-600 mt-1">
                                Total: {system?.process?.memoryMB?.heapTotal || 0} MB
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Charts */}
            {metrics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* HTTP Methods Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>HTTP Methods Distribution</CardTitle>
                            <CardDescription>Request count by method</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={methodData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#6A38C2" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Error Types */}
                    {errorTypeData.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Error Distribution</CardTitle>
                                <CardDescription>Errors by type</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={errorTypeData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {errorTypeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Top Endpoints */}
            {metrics?.requests?.endpoints && metrics.requests.endpoints.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Top Endpoints</CardTitle>
                        <CardDescription>Most frequently accessed endpoints</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2">Endpoint</th>
                                        <th className="text-right py-2">Requests</th>
                                        <th className="text-right py-2">Avg Time</th>
                                        <th className="text-right py-2">Min Time</th>
                                        <th className="text-right py-2">Max Time</th>
                                        <th className="text-right py-2">Error Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metrics.requests.endpoints.slice(0, 10).map((endpoint, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="py-2 font-mono text-sm">{endpoint.endpoint}</td>
                                            <td className="text-right">{endpoint.count}</td>
                                            <td className="text-right">{endpoint.avgDuration}ms</td>
                                            <td className="text-right">{endpoint.minDuration}ms</td>
                                            <td className="text-right">{endpoint.maxDuration}ms</td>
                                            <td className="text-right">
                                                <Badge variant={parseFloat(endpoint.errorRate) > 5 ? 'destructive' : 'secondary'}>
                                                    {endpoint.errorRate}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* System Information */}
            {system && (
                <Card>
                    <CardHeader>
                        <CardTitle>System Information</CardTitle>
                        <CardDescription>Server hardware and runtime details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-semibold mb-2">CPU</h3>
                                <p className="text-sm text-gray-600">Cores: {system.cpu?.cores}</p>
                                <p className="text-sm text-gray-600">Model: {system.cpu?.model}</p>
                                <p className="text-sm text-gray-600">
                                    Load: {system.cpu?.loadAverage?.join(', ')}
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Memory</h3>
                                <p className="text-sm text-gray-600">Total: {system.memory?.total} MB</p>
                                <p className="text-sm text-gray-600">Used: {system.memory?.used} MB</p>
                                <p className="text-sm text-gray-600">Free: {system.memory?.free} MB</p>
                                <p className="text-sm text-gray-600">Usage: {system.memory?.usagePercent}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Process</h3>
                                <p className="text-sm text-gray-600">PID: {system.process?.pid}</p>
                                <p className="text-sm text-gray-600">Node: {system.process?.version}</p>
                                <p className="text-sm text-gray-600">Heap Used: {system.process?.memoryMB?.heapUsed} MB</p>
                                <p className="text-sm text-gray-600">RSS: {system.process?.memoryMB?.rss} MB</p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Uptime</h3>
                                <p className="text-sm text-gray-600">{system.uptimeFormatted}</p>
                                <p className="text-sm text-gray-600">{system.uptime?.toLocaleString()} seconds</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Monitoring;
