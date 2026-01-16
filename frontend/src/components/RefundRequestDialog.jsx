import React, { useState } from 'react';
import axios from 'axios';
import { PAYMENT_API_END_POINT } from '../utils/constant';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

const RefundRequestDialog = ({ paymentId, onSuccess }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!reason) {
            toast.error('Please select a reason');
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(
                `${PAYMENT_API_END_POINT}/refund/request`,
                {
                    paymentId,
                    reason,
                    description
                },
                { withCredentials: true }
            );

            toast.success('Refund request submitted successfully');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Refund request error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit refund request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="reason">Reason for Refund</Label>
                <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="duplicate-payment">Duplicate Payment</SelectItem>
                        <SelectItem value="service-not-delivered">Service Not Delivered</SelectItem>
                        <SelectItem value="not-as-described">Not As Described</SelectItem>
                        <SelectItem value="technical-issue">Technical Issue</SelectItem>
                        <SelectItem value="change-of-mind">Change of Mind</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                    id="description"
                    placeholder="Please provide additional details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                />
            </div>

            <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full"
            >
                {loading ? 'Submitting...' : 'Submit Refund Request'}
            </Button>

            <p className="text-xs text-gray-500">
                Your refund request will be reviewed by our team within 3-5 business days.
            </p>
        </div>
    );
};

export default RefundRequestDialog;
