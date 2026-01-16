import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from '@/utils/axios';
import { USER_API_END_POINT } from '@/utils/constant';
import Navbar from '../shared/Navbar';
import RecaptchaComponent from '../shared/RecaptchaComponent';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [captchaToken, setCaptchaToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const submitHandler = async (e) => {
        e.preventDefault();
        
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }
        
        // Check if reCAPTCHA is enabled and validate
        const isCaptchaEnabled = import.meta.env.VITE_RECAPTCHA_ENABLED !== 'false';
        if (isCaptchaEnabled && !captchaToken) {
            toast.error('Please complete the CAPTCHA verification');
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(`${USER_API_END_POINT}/forgot-password`, { 
                email,
                captchaToken 
            });
            
            if (res.data.success) {
                setEmailSent(true);
                toast.success(res.data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Navbar />
            <div className='flex items-center justify-center max-w-7xl mx-auto'>
                <form onSubmit={submitHandler} className='w-1/2 border border-gray-200 rounded-md p-4 my-10'>
                    <h1 className='font-bold text-xl mb-5'>Forgot Password</h1>
                    
                    {!emailSent ? (
                        <>
                            <p className='text-sm text-gray-600 mb-4'>
                                Enter your email address and we'll send you a link to reset your password.
                            </p>
                            
                            <div className='my-2'>
                                <label className='block text-sm font-medium mb-1'>Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6A38C2]'
                                    disabled={loading}
                                />
                            </div>
                            
                            <RecaptchaComponent 
                                onChange={(token) => setCaptchaToken(token)}
                                onExpired={() => setCaptchaToken(null)}
                                onError={() => setCaptchaToken(null)}
                            />
                            
                            {loading ? (
                                <button className='w-full my-4 bg-[#6A38C2] text-white py-2 rounded-md flex items-center justify-center' disabled>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Sending...
                                </button>
                            ) : (
                                <button type='submit' className='w-full my-4 bg-[#6A38C2] text-white py-2 rounded-md hover:bg-[#5b30a6]'>
                                    Send Reset Link
                                </button>
                            )}
                            
                            <div className='text-center'>
                                <Link to="/login" className='text-sm text-[#6A38C2] hover:underline'>
                                    Back to Login
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className='text-center py-4'>
                            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                                <svg className='w-10 h-10 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                                </svg>
                            </div>
                            <h3 className='text-lg font-semibold mb-2'>Check Your Email</h3>
                            <p className='text-sm text-gray-600 mb-4'>
                                If an account exists for {email}, you will receive a password reset link shortly.
                            </p>
                            <p className='text-sm text-gray-500 mb-4'>
                                Didn't receive the email? Check your spam folder.
                            </p>
                            <Link to="/login" className='text-[#6A38C2] hover:underline'>
                                Return to Login
                            </Link>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
