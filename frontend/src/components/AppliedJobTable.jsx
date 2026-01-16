import React, { useState } from 'react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { useSelector } from 'react-redux'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, XCircle } from 'lucide-react'
import ApplicationStatusTimeline from './ApplicationStatusTimeline'
import axios from '@/utils/axios'
import { APPLICATION_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'

const AppliedJobTable = () => {
    const {allAppliedJobs} = useSelector(store=>store.job);
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedRow, setExpandedRow] = useState(null);
    const jobsPerPage = 10;

    // Calculate pagination
    const totalPages = Math.ceil(allAppliedJobs.length / jobsPerPage);
    const startIndex = (currentPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    const currentJobs = allAppliedJobs.slice(startIndex, endIndex);

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const toggleRow = (jobId) => {
        setExpandedRow(expandedRow === jobId ? null : jobId);
    };

    const handleWithdraw = async (applicationId) => {
        if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
            return;
        }
        try {
            const res = await axios.delete(`${APPLICATION_API_END_POINT}/withdraw/${applicationId}`, {
                withCredentials: true
            });
            if (res.data.success) {
                toast.success(res.data.message);
                // Refresh page to update list
                window.location.reload();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to withdraw application');
        }
    };

    return (
        <div>
            <Table>
                <TableCaption>A list of your applied jobs</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Job Role</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        allAppliedJobs.length <= 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">
                                    You haven't applied any job yet.
                                </TableCell>
                            </TableRow>
                        ) : currentJobs.map((appliedJob) => (
                            <React.Fragment key={appliedJob._id}>
                                <TableRow className="hover:bg-gray-50">
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleRow(appliedJob._id)}
                                        >
                                            {expandedRow === appliedJob._id ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TableCell>
                                    <TableCell>{appliedJob?.createdAt?.split("T")[0]}</TableCell>
                                    <TableCell>{appliedJob.job?.title}</TableCell>
                                    <TableCell>{appliedJob.job?.company?.name}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge className={`${appliedJob?.status === "rejected" ? 'bg-red-400' : appliedJob.status === 'pending' ? 'bg-gray-400' : 'bg-green-400'}`}>
                                            {appliedJob.status.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {appliedJob.status === 'pending' && (
                                            <Button
                                                onClick={() => handleWithdraw(appliedJob._id)}
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <XCircle className="h-4 w-4 mr-1" />
                                                Withdraw
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                                {expandedRow === appliedJob._id && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="bg-gray-50">
                                            <div className="p-4">
                                                <ApplicationStatusTimeline application={appliedJob} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))
                    }
                </TableBody>
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className='flex items-center justify-between mt-4'>
                    <div className='text-sm text-gray-600'>
                        Showing {startIndex + 1}-{Math.min(endIndex, allAppliedJobs.length)} of {allAppliedJobs.length} applications
                    </div>
                    <div className='flex gap-2'>
                        <Button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            variant="outline"
                            size="sm"
                        >
                            <ChevronLeft className='h-4 w-4 mr-1' />
                            Previous
                        </Button>
                        <span className='flex items-center px-3 text-sm'>
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            variant="outline"
                            size="sm"
                        >
                            Next
                            <ChevronRight className='h-4 w-4 ml-1' />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AppliedJobTable