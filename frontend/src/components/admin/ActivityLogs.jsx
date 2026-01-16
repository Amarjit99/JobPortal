import React, { useState, useEffect } from 'react';
import { History, Filter, Download, Calendar, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import axios from '@/utils/axios';
import { toast } from 'sonner';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');
    const [targetTypeFilter, setTargetTypeFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchActivityLogs();
    }, [actionFilter, targetTypeFilter, startDate, endDate, page]);

    const fetchActivityLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page,
                limit: 50
            });

            if (actionFilter) params.append('action', actionFilter);
            if (targetTypeFilter) params.append('targetType', targetTypeFilter);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await axios.get(
                `http://localhost:8000/api/v1/admin/activity-logs?${params}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setLogs(response.data.logs);
                setTotalPages(response.data.pagination.pages);
            }
        } catch (error) {
            console.error('Error fetching activity logs:', error);
            toast.error('Failed to load activity logs');
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (logs.length === 0) {
            toast.error('No logs to export');
            return;
        }

        const headers = ['Timestamp', 'Admin', 'Action', 'Target Type', 'Target Name', 'Details', 'IP Address'];
        const csvData = logs.map(log => [
            new Date(log.createdAt).toLocaleString(),
            log.performedBy?.fullname || 'Unknown',
            log.action,
            log.targetType,
            log.targetName || '-',
            JSON.stringify(log.details || {}),
            log.ipAddress || '-'
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast.success('Activity logs exported successfully');
    };

    const getActionBadge = (action) => {
        const colors = {
            user_blocked: 'bg-red-100 text-red-800',
            user_unblocked: 'bg-green-100 text-green-800',
            user_role_changed: 'bg-blue-100 text-blue-800',
            user_deleted: 'bg-red-100 text-red-800',
            company_approved: 'bg-green-100 text-green-800',
            company_rejected: 'bg-red-100 text-red-800',
            job_approved: 'bg-green-100 text-green-800',
            job_rejected: 'bg-red-100 text-red-800',
            job_flagged: 'bg-orange-100 text-orange-800',
            job_deleted: 'bg-red-100 text-red-800',
            bulk_action_performed: 'bg-purple-100 text-purple-800'
        };

        const actionText = action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        return (
            <Badge className={colors[action] || 'bg-gray-100 text-gray-800'}>
                {actionText}
            </Badge>
        );
    };

    const formatDetails = (details) => {
        if (!details || Object.keys(details).length === 0) return '-';
        
        return Object.entries(details)
            .map(([key, value]) => {
                const formattedKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
                return `${formattedKey}: ${typeof value === 'object' ? JSON.stringify(value) : value}`;
            })
            .join(', ');
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                            <History className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Activity Logs</h1>
                            <p className="text-gray-500">Track all administrative actions</p>
                        </div>
                    </div>
                    <Button onClick={exportToCSV} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-4 gap-4">
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by action" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Actions</SelectItem>
                            <SelectItem value="user_blocked">User Blocked</SelectItem>
                            <SelectItem value="user_unblocked">User Unblocked</SelectItem>
                            <SelectItem value="user_role_changed">Role Changed</SelectItem>
                            <SelectItem value="company_approved">Company Approved</SelectItem>
                            <SelectItem value="company_rejected">Company Rejected</SelectItem>
                            <SelectItem value="job_approved">Job Approved</SelectItem>
                            <SelectItem value="job_rejected">Job Rejected</SelectItem>
                            <SelectItem value="job_flagged">Job Flagged</SelectItem>
                            <SelectItem value="bulk_action_performed">Bulk Action</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by target" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Targets</SelectItem>
                            <SelectItem value="User">User</SelectItem>
                            <SelectItem value="Company">Company</SelectItem>
                            <SelectItem value="Job">Job</SelectItem>
                            <SelectItem value="Application">Application</SelectItem>
                        </SelectContent>
                    </Select>

                    <div>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            placeholder="Start date"
                        />
                    </div>

                    <div>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            placeholder="End date"
                        />
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            )}

            {/* Empty State */}
            {!loading && logs.length === 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No activity logs</h3>
                    <p className="text-gray-500">No administrative actions found for the selected filters</p>
                </div>
            )}

            {/* Logs Table */}
            {!loading && logs.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <Table>
                        <TableCaption>Activity logs ({logs.length} entries)</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Admin</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Target</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>IP Address</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log._id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-3 h-3 text-gray-400" />
                                            {new Date(log.createdAt).toLocaleString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="font-medium text-sm">{log.performedBy?.fullname || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500">{log.performedBy?.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getActionBadge(log.action)}</TableCell>
                                    <TableCell>
                                        <div>
                                            <Badge variant="outline" className="mb-1">{log.targetType}</Badge>
                                            {log.targetName && (
                                                <p className="text-sm text-gray-600">{log.targetName}</p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                        <p className="text-sm text-gray-600 truncate" title={formatDetails(log.details)}>
                                            {formatDetails(log.details)}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-mono text-gray-500">
                                            {log.ipAddress || '-'}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-gray-600">
                            Page {page} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityLogs;
