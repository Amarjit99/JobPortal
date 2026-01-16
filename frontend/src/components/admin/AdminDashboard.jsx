import { useEffect, useState } from 'react';
import Navbar from '../shared/Navbar';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from '@/utils/axios';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
    Users, 
    Briefcase, 
    Building2, 
    FileText, 
    Trash2, 
    Edit,
    Search,
    UserCog,
    Shield
} from 'lucide-react';

const ADMIN_API_END_POINT = 'http://localhost:8000/api/v1/admin';

const AdminDashboard = () => {
    const { user } = useSelector(store => store.auth);
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchStats();
        fetchUsers();
    }, [user, navigate]);

    const fetchStats = async () => {
        try {
            console.log('Fetching stats from:', `${ADMIN_API_END_POINT}/stats`);
            console.log('User:', user);
            const res = await axios.get(`${ADMIN_API_END_POINT}/stats`, {
                withCredentials: true
            });
            console.log('Stats response:', res.data);
            setStats(res.data.stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            toast.error(error.response?.data?.message || 'Failed to fetch statistics');
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (roleFilter) params.append('role', roleFilter);
            
            console.log('Fetching users from:', `${ADMIN_API_END_POINT}/users?${params}`);
            const res = await axios.get(`${ADMIN_API_END_POINT}/users?${params}`, {
                withCredentials: true
            });
            console.log('Users response:', res.data);
            setUsers(res.data.users);
        } catch (error) {
            console.error('Error fetching users:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            toast.error(error.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchUsers();
    };

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to delete ${userName}?`)) {
            return;
        }

        try {
            const res = await axios.delete(`${ADMIN_API_END_POINT}/users/${userId}`, {
                withCredentials: true
            });
            toast.success(res.data.message);
            fetchUsers();
            fetchStats();
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleRoleChange = async (userId, currentRole) => {
        const newRole = prompt(`Enter new role for user (student/recruiter/admin):\nCurrent: ${currentRole}`);
        
        if (!newRole || !['student', 'recruiter', 'admin'].includes(newRole.toLowerCase())) {
            toast.error('Invalid role');
            return;
        }

        try {
            const res = await axios.put(`${ADMIN_API_END_POINT}/users/${userId}/role`, 
                { role: newRole.toLowerCase() },
                { withCredentials: true }
            );
            toast.success(res.data.message);
            fetchUsers();
        } catch (error) {
            console.error('Error updating role:', error);
            toast.error(error.response?.data?.message || 'Failed to update role');
        }
    };

    const getRoleBadge = (role) => {
        const colors = {
            admin: 'bg-red-500',
            recruiter: 'bg-blue-500',
            student: 'bg-green-500'
        };
        return colors[role] || 'bg-gray-500';
    };

    if (user?.role !== 'admin') {
        return null;
    }

    return (
        <div>
            <Navbar />
            <div className='max-w-7xl mx-auto my-10 px-4'>
                <h1 className='text-3xl font-bold mb-8'>Admin Dashboard</h1>

                {/* Statistics Cards */}
                {stats && (
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
                        <div className='bg-white p-6 rounded-lg shadow border border-gray-200'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-gray-500 text-sm'>Total Users</p>
                                    <p className='text-2xl font-bold'>{stats.users.total}</p>
                                    <p className='text-xs text-green-600'>+{stats.users.newThisMonth} this month</p>
                                </div>
                                <Users className='w-12 h-12 text-blue-500' />
                            </div>
                        </div>

                        <div className='bg-white p-6 rounded-lg shadow border border-gray-200'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-gray-500 text-sm'>Total Jobs</p>
                                    <p className='text-2xl font-bold'>{stats.jobs.total}</p>
                                    <p className='text-xs text-green-600'>+{stats.jobs.newThisMonth} this month</p>
                                </div>
                                <Briefcase className='w-12 h-12 text-purple-500' />
                            </div>
                        </div>

                        <div className='bg-white p-6 rounded-lg shadow border border-gray-200'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-gray-500 text-sm'>Total Companies</p>
                                    <p className='text-2xl font-bold'>{stats.companies.total}</p>
                                </div>
                                <Building2 className='w-12 h-12 text-orange-500' />
                            </div>
                        </div>

                        <div className='bg-white p-6 rounded-lg shadow border border-gray-200'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-gray-500 text-sm'>Total Applications</p>
                                    <p className='text-2xl font-bold'>{stats.applications.total}</p>
                                    <p className='text-xs text-green-600'>+{stats.applications.newThisMonth} this month</p>
                                </div>
                                <FileText className='w-12 h-12 text-green-500' />
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
                    <Button 
                        onClick={() => navigate('/admin/analytics')} 
                        className='h-20 text-lg flex items-center justify-center gap-2'
                        variant="outline"
                    >
                        <FileText size={24} />
                        View Analytics
                    </Button>
                    <Button 
                        onClick={() => navigate('/admin/monitoring')} 
                        className='h-20 text-lg flex items-center justify-center gap-2'
                        variant="outline"
                    >
                        <UserCog size={24} />
                        System Monitoring
                    </Button>
                    <Button 
                        onClick={() => navigate('/admin/sub-admins')} 
                        className='h-20 text-lg flex items-center justify-center gap-2'
                        variant="outline"
                    >
                        <Shield size={24} />
                        Sub-Admins
                    </Button>
                </div>

                {/* User Management Section */}
                <div className='bg-white rounded-lg shadow p-6'>
                    <h2 className='text-2xl font-bold mb-4'>User Management</h2>
                    
                    {/* Filters */}
                    <div className='flex gap-4 mb-6'>
                        <div className='flex-1'>
                            <Input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <select
                            className='border rounded px-4 py-2'
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                setTimeout(handleSearch, 100);
                            }}
                        >
                            <option value="">All Roles</option>
                            <option value="student">Students</option>
                            <option value="recruiter">Recruiters</option>
                            <option value="admin">Admins</option>
                        </select>
                        <Button onClick={handleSearch}>
                            <Search className='w-4 h-4 mr-2' />
                            Search
                        </Button>
                    </div>

                    {/* Users Table */}
                    {loading ? (
                        <p className='text-center py-8'>Loading users...</p>
                    ) : (
                        <div className='overflow-x-auto'>
                            <table className='w-full'>
                                <thead className='bg-gray-50'>
                                    <tr>
                                        <th className='px-4 py-3 text-left text-sm font-semibold'>Name</th>
                                        <th className='px-4 py-3 text-left text-sm font-semibold'>Email</th>
                                        <th className='px-4 py-3 text-left text-sm font-semibold'>Phone</th>
                                        <th className='px-4 py-3 text-left text-sm font-semibold'>Role</th>
                                        <th className='px-4 py-3 text-left text-sm font-semibold'>Verified</th>
                                        <th className='px-4 py-3 text-left text-sm font-semibold'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-200'>
                                    {users.map((user) => (
                                        <tr key={user._id} className='hover:bg-gray-50'>
                                            <td className='px-4 py-3'>{user.fullname}</td>
                                            <td className='px-4 py-3'>{user.email}</td>
                                            <td className='px-4 py-3'>{user.phoneNumber}</td>
                                            <td className='px-4 py-3'>
                                                <Badge className={`${getRoleBadge(user.role)} text-white`}>
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className='px-4 py-3'>
                                                <Badge variant={user.isVerified ? 'default' : 'destructive'}>
                                                    {user.isVerified ? 'Yes' : 'No'}
                                                </Badge>
                                            </td>
                                            <td className='px-4 py-3'>
                                                <div className='flex gap-2'>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleRoleChange(user._id, user.role)}
                                                        title="Change Role"
                                                    >
                                                        <UserCog className='w-4 h-4' />
                                                    </Button>
                                                    {user.role !== 'admin' && (
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleDeleteUser(user._id, user.fullname)}
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className='w-4 h-4' />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {users.length === 0 && (
                                <p className='text-center py-8 text-gray-500'>No users found</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
