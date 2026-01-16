import { useState, useEffect } from 'react';
import axios from '@/utils/axios';

export const useCSRFToken = () => {
    const [csrfToken, setCsrfToken] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchToken = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/v1/csrf-token');
            if (response.data.success) {
                setCsrfToken(response.data.csrfToken);
                return response.data.csrfToken;
            }
        } catch (error) {
            console.error('Failed to fetch CSRF token:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Fetch token when component mounts
        fetchToken();

        // Refresh token every 14 minutes (token expires in 15 minutes)
        const interval = setInterval(() => {
            fetchToken();
        }, 14 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    return { csrfToken, refreshToken: fetchToken, isLoading };
};
