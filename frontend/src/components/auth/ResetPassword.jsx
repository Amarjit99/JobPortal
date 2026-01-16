import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from '@/utils/axios';
import { USER_API_END_POINT } from '@/utils/constant';
import Navbar from '../shared/Navbar';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const token = searchParams.get('token');

    const submitHandler = async (e) => {
        e.preventDefault();
        
        if (!password || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (!token) {
            toast.error('Invalid reset link');
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(`${USER_API_END_POINT}/reset-password?token=${token}`, { password });
            
            if (res.data.success) {
                toast.success(res.data.message);
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Navbar />
            <div className='flex items-center justify-center max-w-7xl mx-auto'>
                <form onSubmit={submitHandler} className='w-1/2 border border-gray-200 rounded-md p-4 my-10'>
                    <h1 className='font-bold text-xl mb-5'>Reset Password</h1>
                    
                    <p className='text-sm text-gray-600 mb-4'>
                        Enter your new password below.
                    </p>
                    
                    <div className='my-2'>
                        <label className='block text-sm font-medium mb-1'>New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter new password"
                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6A38C2]'
                            disabled={loading}
                        />
                    </div>
                    
                    <div className='my-2'>
                        <label className='block text-sm font-medium mb-1'>Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6A38C2]'
                            disabled={loading}
                        />
                    </div>
                    
                    {loading ? (
                        <button className='w-full my-4 bg-[#6A38C2] text-white py-2 rounded-md flex items-center justify-center' disabled>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Resetting...
                        </button>
                    ) : (
                        <button type='submit' className='w-full my-4 bg-[#6A38C2] text-white py-2 rounded-md hover:bg-[#5b30a6]'>
                            Reset Password
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
