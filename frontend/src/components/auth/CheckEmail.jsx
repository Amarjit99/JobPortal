import { useNavigate, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';

const CheckEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    return (
        <div className='flex items-center justify-center min-h-screen bg-gray-50'>
            <div className='max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center'>
                <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <Mail className='w-10 h-10 text-blue-600' />
                </div>
                
                <h2 className='text-2xl font-bold mb-2'>Check Your Email</h2>
                <p className='text-gray-600 mb-4'>
                    We've sent a verification link to
                </p>
                {email && (
                    <p className='text-lg font-semibold text-[#6A38C2] mb-4'>
                        {email}
                    </p>
                )}
                
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-left'>
                    <p className='text-sm text-gray-700 mb-2'>
                        <strong>Next steps:</strong>
                    </p>
                    <ol className='text-sm text-gray-600 space-y-1 list-decimal list-inside'>
                        <li>Open your email inbox</li>
                        <li>Click the verification link we sent you</li>
                        <li>You'll be redirected back here automatically</li>
                    </ol>
                </div>

                <p className='text-xs text-gray-500 mb-6'>
                    The verification link will expire in 24 hours
                </p>

                <div className='space-y-2'>
                    <button
                        onClick={() => navigate('/login')}
                        className='w-full bg-[#6A38C2] text-white py-2 rounded-md hover:bg-[#5b30a6] transition-colors'
                    >
                        Go to Login
                    </button>
                    
                    <p className='text-sm text-gray-600'>
                        Didn't receive the email? Check your spam folder or{' '}
                        <button
                            onClick={() => navigate('/signup')}
                            className='text-[#6A38C2] hover:underline font-medium'
                        >
                            try signing up again
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CheckEmail;
