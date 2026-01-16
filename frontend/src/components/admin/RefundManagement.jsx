import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PAYMENT_API_END_POINT } from '../../utils/constant';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { toast } from 'sonner';

const RefundManagement = () => {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('pending');

    useEffect(() => {
        fetchRefunds();
    }, [filter]);

    const fetchRefunds = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${PAYMENT_API_END_POINT}/refunds`, {
                params: { status: filter },
                withCredentials: true
            });
            setRefunds(res.data.refunds);
        } catch (error) {
            console.error('Fetch refunds error:', error);
        } finally {
            setLoading(false);
        }
    };

    const processRefund = async (refundId, action, notes) => {
        try {
            const res = await axios.post(
                `${PAYMENT_API_END_POINT}/refund/process`,
                {
                    refundId,
                    action,
                    adminNotes: notes
                },
                { withCredentials: true }
            );

            toast.success(`Refund ${action}d successfully`);
            fetchRefunds();
        } catch (error) {
            console.error('Process refund error:', error);
            toast.error(error.response?.data?.message || 'Failed to process refund');
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            pending: 'bg-yellow-500',
            approved: 'bg-blue-500',
            processed: 'bg-green-500',
            rejected: 'bg-red-500',
            failed: 'bg-gray-500'
        };
        return (
            <Badge className={variants[status] || 'bg-gray-500'}>
                {status.toUpperCase()}
            </Badge>
        );
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Refund Management</h1>
                <div className="flex gap-2">
                    <Button
                        variant={filter === 'pending' ? 'default' : 'outline'}
                        onClick={() => setFilter('pending')}
                    >
                        Pending
                    </Button>
                    <Button
                        variant={filter === 'approved' ? 'default' : 'outline'}
                        onClick={() => setFilter('approved')}
                    >
                        Approved
                    </Button>
                    <Button
                        variant={filter === 'rejected' ? 'default' : 'outline'}
                        onClick={() => setFilter('rejected')}
                    >
                        Rejected
                    </Button>
                    <Button
                        variant={filter === 'processed' ? 'default' : 'outline'}
                        onClick={() => setFilter('processed')}
                    >
                        Processed
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : refunds.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    No refund requests found
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Requested</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {refunds.map((refund) => (
                            <TableRow key={refund._id}>
                                <TableCell>{refund.userId?.fullname}</TableCell>
                                <TableCell>₹{refund.amount}</TableCell>
                                <TableCell className="capitalize">
                                    {refund.reason.replace('-', ' ')}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                    {refund.description || 'N/A'}
                                </TableCell>
                                <TableCell>{getStatusBadge(refund.status)}</TableCell>
                                <TableCell>
                                    {new Date(refund.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    {refund.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => processRefund(refund._id, 'approve', '')}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => {
                                                    const notes = prompt('Rejection reason:');
                                                    if (notes) {
                                                        processRefund(refund._id, 'reject', notes);
                                                    }
                                                }}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
};

export default RefundManagement;
