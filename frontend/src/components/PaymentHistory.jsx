import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PAYMENT_API_END_POINT } from '../utils/constant';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table";

const PaymentHistory = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // all, success, failed, pending

    useEffect(() => {
        fetchPayments();
    }, [filter]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${PAYMENT_API_END_POINT}/history`, {
                params: filter !== 'all' ? { status: filter } : {},
                withCredentials: true
            });
            setPayments(res.data.payments);
        } catch (error) {
            console.error('Fetch payments error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            success: 'bg-green-500',
            failed: 'bg-red-500',
            pending: 'bg-yellow-500',
            refunded: 'bg-gray-500',
            cancelled: 'bg-gray-400'
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
                <h1 className="text-2xl font-bold">Payment History</h1>
                <div className="flex gap-2">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </Button>
                    <Button
                        variant={filter === 'success' ? 'default' : 'outline'}
                        onClick={() => setFilter('success')}
                    >
                        Success
                    </Button>
                    <Button
                        variant={filter === 'failed' ? 'default' : 'outline'}
                        onClick={() => setFilter('failed')}
                    >
                        Failed
                    </Button>
                    <Button
                        variant={filter === 'pending' ? 'default' : 'outline'}
                        onClick={() => setFilter('pending')}
                    >
                        Pending
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : payments.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    No payment history found
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Billing Cycle</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map((payment) => (
                            <TableRow key={payment._id}>
                                <TableCell className="font-mono text-sm">
                                    {payment.orderId}
                                </TableCell>
                                <TableCell>
                                    {payment.planId?.displayName || 'N/A'}
                                </TableCell>
                                <TableCell>
                                    {payment.currency} {payment.amount}
                                </TableCell>
                                <TableCell className="capitalize">
                                    {payment.billingCycle}
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(payment.status)}
                                </TableCell>
                                <TableCell>
                                    {new Date(payment.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    {payment.status === 'success' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.location.href = `/invoice/${payment._id}`}
                                        >
                                            View Invoice
                                        </Button>
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

export default PaymentHistory;
