import { useState, useEffect } from 'react';
import axios from '@/utils/axios';
import { MONITORING_API_END_POINT } from '@/utils/constant';

export const useMonitoring = (autoRefresh = false, interval = 5000) => {
    const [health, setHealth] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [system, setSystem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchHealth = async () => {
        try {
            const res = await axios.get(`${MONITORING_API_END_POINT}/health`);
            setHealth(res.data);
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch health status');
            throw err;
        }
    };

    const fetchMetrics = async () => {
        try {
            const res = await axios.get(`${MONITORING_API_END_POINT}/metrics`, {
                withCredentials: true
            });
            setMetrics(res.data.metrics);
            return res.data.metrics;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch metrics');
            throw err;
        }
    };

    const fetchSystem = async () => {
        try {
            const res = await axios.get(`${MONITORING_API_END_POINT}/system`, {
                withCredentials: true
            });
            setSystem(res.data.system);
            return res.data.system;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch system info');
            throw err;
        }
    };

    const resetMetrics = async () => {
        try {
            const res = await axios.post(`${MONITORING_API_END_POINT}/metrics/reset`, {}, {
                withCredentials: true
            });
            return res.data;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset metrics');
            throw err;
        }
    };

    const fetchAll = async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([
                fetchHealth(),
                fetchMetrics(),
                fetchSystem()
            ]);
        } catch (err) {
            console.error('Error fetching monitoring data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();

        if (autoRefresh) {
            const intervalId = setInterval(fetchAll, interval);
            return () => clearInterval(intervalId);
        }
    }, [autoRefresh, interval]);

    return {
        health,
        metrics,
        system,
        loading,
        error,
        fetchHealth,
        fetchMetrics,
        fetchSystem,
        fetchAll,
        resetMetrics
    };
};
