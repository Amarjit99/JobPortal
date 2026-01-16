import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { RESUME_CREDIT_API_END_POINT } from '../utils/constant';
import { Badge } from './ui/badge';
import { Coins } from 'lucide-react';

const CreditBalance = () => {
    const [credits, setCredits] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchBalance();
    }, []);

    const fetchBalance = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${RESUME_CREDIT_API_END_POINT}/balance`, {
                withCredentials: true
            });
            setCredits(res.data.credits);
        } catch (error) {
            console.error('Fetch credits error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !credits) {
        return null;
    }

    const isUnlimited = credits.remaining === 'Unlimited' || credits.total === 0;

    return (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Coins className="h-5 w-5 text-blue-600" />
            <div>
                <p className="text-sm font-semibold">Resume Credits</p>
                <p className="text-xs text-gray-600">
                    {isUnlimited ? (
                        <span className="text-green-600">Unlimited</span>
                    ) : (
                        <>
                            {credits.remaining} / {credits.total} remaining
                        </>
                    )}
                </p>
            </div>
        </div>
    );
};

export default CreditBalance;
