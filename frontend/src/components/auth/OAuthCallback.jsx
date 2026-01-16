import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '@/redux/authSlice';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const handleOAuthCallback = () => {
            const token = searchParams.get('token');
            const provider = searchParams.get('provider');
            const userParam = searchParams.get('user');
            const error = searchParams.get('error');

            // Handle error
            if (error) {
                let errorMessage = 'Authentication failed';
                if (error === 'oauth_failed') {
                    errorMessage = 'OAuth authentication failed. Please try again.';
                } else if (error === 'auth_error') {
                    errorMessage = 'An error occurred during authentication.';
                }
                toast.error(errorMessage);
                navigate('/login');
                return;
            }

            // Handle success
            if (token && userParam) {
                try {
                    const user = JSON.parse(decodeURIComponent(userParam));
                    
                    // Store token in localStorage
                    localStorage.setItem('token', token);
                    
                    // Update Redux store
                    dispatch(setUser(user));
                    
                    // Show success message
                    toast.success(`Welcome back, ${user.fullname}! Logged in via ${provider}.`);
                    
                    // Navigate based on role
                    if (user.role === 'recruiter') {
                        navigate('/admin/companies');
                    } else {
                        navigate('/');
                    }
                } catch (error) {
                    console.error('OAuth callback error:', error);
                    toast.error('Failed to process authentication data');
                    navigate('/login');
                }
            } else {
                toast.error('Missing authentication data');
                navigate('/login');
            }
        };

        handleOAuthCallback();
    }, [searchParams, navigate, dispatch]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#6A38C2]" />
                <p className="mt-4 text-lg font-medium">Completing sign in...</p>
                <p className="mt-2 text-sm text-gray-500">Please wait while we set up your account</p>
            </div>
        </div>
    );
};

export default OAuthCallback;
