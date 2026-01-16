import React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { LogOut, User2, Bell, MessageSquare, Shield, Sparkles, TrendingUp, Award, CreditCard, HelpCircle, ChevronDown, Zap } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { axios, USER_API_END_POINT } from '@/utils/constant'
import { setUser } from '@/redux/authSlice'
import { toast } from 'sonner'
import NotificationBell from './NotificationBell'
import { csrfService } from '@/utils/csrfService'

const Navbar = () => {
    const { user } = useSelector(store => store.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    console.log('Navbar user state:', user); // Debug log

    const logoutHandler = async () => {
        try {
            const res = await axios.get(`${USER_API_END_POINT}/logout`, { withCredentials: true });
            if (res.data.success) {
                // Clear CSRF token on logout
                csrfService.clearToken();
                
                dispatch(setUser(null));
                navigate("/");
                toast.success(res.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response.data.message);
        }
    }
    return (
        <nav className='bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50'>
            <div className='flex items-center justify-between mx-auto max-w-7xl h-16 px-4'>
                <Link to="/" className='flex items-center'>
                    <h1 className='text-2xl font-bold hover:opacity-80 transition'>
                        Job<span className='text-[#F83002]'>Portal</span>
                    </h1>
                </Link>
                
                <div className='flex items-center gap-8'>
                    <ul className='hidden md:flex font-medium items-center gap-6'>
                        {
                            user && user.role === 'admin' ? (
                                <>
                                    <li><Link to="/admin/dashboard" className="hover:text-[#F83002] transition">Dashboard</Link></li>
                                    <li><Link to="/admin/companies" className="hover:text-[#F83002] transition">Companies</Link></li>
                                    <li><Link to="/admin/jobs" className="hover:text-[#F83002] transition">Jobs</Link></li>
                                    <li><Link to="/admin/sub-admins" className="hover:text-[#F83002] transition">Sub-Admins</Link></li>
                                    <li><Link to="/admin/analytics" className="hover:text-[#F83002] transition">Analytics</Link></li>
                                    <li><Link to="/admin/monitoring" className="hover:text-[#F83002] transition">Monitoring</Link></li>
                                </>
                            ) : user && user.role === 'recruiter' ? (
                                <>
                                    <li><Link to="/admin/companies" className="hover:text-[#F83002] transition">Companies</Link></li>
                                    <li><Link to="/admin/jobs" className="hover:text-[#F83002] transition">Jobs</Link></li>
                                    <li><Link to="/recruiter/analytics" className="hover:text-[#F83002] transition">Analytics</Link></li>
                                    <li><Link to="/advanced-features" className="hover:text-[#F83002] transition flex items-center gap-1">
                                        <Zap className="w-4 h-4" />
                                        Features
                                    </Link></li>
                                </>
                            ) : user && user.role === 'student' ? (
                                <>
                                    <li><Link to="/" className="hover:text-[#F83002] transition">Home</Link></li>
                                    <li><Link to="/jobs" className="hover:text-[#F83002] transition">Jobs</Link></li>
                                    <li><Link to="/browse" className="hover:text-[#F83002] transition">Browse</Link></li>
                                    <li><Link to="/saved-jobs" className="hover:text-[#F83002] transition">Saved</Link></li>
                                    <li><Link to="/advanced-features" className="hover:text-[#F83002] transition flex items-center gap-1">
                                        <Zap className="w-4 h-4" />
                                        Features
                                    </Link></li>
                                </>
                            ) : (
                                <>
                                    <li><Link to="/" className="hover:text-[#F83002] transition">Home</Link></li>
                                    <li><Link to="/jobs" className="hover:text-[#F83002] transition">Jobs</Link></li>
                                    <li><Link to="/browse" className="hover:text-[#F83002] transition">Browse</Link></li>
                                </>
                            )
                        }
                    </ul>
                    
                    {
                        !user ? (
                            <div className='flex items-center gap-3'>
                                <Link to="/login">
                                    <Button variant="outline" className="border-[#F83002] text-[#F83002] hover:bg-[#F83002] hover:text-white">
                                        Login
                                    </Button>
                                </Link>
                                <Link to="/signup">
                                    <Button className="bg-[#F83002] hover:bg-[#e02a00]">
                                        Signup
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className='flex items-center gap-3'>
                                <NotificationBell />
                                
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Avatar className="cursor-pointer hover:opacity-80 transition">
                                            <AvatarImage src={user?.profile?.profilePhoto || 'https://github.com/shadcn.png'} alt={user?.fullname} />
                                            <AvatarFallback className="bg-[#F83002] text-white">{user?.fullname?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                                        </Avatar>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 mr-4">
                                        <div>
                                            <div className='flex gap-3 pb-4 border-b'>
                                                <Avatar className="cursor-pointer">
                                                    <AvatarImage src={user?.profile?.profilePhoto || 'https://github.com/shadcn.png'} alt={user?.fullname} />
                                                    <AvatarFallback className="bg-[#F83002] text-white">{user?.fullname?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h4 className='font-semibold'>{user?.fullname}</h4>
                                                    <p className='text-xs text-gray-500'>{user?.profile?.bio || 'No bio added'}</p>
                                                </div>
                                            </div>
                                            
                                            <div className='flex flex-col py-2'>
                                                {
                                                    user && user.role === 'student' && (
                                                        <>
                                                            <Link to="/profile" className='flex items-center gap-3 px-2 py-2 hover:bg-gray-100 rounded transition'>
                                                                <User2 className="w-4 h-4" />
                                                                <span className="text-sm">View Profile</span>
                                                            </Link>
                                                            <Link to="/messages" className='flex items-center gap-3 px-2 py-2 hover:bg-gray-100 rounded transition'>
                                                                <MessageSquare className="w-4 h-4" />
                                                                <span className="text-sm">Messages</span>
                                                            </Link>
                                                            <Link to="/ai-recommendations" className='flex items-center gap-3 px-2 py-2 hover:bg-gray-100 rounded transition'>
                                                                <Sparkles className="w-4 h-4" />
                                                                <span className="text-sm">AI Job Matches</span>
                                                            </Link>
                                                            <Link to="/career-development" className='flex items-center gap-3 px-2 py-2 hover:bg-gray-100 rounded transition'>
                                                                <TrendingUp className="w-4 h-4" />
                                                                <span className="text-sm">Career Development</span>
                                                            </Link>
                                                            <Link to="/nlp-tools" className='flex items-center gap-3 px-2 py-2 hover:bg-gray-100 rounded transition'>
                                                                <Award className="w-4 h-4" />
                                                                <span className="text-sm">NLP Tools</span>
                                                            </Link>
                                                        </>
                                                    )
                                                }
                                                
                                                {
                                                    user && user.role === 'recruiter' && (
                                                        <>
                                                            <Link to="/messages" className='flex items-center gap-3 px-2 py-2 hover:bg-gray-100 rounded transition'>
                                                                <MessageSquare className="w-4 h-4" />
                                                                <span className="text-sm">Messages</span>
                                                            </Link>
                                                            <Link to="/pricing" className='flex items-center gap-3 px-2 py-2 hover:bg-gray-100 rounded transition'>
                                                                <CreditCard className="w-4 h-4" />
                                                                <span className="text-sm">Pricing Plans</span>
                                                            </Link>
                                                            <Link to="/payment-history" className='flex items-center gap-3 px-2 py-2 hover:bg-gray-100 rounded transition'>
                                                                <Award className="w-4 h-4" />
                                                                <span className="text-sm">Payment History</span>
                                                            </Link>
                                                        </>
                                                    )
                                                }

                                                <div className="border-t my-2"></div>

                                                <Link to="/notification-settings" className='flex items-center gap-3 px-2 py-2 hover:bg-gray-100 rounded transition'>
                                                    <Bell className="w-4 h-4" />
                                                    <span className="text-sm">Notifications</span>
                                                </Link>
                                                
                                                <Link to="/2fa/settings" className='flex items-center gap-3 px-2 py-2 hover:bg-gray-100 rounded transition'>
                                                    <Shield className="w-4 h-4" />
                                                    <span className="text-sm">Security (2FA)</span>
                                                </Link>
                                                
                                                <Link to="/faq" className='flex items-center gap-3 px-2 py-2 hover:bg-gray-100 rounded transition'>
                                                    <HelpCircle className="w-4 h-4" />
                                                    <span className="text-sm">Help & FAQ</span>
                                                </Link>

                                                <div className="border-t my-2"></div>

                                                <button onClick={logoutHandler} className='flex items-center gap-3 px-2 py-2 hover:bg-red-50 hover:text-red-600 rounded transition text-left w-full'>
                                                    <LogOut className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Logout</span>
                                                </button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )
                    }
                </div>
            </div>
        </nav>
    )
}

export default Navbar