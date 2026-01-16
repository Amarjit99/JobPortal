import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from '@/utils/axios';
import { USER_API_END_POINT } from '@/utils/constant';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');
            
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link');
                return;
            }

            try {
                const res = await axios.get(`${USER_API_END_POINT}/verify-email?token=${token}`);
                
                if (res.data.success) {
                    setStatus('success');
                    setMessage(res.data.message);
                    toast.success(res.data.message);
                    
                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                }
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed');
                toast.error(error.response?.data?.message || 'Verification failed');
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    return (
        <div className='flex items-center justify-center min-h-screen bg-gray-50'>
            <div className='max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center'>
                {status === 'verifying' && (
                    <>
                        <Loader2 className='w-16 h-16 animate-spin text-[#6A38C2] mx-auto mb-4' />
                        <h2 className='text-2xl font-bold mb-2'>Verifying Your Email</h2>
                        <p className='text-gray-600'>Please wait while we verify your email address...</p>
                    </>
                )}
                
                {status === 'success' && (
                    <>
                        <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                            <svg className='w-10 h-10 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M5 13l4 4L19 7' />
                            </svg>
                        </div>
                        <h2 className='text-2xl font-bold mb-2 text-green-600'>Email Verified!</h2>
                        <p className='text-gray-600 mb-4'>{message}</p>
                        <p className='text-sm text-gray-500'>Redirecting to login...</p>
                    </>
                )}
                
                {status === 'error' && (
                    <>
                        <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                            <svg className='w-10 h-10 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                            </svg>
                        </div>
                        <h2 className='text-2xl font-bold mb-2 text-red-600'>Verification Failed</h2>
                        <p className='text-gray-600 mb-6'>{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className='w-full bg-[#6A38C2] text-white py-2 rounded-md hover:bg-[#5b30a6] transition-colors'
                        >
                            Go to Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
