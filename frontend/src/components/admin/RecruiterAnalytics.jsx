import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from '@/utils/axios';
import { toast } from 'sonner';
import Navbar from '../shared/Navbar';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Briefcase, FileText, Building2, TrendingUp, CheckCircle, XCircle, Clock, Award } from 'lucide-react';

const ANALYTICS_API_END_POINT = 'http://localhost:8000/api/v1/recruiter/analytics';
const COLORS = ['#6A38C2', '#F83002', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];

const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-600 mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
                {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-full ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
);

const RecruiterAnalytics = () => {
    const { user } = useSelector(store => store.auth);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [jobTrends, setJobTrends] = useState([]);
    const [applicationTrends, setApplicationTrends] = useState([]);
    const [companyPerformance, setCompanyPerformance] = useState([]);
    const [topJobs, setTopJobs] = useState([]);

    useEffect(() => {
        if (!user || user.role !== 'recruiter') {
            navigate('/');
            return;
        }
        fetchAnalytics();
    }, [user, navigate]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const [
                statsRes,
                jobTrendsRes,
                appTrendsRes,
                companyPerfRes,
                topJobsRes
            ] = await Promise.all([
                axios.get(`${ANALYTICS_API_END_POINT}/stats`, { withCredentials: true }),
                axios.get(`${ANALYTICS_API_END_POINT}/job-trends`, { withCredentials: true }),
                axios.get(`${ANALYTICS_API_END_POINT}/application-trends`, { withCredentials: true }),
                axios.get(`${ANALYTICS_API_END_POINT}/company-performance`, { withCredentials: true }),
                axios.get(`${ANALYTICS_API_END_POINT}/top-jobs?limit=5`, { withCredentials: true })
            ]);

            setStats(statsRes.data.stats);
            setJobTrends(jobTrendsRes.data.trends);
            setApplicationTrends(appTrendsRes.data.trends);
            setCompanyPerformance(companyPerfRes.data.companies);
            setTopJobs(topJobsRes.data.jobs);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div>
                <Navbar />
                <div className="max-w-7xl mx-auto my-10 px-4">
                    <p className="text-center text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div>
                <Navbar />
                <div className="max-w-7xl mx-auto my-10 px-4">
                    <p className="text-center text-gray-600">No data available</p>
                </div>
            </div>
        );
    }

    // Prepare pie chart data for application breakdown
    const applicationBreakdownData = [
        { name: 'Pending', value: stats.applicationBreakdown.pending },
        { name: 'Accepted', value: stats.applicationBreakdown.accepted },
        { name: 'Rejected', value: stats.applicationBreakdown.rejected }
    ];

    // Prepare job type distribution
    const jobTypeData = Object.entries(stats.jobTypeDistribution).map(([type, count]) => ({
        name: type,
        value: count
    }));

    return (
        <div>
            <Navbar />
            <div className="max-w-7xl mx-auto my-10 px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Recruiter Analytics</h1>
                    <p className="text-gray-600 mt-2">Track your recruitment performance and insights</p>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={Building2}
                        title="Total Companies"
                        value={stats.overview.totalCompanies}
                        color="bg-blue-500"
                    />
                    <StatCard
                        icon={Briefcase}
                        title="Total Jobs Posted"
                        value={stats.overview.totalJobs}
                        subtitle={`${stats.overview.activeJobs} active`}
                        color="bg-purple-500"
                    />
                    <StatCard
                        icon={FileText}
                        title="Total Applications"
                        value={stats.overview.totalApplications}
                        subtitle={`+${stats.overview.newApplicationsThisMonth} this month`}
                        color="bg-green-500"
                    />
                    <StatCard
                        icon={TrendingUp}
                        title="New Jobs This Month"
                        value={stats.overview.newJobsThisMonth}
                        color="bg-orange-500"
                    />
                </div>

                {/* Application Status Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        icon={Clock}
                        title="Pending Applications"
                        value={stats.applicationBreakdown.pending}
                        color="bg-yellow-500"
                    />
                    <StatCard
                        icon={CheckCircle}
                        title="Accepted Applications"
                        value={stats.applicationBreakdown.accepted}
                        color="bg-green-500"
                    />
                    <StatCard
                        icon={XCircle}
                        title="Rejected Applications"
                        value={stats.applicationBreakdown.rejected}
                        color="bg-red-500"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Job Trends */}
                    {jobTrends.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h2 className="text-xl font-semibold mb-4">Job Posting Trends</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={jobTrends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="jobs" stroke="#6A38C2" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Application Trends */}
                    {applicationTrends.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h2 className="text-xl font-semibold mb-4">Application Trends</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={applicationTrends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="applications" fill="#F83002" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Application Breakdown Pie Chart */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-xl font-semibold mb-4">Application Status Distribution</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={applicationBreakdownData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {applicationBreakdownData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Job Type Distribution */}
                    {jobTypeData.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h2 className="text-xl font-semibold mb-4">Job Type Distribution</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={jobTypeData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {jobTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Top Performing Jobs */}
                {stats.mostAppliedJobs && stats.mostAppliedJobs.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <Award className="w-5 h-5 mr-2 text-yellow-500" />
                            Most Applied Jobs
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Job Title</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Company</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold">Applications</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {stats.mostAppliedJobs.map((job, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">{job.jobTitle}</td>
                                            <td className="px-4 py-3">{job.company}</td>
                                            <td className="px-4 py-3 text-center font-semibold">{job.applications}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Company Performance */}
                {companyPerformance.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-xl font-semibold mb-4">Company-wise Performance</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Company</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold">Total Jobs</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold">Active Jobs</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold">Applications</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold">Accepted</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {companyPerformance.map((company, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium">{company.companyName}</td>
                                            <td className="px-4 py-3 text-center">{company.totalJobs}</td>
                                            <td className="px-4 py-3 text-center">{company.activeJobs}</td>
                                            <td className="px-4 py-3 text-center">{company.totalApplications}</td>
                                            <td className="px-4 py-3 text-center text-green-600 font-semibold">
                                                {company.acceptedApplications}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecruiterAnalytics;
