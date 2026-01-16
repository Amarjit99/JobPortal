import React, { useState } from 'react';
import axios from 'axios';
import { RESUME_CREDIT_API_END_POINT } from '../utils/constant';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { Lock, Unlock } from 'lucide-react';

const UnlockResumeButton = ({ candidateId, jobId, onUnlock }) => {
    const [loading, setLoading] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);

    const checkAccess = async () => {
        try {
            const res = await axios.get(
                `${RESUME_CREDIT_API_END_POINT}/check/${candidateId}`,
                { withCredentials: true }
            );
            setHasAccess(res.data.hasAccess);
        } catch (error) {
            console.error('Check access error:', error);
        }
    };

    React.useEffect(() => {
        checkAccess();
    }, [candidateId]);

    const handleUnlock = async () => {
        try {
            setLoading(true);
            const res = await axios.post(
                `${RESUME_CREDIT_API_END_POINT}/unlock`,
                {
                    candidateId,
                    jobId
                },
                { withCredentials: true }
            );

            toast.success('Resume unlocked successfully!');
            setHasAccess(true);
            if (onUnlock) onUnlock();
        } catch (error) {
            console.error('Unlock resume error:', error);
            toast.error(error.response?.data?.message || 'Failed to unlock resume');
        } finally {
            setLoading(false);
        }
    };

    if (hasAccess) {
        return (
            <Button variant="outline" disabled>
                <Unlock className="mr-2 h-4 w-4" />
                Resume Unlocked
            </Button>
        );
    }

    return (
        <Button
            onClick={handleUnlock}
            disabled={loading}
            className="bg-[#F83002] hover:bg-[#e02a02]"
        >
            <Lock className="mr-2 h-4 w-4" />
            {loading ? 'Unlocking...' : 'Unlock Resume (1 Credit)'}
        </Button>
    );
};

export default UnlockResumeButton;
