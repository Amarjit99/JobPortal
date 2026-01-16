import React, { useState } from 'react'
import { Button } from './ui/button'
import { Bookmark } from 'lucide-react'
import { Avatar, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import axios from '@/utils/axios'
import { USER_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import VerifiedBadge from './shared/VerifiedBadge'

const Job = ({job}) => {
    const navigate = useNavigate();
    const { user } = useSelector(store => store.auth);
    const [isSaved, setIsSaved] = useState(user?.savedJobs?.includes(job._id) || false);
    const [saving, setSaving] = useState(false);

    const daysAgoFunction = (mongodbTime) => {
        const createdAt = new Date(mongodbTime);
        const currentTime = new Date();
        const timeDifference = currentTime - createdAt;
        return Math.floor(timeDifference/(1000*24*60*60));
    }

    const daysUntilExpiry = (expiryDate) => {
        if (!expiryDate) return null;
        const expiry = new Date(expiryDate);
        const currentTime = new Date();
        const timeDifference = expiry - currentTime;
        const days = Math.floor(timeDifference/(1000*24*60*60));
        return days;
    }

    const getExpiryBadge = () => {
        const days = daysUntilExpiry(job?.expiresAt);
        if (days === null) return null;
        
        if (days <= 0) {
            return <Badge className='bg-gray-400 text-white'>Expired</Badge>;
        } else if (days <= 3) {
            return <Badge className='bg-red-500 text-white'>Expires in {days} day{days !== 1 ? 's' : ''}</Badge>;
        } else if (days <= 7) {
            return <Badge className='bg-orange-500 text-white'>Expires in {days} days</Badge>;
        } else if (days <= 14) {
            return <Badge className='bg-yellow-500 text-white'>Expires in {days} days</Badge>;
        }
        return null; // Don't show badge if more than 14 days
    };

    const handleSaveJob = async () => {
        if (!user) {
            toast.error("Please login to save jobs");
            navigate('/login');
            return;
        }

        setSaving(true);
        try {
            const endpoint = isSaved ? '/unsave-job' : '/save-job';
            const res = await axios.post(`${USER_API_END_POINT}${endpoint}`, 
                { jobId: job._id },
                { withCredentials: true }
            );

            if (res.data.success) {
                setIsSaved(!isSaved);
                toast.success(res.data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save job');
        } finally {
            setSaving(false);
        }
    };
    
    return (
        <div className='p-5 rounded-md shadow-xl bg-white border border-gray-100'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <p className='text-sm text-gray-500'>
                        {daysAgoFunction(job?.createdAt) === 0 ? "Today" : `${daysAgoFunction(job?.createdAt)} days ago`}
                    </p>
                    {getExpiryBadge()}
                </div>
                <Button 
                    variant="outline" 
                    className={`rounded-full ${isSaved ? 'bg-purple-50' : ''}`}
                    size="icon"
                    onClick={handleSaveJob}
                    disabled={saving}
                >
                    <Bookmark className={isSaved ? 'fill-current text-[#7209b7]' : ''} />
                </Button>
            </div>

            <div className='flex items-center gap-2 my-2'>
                <Button className="p-6" variant="outline" size="icon">
                    <Avatar>
                        <AvatarImage src={job?.company?.logo} />
                    </Avatar>
                </Button>
                <div>
                    <div className='flex items-center gap-2'>
                        <h1 className='font-medium text-lg'>{job?.company?.name}</h1>
                        {job?.company?.verification?.status === 'approved' && (
                            <VerifiedBadge size="small" />
                        )}
                    </div>
                    <p className='text-sm text-gray-500'>{job?.location || 'India'}</p>
                </div>
            </div>

            <div>
                <h1 className='font-bold text-lg my-2'>{job?.title}</h1>
                <p className='text-sm text-gray-600'>{job?.description}</p>
            </div>
            <div className='flex items-center gap-2 mt-4'>
                <Badge className={'text-blue-700 font-bold'} variant="ghost">{job?.position} Positions</Badge>
                <Badge className={'text-[#F83002] font-bold'} variant="ghost">{job?.jobType}</Badge>
                <Badge className={'text-[#7209b7] font-bold'} variant="ghost">{job?.salary}LPA</Badge>
            </div>
            <div className='flex items-center gap-4 mt-4'>
                <Button onClick={()=> navigate(`/description/${job?._id}`)} variant="outline">Details</Button>
                <Button 
                    className="bg-[#7209b7]" 
                    onClick={handleSaveJob}
                    disabled={saving}
                >
                    {isSaved ? 'Saved' : 'Save For Later'}
                </Button>
            </div>
        </div>
    )
}

export default Job