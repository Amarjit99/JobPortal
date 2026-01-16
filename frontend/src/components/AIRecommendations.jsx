import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Star, Briefcase, MapPin, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const AIRecommendations = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [strategy, setStrategy] = useState('hybrid');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchRecommendations();
    }, [strategy]);

    const fetchRecommendations = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/ai-recommendations/personalized`,
                {
                    params: { limit: 20, strategy },
                    withCredentials: true
                }
            );
            setRecommendations(response.data.recommendations);
            setStats(response.data.stats);
        } catch (error) {
            toast.error('Failed to load recommendations');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const strategies = [
        { value: 'hybrid', label: 'Hybrid (Best)', icon: TrendingUp },
        { value: 'content', label: 'Content-Based', icon: Briefcase },
        { value: 'collaborative', label: 'Collaborative', icon: Star }
    ];

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">AI Job Recommendations</h1>
                <p className="text-gray-600">Personalized job matches based on your profile and behavior</p>
            </div>

            <div className="flex gap-3 mb-6">
                {strategies.map(({ value, label, icon: Icon }) => (
                    <Button
                        key={value}
                        variant={strategy === value ? 'default' : 'outline'}
                        onClick={() => setStrategy(value)}
                        className="flex items-center gap-2"
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </Button>
                ))}
            </div>

            {stats && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Recommendation Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Total</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Avg Score</p>
                                <p className="text-2xl font-bold">{stats.avgScore}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Skills</p>
                                <p className="text-2xl font-bold">{stats.userProfile.skillsCount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Applications</p>
                                <p className="text-2xl font-bold">{stats.userProfile.totalApplications}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="text-center py-12">Loading recommendations...</div>
            ) : recommendations?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map((rec) => (
                        <Card key={rec.job._id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-lg">{rec.job.title}</CardTitle>
                                <CardDescription>{rec.job.company?.name}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="w-4 h-4" />
                                        {rec.job.location}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <DollarSign className="w-4 h-4" />
                                        ${rec.job.salary?.toLocaleString() || 'N/A'}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Badge variant={rec.matchLevel === 'excellent' ? 'default' : 'secondary'}>
                                            {rec.matchLevel || 'good'}
                                        </Badge>
                                        <span className="text-sm font-bold text-blue-600">
                                            Score: {rec.score?.total || 0}
                                        </span>
                                    </div>
                                    {rec.reasons && rec.reasons.length > 0 && (
                                        <div className="text-xs text-gray-600">
                                            {rec.reasons.slice(0, 2).map((reason, idx) => (
                                                <div key={idx}>• {reason}</div>
                                            ))}
                                        </div>
                                    )}
                                    <Button className="w-full" onClick={() => window.location.href = `/description/${rec.job._id}`}>
                                        View Job
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    No recommendations available. Complete your profile to get personalized job matches.
                </div>
            )}
        </div>
    );
};

export default AIRecommendations;
