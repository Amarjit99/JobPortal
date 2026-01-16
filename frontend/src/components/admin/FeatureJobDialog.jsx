import React, { useState } from 'react';
import axios from 'axios';
import { FEATURED_JOB_API_END_POINT } from '../utils/constant';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { toast } from 'sonner';

const FeatureJobDialog = ({ jobId, onSuccess }) => {
    const [duration, setDuration] = useState(30);
    const [badge, setBadge] = useState('featured');
    const [loading, setLoading] = useState(false);

    const handleFeature = async () => {
        try {
            setLoading(true);
            const res = await axios.post(
                `${FEATURED_JOB_API_END_POINT}/feature`,
                {
                    jobId,
                    duration,
                    badge
                },
                { withCredentials: true }
            );

            toast.success('Job featured successfully!');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Feature job error:', error);
            toast.error(error.response?.data?.message || 'Failed to feature job');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="90"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                />
            </div>

            <div>
                <Label htmlFor="badge">Badge</Label>
                <Select value={badge} onValueChange={setBadge}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="featured">Featured</SelectItem>
                        <SelectItem value="hot">Hot</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Button
                onClick={handleFeature}
                disabled={loading}
                className="w-full bg-[#F83002] hover:bg-[#e02a02]"
            >
                {loading ? 'Processing...' : 'Feature This Job'}
            </Button>

            <p className="text-xs text-gray-500">
                This will use 1 featured job credit from your subscription plan.
            </p>
        </div>
    );
};

export default FeatureJobDialog;
