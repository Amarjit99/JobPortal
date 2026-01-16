import { useEffect, useState } from 'react';
import axios from '@/utils/axios';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Briefcase, FileText, Building2, TrendingUp, MapPin, Target } from 'lucide-react';

const ANALYTICS_API_END_POINT = 'http://localhost:8000/api/v1/analytics';

const COLORS = ['#6A38C2', '#F83002', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'];

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

const AnalyticsDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [overallStats, setOverallStats] = useState(null);
    const [applicationStats, setApplicationStats] = useState(null);
    const [jobTrends, setJobTrends] = useState([]);
    const [applicationTrends, setApplicationTrends] = useState([]);
    const [popularCompanies, setPopularCompanies] = useState([]);
    const [popularSkills, setPopularSkills] = useState([]);
    const [jobTypeDistribution, setJobTypeDistribution] = useState([]);
    const [locationDistribution, setLocationDistribution] = useState([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const [
                overall,
                applications,
                jobTrend,
                appTrend,
                companies,
                skills,
                jobTypes,
                locations
            ] = await Promise.all([
                axios.get(`${ANALYTICS_API_END_POINT}/overall`, { withCredentials: true }),
                axios.get(`${ANALYTICS_API_END_POINT}/applications`, { withCredentials: true }),
                axios.get(`${ANALYTICS_API_END_POINT}/job-trends`, { withCredentials: true }),
                axios.get(`${ANALYTICS_API_END_POINT}/application-trends`, { withCredentials: true }),
                axios.get(`${ANALYTICS_API_END_POINT}/popular-companies?limit=5`, { withCredentials: true }),
                axios.get(`${ANALYTICS_API_END_POINT}/popular-skills?limit=10`, { withCredentials: true }),
                axios.get(`${ANALYTICS_API_END_POINT}/job-types`, { withCredentials: true }),
                axios.get(`${ANALYTICS_API_END_POINT}/locations?limit=8`, { withCredentials: true })
            ]);

            setOverallStats(overall.data.stats);
            setApplicationStats(applications.data.stats);
            setJobTrends(jobTrend.data.trends);
            setApplicationTrends(appTrend.data.trends);
            setPopularCompanies(companies.data.companies);
            setPopularSkills(skills.data.skills);
            
            // Format for PieChart
            setJobTypeDistribution(jobTypes.data.distribution.map(item => ({
                name: item._id,
                value: item.count
            })));
            
            setLocationDistribution(locations.data.distribution.map(item => ({
                name: item._id,
                value: item.count
            })));
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6A38C2]"></div>
            </div>
        );
    }

    const applicationPieData = [
        { name: 'Pending', value: applicationStats?.pending || 0 },
        { name: 'Accepted', value: applicationStats?.accepted || 0 },
        { name: 'Rejected', value: applicationStats?.rejected || 0 }
    ];

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600 mt-2">Overview of your job portal statistics and trends</p>
            </div>

            {/* Overall Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Users}
                    title="Total Users"
                    value={overallStats?.totalUsers || 0}
                    subtitle={`${overallStats?.totalStudents || 0} students, ${overallStats?.totalRecruiters || 0} recruiters`}
                    color="bg-blue-500"
                />
                <StatCard
                    icon={Briefcase}
                    title="Total Jobs"
                    value={overallStats?.totalJobs || 0}
                    subtitle={`${overallStats?.activeJobs || 0} active jobs`}
                    color="bg-[#6A38C2]"
                />
                <StatCard
                    icon={FileText}
                    title="Applications"
                    value={overallStats?.totalApplications || 0}
                    subtitle={`${applicationStats?.accepted || 0} accepted`}
                    color="bg-green-500"
                />
                <StatCard
                    icon={Building2}
                    title="Companies"
                    value={overallStats?.totalCompanies || 0}
                    color="bg-orange-500"
                />
            </div>

            {/* Trends Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Job Trends */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-[#6A38C2]" />
                        <h2 className="text-xl font-semibold">Job Posting Trends</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={jobTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="count" stroke="#6A38C2" strokeWidth={2} name="Jobs Posted" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Application Trends */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-[#10B981]" />
                        <h2 className="text-xl font-semibold">Application Trends</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={applicationTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} name="Applications" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Application Status */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-xl font-semibold mb-4">Application Status Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={applicationPieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {applicationPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Job Type Distribution */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-xl font-semibold mb-4">Job Type Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={jobTypeDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#6A38C2" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Popular Companies */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-[#6A38C2]" />
                    <h2 className="text-xl font-semibold">Top Companies by Job Postings</h2>
                </div>
                <div className="space-y-4">
                    {popularCompanies.map((company, index) => (
                        <div key={company._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#6A38C2] text-white rounded-full flex items-center justify-center font-bold">
                                    {index + 1}
                                </div>
                                <div>
                                    <h3 className="font-medium">{company.name}</h3>
                                    <p className="text-sm text-gray-600">
                                        {company.jobCount} jobs • {company.applicationCount} applications
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Popular Skills and Locations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Popular Skills */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-[#6A38C2]" />
                        <h2 className="text-xl font-semibold">Most Requested Skills</h2>
                    </div>
                    <div className="space-y-3">
                        {popularSkills.slice(0, 10).map((skill, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <span className="text-gray-700">{skill.skill}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-[#6A38C2] h-2 rounded-full"
                                            style={{ width: `${(skill.count / popularSkills[0].count) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-600 w-8">{skill.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Locations */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-[#6A38C2]" />
                        <h2 className="text-xl font-semibold">Top Job Locations</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={locationDistribution} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#F83002" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
