import React, { useEffect, useState } from 'react'
import Navbar from './shared/Navbar'
import Job from './Job'
import axios from '@/utils/axios'
import { USER_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const SavedJobs = () => {
    const [savedJobs, setSavedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSavedJobs = async () => {
            try {
                const res = await axios.get(`${USER_API_END_POINT}/saved-jobs`, {
                    withCredentials: true
                });

                if (res.data.success) {
                    setSavedJobs(res.data.savedJobs);
                }
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to fetch saved jobs');
            } finally {
                setLoading(false);
            }
        };

        fetchSavedJobs();
    }, []);

    return (
        <div>
            <Navbar />
            <div className='max-w-7xl mx-auto mt-5'>
                <h1 className='font-bold text-2xl mb-5'>Saved Jobs ({savedJobs.length})</h1>
                
                {loading ? (
                    <div className='flex justify-center items-center h-64'>
                        <Loader2 className='h-8 w-8 animate-spin text-[#6A38C2]' />
                    </div>
                ) : savedJobs.length === 0 ? (
                    <div className='text-center py-20'>
                        <p className='text-gray-500 text-lg'>You haven't saved any jobs yet.</p>
                        <p className='text-gray-400 text-sm mt-2'>Browse jobs and click the bookmark icon to save them for later!</p>
                    </div>
                ) : (
                    <div className='grid grid-cols-3 gap-4'>
                        {savedJobs.map((job) => (
                            <Job key={job._id} job={job} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default SavedJobs
