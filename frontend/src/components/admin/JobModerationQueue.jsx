import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Flag, Eye, AlertTriangle, Building2, User, Calendar, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import axios from '@/utils/axios';
import { toast } from 'sonner';
import VerifiedBadge from '../shared/VerifiedBadge';

const JobModerationQueue = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [viewJobDialogOpen, setViewJobDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [reportsDialogOpen, setReportsDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending,flagged');
    const [reports, setReports] = useState([]);

    useEffect(() => {
        fetchModerationQueue();
    }, [statusFilter]);

    const fetchModerationQueue = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `http://localhost:8000/api/v1/moderation/queue?status=${statusFilter}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setJobs(response.data.jobs);
            }
        } catch (error) {
            console.error('Error fetching moderation queue:', error);
            toast.error('Failed to load moderation queue');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (jobId) => {
        try {
            const response = await axios.put(
                `http://localhost:8000/api/v1/moderation/approve/${jobId}`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Job approved successfully!');
                fetchModerationQueue();
                setViewJobDialogOpen(false);
                setSelectedJob(null);
            }
        } catch (error) {
            console.error('Error approving job:', error);
            toast.error(error.response?.data?.message || 'Failed to approve job');
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        try {
            const response = await axios.put(
                `http://localhost:8000/api/v1/moderation/reject/${selectedJob._id}`,
                { reason: rejectionReason },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Job rejected successfully');
                fetchModerationQueue();
                setRejectDialogOpen(false);
                setViewJobDialogOpen(false);
                setSelectedJob(null);
                setRejectionReason('');
            }
        } catch (error) {
            console.error('Error rejecting job:', error);
            toast.error(error.response?.data?.message || 'Failed to reject job');
        }
    };

    const handleFlag = async (jobId) => {
        try {
            const response = await axios.put(
                `http://localhost:8000/api/v1/moderation/flag/${jobId}`,
                { reason: 'Flagged for further review' },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Job flagged for review');
                fetchModerationQueue();
                setViewJobDialogOpen(false);
                setSelectedJob(null);
            }
        } catch (error) {
            console.error('Error flagging job:', error);
            toast.error(error.response?.data?.message || 'Failed to flag job');
        }
    };

    const viewJobDetails = (job) => {
        setSelectedJob(job);
        setViewJobDialogOpen(true);
    };

    const openRejectDialog = (job) => {
        setSelectedJob(job);
        setRejectDialogOpen(true);
    };

    const fetchReports = async (jobId) => {
        try {
            const response = await axios.get(
                `http://localhost:8000/api/v1/moderation/reports/${jobId}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setReports(response.data.reports);
                setReportsDialogOpen(true);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Failed to load reports');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            case 'flagged':
                return <Badge className="bg-orange-100 text-orange-800">Flagged</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    const getSpamScoreBadge = (score) => {
        if (score >= 80) {
            return <Badge className="bg-red-500 text-white">High Risk ({score})</Badge>;
        } else if (score >= 60) {
            return <Badge className="bg-orange-500 text-white">Medium Risk ({score})</Badge>;
        } else if (score >= 40) {
            return <Badge className="bg-yellow-500 text-white">Low Risk ({score})</Badge>;
        } else {
            return <Badge className="bg-green-500 text-white">Safe ({score})</Badge>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Job Moderation Queue</h1>
                        <p className="text-gray-500">Review and moderate job postings</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    <Button
                        variant={statusFilter === 'pending,flagged' ? 'default' : 'outline'}
                        onClick={() => setStatusFilter('pending,flagged')}
                    >
                        Needs Review
                    </Button>
                    <Button
                        variant={statusFilter === 'pending' ? 'default' : 'outline'}
                        onClick={() => setStatusFilter('pending')}
                    >
                        Pending
                    </Button>
                    <Button
                        variant={statusFilter === 'flagged' ? 'default' : 'outline'}
                        onClick={() => setStatusFilter('flagged')}
                    >
                        Flagged
                    </Button>
                    <Button
                        variant={statusFilter === 'approved' ? 'default' : 'outline'}
                        onClick={() => setStatusFilter('approved')}
                    >
                        Approved
                    </Button>
                    <Button
                        variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                        onClick={() => setStatusFilter('rejected')}
                    >
                        Rejected
                    </Button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                </div>
            )}

            {/* Empty State */}
            {!loading && jobs.length === 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No jobs to review</h3>
                    <p className="text-gray-500">There are no jobs with {statusFilter.replace(',', ' or ')} status</p>
                </div>
            )}

            {/* Jobs Table */}
            {!loading && jobs.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <Table>
                        <TableCaption>Job moderation queue ({jobs.length} jobs)</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Job Title</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Spam Score</TableHead>
                                <TableHead>Posted</TableHead>
                                <TableHead>Reports</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jobs.map((job) => (
                                <TableRow key={job._id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{job.title}</p>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                <MapPin className="w-3 h-3" />
                                                {job.location}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {job.company?.logo ? (
                                                <img src={job.company.logo} alt={job.company.name} className="w-8 h-8 rounded" />
                                            ) : (
                                                <Building2 className="w-8 h-8 text-gray-400" />
                                            )}
                                            <div>
                                                <p className="font-medium text-sm">{job.company?.name}</p>
                                                {job.company?.verification?.status === 'approved' && (
                                                    <VerifiedBadge size="small" />
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(job.moderation?.status)}
                                        {job.moderation?.autoApproved && (
                                            <Badge variant="outline" className="ml-2 text-xs">Auto</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {getSpamScoreBadge(job.moderation?.spamScore || 0)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(job.createdAt).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {job.reports && job.reports.length > 0 ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedJob(job);
                                                    fetchReports(job._id);
                                                }}
                                                className="text-red-600"
                                            >
                                                {job.reports.length} report{job.reports.length !== 1 ? 's' : ''}
                                            </Button>
                                        ) : (
                                            <span className="text-sm text-gray-400">None</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => viewJobDetails(job)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            {(job.moderation?.status === 'pending' || job.moderation?.status === 'flagged') && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleApprove(job._id)}
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => openRejectDialog(job)}
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                    {job.moderation?.status !== 'flagged' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleFlag(job._id)}
                                                            className="text-orange-600"
                                                        >
                                                            <Flag className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Job Details Dialog */}
            <Dialog open={viewJobDialogOpen} onOpenChange={setViewJobDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Job Details</DialogTitle>
                    </DialogHeader>
                    {selectedJob && (
                        <div className="space-y-4">
                            {/* Spam Warning */}
                            {selectedJob.moderation?.spamScore >= 60 && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-red-800">High Spam Score Detected</h4>
                                        <p className="text-sm text-red-700">This job has spam indicators. Please review carefully.</p>
                                    </div>
                                </div>
                            )}

                            {/* Job Info */}
                            <div>
                                <h3 className="text-2xl font-bold">{selectedJob.title}</h3>
                                <div className="flex items-center gap-4 mt-2 text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Building2 className="w-4 h-4" />
                                        {selectedJob.company?.name}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {selectedJob.location}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <Label className="text-base font-semibold">Description</Label>
                                <p className="text-gray-700 mt-1">{selectedJob.description}</p>
                            </div>

                            {/* Requirements */}
                            {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                                <div>
                                    <Label className="text-base font-semibold">Requirements</Label>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                        {selectedJob.requirements.map((req, index) => (
                                            <li key={index} className="text-gray-700">{req}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Job Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-semibold">Salary</Label>
                                    <p className="text-gray-700">₹{selectedJob.salary} LPA</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-semibold">Job Type</Label>
                                    <p className="text-gray-700">{selectedJob.jobType}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-semibold">Experience</Label>
                                    <p className="text-gray-700">{selectedJob.experienceLevel} years</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-semibold">Positions</Label>
                                    <p className="text-gray-700">{selectedJob.position}</p>
                                </div>
                            </div>

                            {/* Moderation Info */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <Label className="text-base font-semibold">Moderation Info</Label>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                    <div>
                                        <span className="text-gray-600">Status:</span>{' '}
                                        {getStatusBadge(selectedJob.moderation?.status)}
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Spam Score:</span>{' '}
                                        {getSpamScoreBadge(selectedJob.moderation?.spamScore || 0)}
                                    </div>
                                    {selectedJob.moderation?.autoApproved && (
                                        <div className="col-span-2">
                                            <Badge variant="outline">Auto-approved (Verified Company)</Badge>
                                        </div>
                                    )}
                                    {selectedJob.moderation?.rejectionReason && (
                                        <div className="col-span-2">
                                            <span className="text-gray-600">Rejection Reason:</span>
                                            <p className="text-red-600 mt-1">{selectedJob.moderation.rejectionReason}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        {selectedJob && (selectedJob.moderation?.status === 'pending' || selectedJob.moderation?.status === 'flagged') && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setViewJobDialogOpen(false)}
                                >
                                    Close
                                </Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleApprove(selectedJob._id)}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        setViewJobDialogOpen(false);
                                        openRejectDialog(selectedJob);
                                    }}
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Job Posting</DialogTitle>
                        <DialogDescription>
                            Provide a reason for rejecting this job. The employer will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <Label htmlFor="reason">Rejection Reason</Label>
                        <Input
                            id="reason"
                            placeholder="e.g., Job description contains spam keywords, unrealistic salary, etc."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setRejectDialogOpen(false);
                            setRejectionReason('');
                        }}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject}>
                            Reject Job
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reports Dialog */}
            <Dialog open={reportsDialogOpen} onOpenChange={setReportsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>User Reports</DialogTitle>
                        <DialogDescription>
                            Reports submitted by users for this job posting
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-auto">
                        {reports.map((report, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <Badge className="mb-2">{report.reason}</Badge>
                                        <p className="text-sm text-gray-600">
                                            Reported by: {report.reportedBy?.fullname || 'Unknown'}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(report.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                {report.description && (
                                    <p className="text-sm text-gray-700 mt-2">{report.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setReportsDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default JobModerationQueue;
