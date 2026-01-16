import React, { useEffect, useState } from 'react'
import Navbar from '../shared/Navbar'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { RadioGroup } from '../ui/radio-group'
import { Button } from '../ui/button'
import { Link, useNavigate } from 'react-router-dom'
import { axios, USER_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { useDispatch, useSelector } from 'react-redux'
import { setLoading } from '@/redux/authSlice'
import { Loader2 } from 'lucide-react'
import RecaptchaComponent from '../shared/RecaptchaComponent'
import OAuthButtons from './OAuthButtons'

const Signup = () => {

    const [input, setInput] = useState({
        fullname: "",
        email: "",
        phoneNumber: "",
        password: "",
        role: "",
        file: ""
    });
    const [captchaToken, setCaptchaToken] = useState(null);
    const {loading,user} = useSelector(store=>store.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    }
    const changeFileHandler = (e) => {
        setInput({ ...input, file: e.target.files?.[0] });
    }
    const submitHandler = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!input.fullname || !input.email || !input.phoneNumber || !input.password || !input.role) {
            toast.error('Please fill in all required fields and select a role');
            console.log('Missing fields:', {
                fullname: !!input.fullname,
                email: !!input.email,
                phoneNumber: !!input.phoneNumber,
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
        
        const formData = new FormData();    //formdata object
        formData.append("fullname", input.fullname);
        formData.append("email", input.email);
        formData.append("phoneNumber", input.phoneNumber);
        formData.append("password", input.password);
        formData.append("role", input.role);
        if (captchaToken) {
            formData.append("captchaToken", captchaToken);
        }
        if (input.file) {
            formData.append("file", input.file);
        }
        
        console.log('Submitting signup with:', {
            fullname: input.fullname,
            email: input.email,
            phoneNumber: input.phoneNumber,
            role: input.role,
            hasFile: !!input.file
        });

        try {
            dispatch(setLoading(true));
            const res = await axios.post(`${USER_API_END_POINT}/register`, formData, {
                headers: { 'Content-Type': "multipart/form-data" },
                withCredentials: true,
            });
            if (res.data.success) {
                toast.success(res.data.message);
                
                // If in dev mode without email, show different message
                if (res.data.devMode) {
                    toast.info('Dev Mode: Email verification bypassed - you can login directly', { duration: 5000 });
                    setTimeout(() => navigate('/login'), 2000);
                } else {
                    navigate("/check-email", { state: { email: input.email } });
                }
            }
        } catch (error) {
            console.log('Signup error:', error);
            console.log('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.message || 'Something went wrong';
            toast.error(errorMessage);
            
            // If user already exists, show helpful message
            if (errorMessage.toLowerCase().includes('already exist')) {
                setTimeout(() => {
                    toast.info('Try logging in instead or use a different email');
                }, 1000);
            }
        } finally{
            dispatch(setLoading(false));
        }
    }

    useEffect(()=>{
        if(user){
            navigate("/");
        }
    },[user, navigate])
    return (
        <div>
            <Navbar />
            <div className='flex items-center justify-center max-w-7xl mx-auto'>
                <form onSubmit={submitHandler} className='w-1/2 border border-gray-200 rounded-md p-4 my-10'>
                    <h1 className='font-bold text-xl mb-5'>Sign Up</h1>
                    <div className='my-2'>
                        <Label>Full Name</Label>
                        <Input
                            type="text"
                            value={input.fullname}
                            name="fullname"
                            onChange={changeEventHandler}
                            placeholder="Enter your full name"
                        />
                    </div>
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
                        <Label>Phone Number</Label>
                        <Input
                            type="text"
                            value={input.phoneNumber}
                            name="phoneNumber"
                            onChange={changeEventHandler}
                            placeholder="8080808080"
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
                        <div className='flex items-center gap-2'>
                            <Label>Profile</Label>
                            <Input
                                accept="image/*"
                                type="file"
                                onChange={changeFileHandler}
                                className="cursor-pointer"
                            />
                        </div>
                    </div>
                    
                    <RecaptchaComponent 
                        onChange={(token) => setCaptchaToken(token)}
                        onExpired={() => setCaptchaToken(null)}
                        onError={() => setCaptchaToken(null)}
                    />
                    
                    {
                        loading ? <Button className="w-full my-4"> <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Please wait </Button> : <Button type="submit" className="w-full my-4">Signup</Button>
                    }
                    
                    <OAuthButtons />
                    
                    <span className='text-sm mt-4 block text-center'>Already have an account? <Link to="/login" className='text-blue-600'>Login</Link></span>
                </form>
            </div>
        </div>
    )
}

export default Signup