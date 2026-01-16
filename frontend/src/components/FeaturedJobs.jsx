import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FEATURED_JOB_API_END_POINT } from '../utils/constant';
import FeaturedJobCard from './FeaturedJobCard';

const FeaturedJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchFeaturedJobs();
    }, []);

    const fetchFeaturedJobs = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${FEATURED_JOB_API_END_POINT}?limit=10`);
            setJobs(res.data.jobs);
        } catch (error) {
            console.error('Fetch featured jobs error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-10">Loading featured jobs...</div>;
    }

    if (jobs.length === 0) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-6">
                <h2 className="text-2xl font-bold">Featured Jobs</h2>
                <span className="text-sm text-gray-500">
                    ({jobs.length} jobs)
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                    <FeaturedJobCard key={job._id} job={job} />
                ))}
            </div>
        </div>
    );
};

export default FeaturedJobs;
