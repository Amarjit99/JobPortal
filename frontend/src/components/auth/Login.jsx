import React, { useEffect, useState } from 'react'
import Navbar from '../shared/Navbar'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { RadioGroup } from '../ui/radio-group'
import { Button } from '../ui/button'
import { Link, useNavigate } from 'react-router-dom'
import axios from '@/utils/axios'
import { USER_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { useDispatch, useSelector } from 'react-redux'
import { setLoading, setUser } from '@/redux/authSlice'
import { Loader2 } from 'lucide-react'
import OAuthButtons from './OAuthButtons'
import RecaptchaComponent from '../shared/RecaptchaComponent'
import TwoFactorVerify from './TwoFactorVerify'
import { csrfService } from '@/utils/csrfService'

const Login = () => {
    const [input, setInput] = useState({
        email: "",
        password: "",
        role: "",
    });
    const [captchaToken, setCaptchaToken] = useState(null);
    const [requires2FA, setRequires2FA] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const { loading,user } = useSelector(store => store.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    }

    const submitHandler = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!input.email || !input.password || !input.role) {
            toast.error('Please fill in all fields and select a role');
            console.log('Missing fields:', {
                email: !!input.email,
                password: !!input.password,
                role: !!input.role
            });
            return;
        }
        
        // Check if reCAPTCHA is enabled and validate
        const isCaptchaEnabled = import.meta.env.VITE_RECAPTCHA_ENABLED !== 'false';
        if (isCaptchaEnabled && !captchaToken) {
            toast.error('Please complete the CAPTCHA verification');
            return;
        }
        
        console.log('Attempting login with:', {
            email: input.email,
            role: input.role,
            hasPassword: !!input.password
        });
        
        try {
            dispatch(setLoading(true));
            const res = await axios.post(`${USER_API_END_POINT}/login`, {
                ...input,
                captchaToken
            }, {
                headers: {
                    "Content-Type": "application/json"
                },
                withCredentials: true,
            });
            
            console.log('Login response:', res.data);
            
            // Check if 2FA is required
            if (res.data.requires2FA) {
                setRequires2FA(true);
                setUserEmail(res.data.email || input.email);
                toast.info('Two-factor authentication required');
                return;
            }
            
            if (res.data.success) {
                const userData = res.data.user;
                if (userData) {
                    console.log('Setting user in Redux:', userData);
                    dispatch(setUser(userData));
                    
                    // Fetch CSRF token after successful login
                    try {
                        await csrfService.getToken();
                        console.log('CSRF token fetched successfully');
                    } catch (csrfError) {
                        console.error('Failed to fetch CSRF token:', csrfError);
                        // Don't block login if CSRF fails
                    }
                    
                    toast.success(res.data.message);
                    // Small delay to ensure Redux updates before navigation
                    setTimeout(() => navigate("/"), 100);
                } else {
                    console.error('No user data in response');
                    toast.error('Login successful but user data missing');
                }
            }
        } catch (error) {
            console.log('Login error:', error);
            console.log('Error response:', error.response?.data);
            
            const errorData = error.response?.data;
            
            // Handle account lock
            if (errorData?.locked) {
                const timeRemaining = errorData.timeRemaining;
                toast.error(errorData.message || `Account locked. Try again in ${timeRemaining} minutes.`, {
                    duration: 5000
                });
            }
            // Handle remaining attempts warning
            else if (errorData?.attemptsLeft !== undefined && errorData.attemptsLeft > 0) {
                toast.error(errorData.message, {
                    duration: 4000,
                    description: `⚠️ Warning: ${errorData.attemptsLeft} attempt${errorData.attemptsLeft !== 1 ? 's' : ''} remaining before account lock`
                });
            }
            // Generic error
            else {
                toast.error(errorData?.message || 'Login failed');
            }
        } finally{
            dispatch(setLoading(false));
        }
    }

    const handle2FAVerify = async (twoFactorToken, backupCode) => {
        try {
            dispatch(setLoading(true));
            const res = await axios.post(`${USER_API_END_POINT}/login`, {
                ...input,
                twoFactorToken,
                backupCode,
                captchaToken
            }, {
                headers: {
                    "Content-Type": "application/json"
                },
                withCredentials: true,
            });
            
            if (res.data.success) {
                const userData = res.data.user;
                if (userData) {
                    dispatch(setUser(userData));
                    
                    // Fetch CSRF token after successful 2FA login
                    try {
                        await csrfService.getToken();
                        console.log('CSRF token fetched successfully after 2FA');
                    } catch (csrfError) {
                        console.error('Failed to fetch CSRF token:', csrfError);
                        // Don't block login if CSRF fails
                    }
                    
                    toast.success(res.data.message);
                    setTimeout(() => navigate("/"), 100);
                }
            }
        } catch (error) {
            const errorData = error.response?.data;
            toast.error(errorData?.message || 'Invalid authentication code');
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handle2FACancel = () => {
        setRequires2FA(false);
        setUserEmail('');
        setInput({ ...input, password: '' });
    };
    
    useEffect(()=>{
        if(user){
            navigate("/");
        }
    },[user, navigate])
    
    // Show 2FA verification screen if required
    if (requires2FA) {
        return (
            <div>
                <Navbar />
                <div className='flex items-center justify-center max-w-7xl mx-auto min-h-screen px-4'>
                    <TwoFactorVerify 
                        email={userEmail}
                        onVerify={handle2FAVerify}
                        onCancel={handle2FACancel}
                    />
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <Navbar />
            <div className='flex items-center justify-center max-w-7xl mx-auto'>
                <form onSubmit={submitHandler} className='w-1/2 border border-gray-200 rounded-md p-4 my-10'>
                    <h1 className='font-bold text-xl mb-5'>Login</h1>
                    <div className='my-2'>
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={input.email}
                            name="email"
                            onChange={changeEventHandler}
                            placeholder="your.email@example.com"
                        />
                    </div>

                    <div className='my-2'>
                        <Label>Password</Label>
                        <Input
                            type="password"
                            value={input.password}
                            name="password"
                            onChange={changeEventHandler}
                            placeholder="********"
                        />
                    </div>
                    <div className='flex items-center justify-between'>
                        <RadioGroup className="flex items-center gap-4 my-5">
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="radio"
                                    name="role"
                                    value="student"
                                    checked={input.role === 'student'}
                                    onChange={changeEventHandler}
                                    className="cursor-pointer"
                                />
                                <Label htmlFor="r1">Student</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="radio"
                                    name="role"
                                    value="recruiter"
                                    checked={input.role === 'recruiter'}
                                    onChange={changeEventHandler}
                                    className="cursor-pointer"
                                />
                                <Label htmlFor="r2">Recruiter</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="radio"
                                    name="role"
                                    value="admin"
                                    checked={input.role === 'admin'}
                                    onChange={changeEventHandler}
                                    className="cursor-pointer"
                                />
                                <Label htmlFor="r3">Admin</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    
                    <RecaptchaComponent 
                        onChange={(token) => setCaptchaToken(token)}
                        onExpired={() => setCaptchaToken(null)}
                        onError={() => setCaptchaToken(null)}
                    />
                    
                    {
                        loading ? <Button className="w-full my-4"> <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Please wait </Button> : <Button type="submit" className="w-full my-4">Login</Button>
                    }
                    
                    <OAuthButtons />
                    
                    <div className='flex items-center justify-between text-sm mt-4'>
                        <span>Don't have an account? <Link to="/signup" className='text-blue-600'>Signup</Link></span>
                        <Link to="/forgot-password" className='text-blue-600 hover:underline'>Forgot Password?</Link>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Login