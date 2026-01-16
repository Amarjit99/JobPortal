import React from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FeaturedJobCard = ({ job }) => {
    const navigate = useNavigate();

    const getBadgeStyle = (badge) => {
        const styles = {
            hot: 'bg-red-500',
            urgent: 'bg-orange-500',
            featured: 'bg-blue-500',
            new: 'bg-green-500'
        };
        return styles[badge] || 'bg-gray-500';
    };

    return (
        <div
            className="border-2 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all duration-200"
            style={{ borderColor: job.highlightColor || '#F83002' }}
            onClick={() => navigate(`/description/${job._id}`)}
        >
            {/* Badge */}
            {job.badge && (
                <div className="flex items-center gap-2 mb-3">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <Badge className={getBadgeStyle(job.badge)}>
                        {job.badge.toUpperCase()}
                    </Badge>
                </div>
            )}

            {/* Company Logo & Info */}
            <div className="flex items-start gap-4">
                {job.company?.logo && (
                    <img
                        src={job.company.logo}
                        alt={job.company.name}
                        className="h-12 w-12 rounded-lg object-cover"
                    />
                )}
                <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{job.title}</h3>
                    <p className="text-gray-600 mb-2">{job.company?.name}</p>

                    <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">{job.location}</Badge>
                        <Badge variant="outline">{job.jobType}</Badge>
                        <Badge variant="outline">₹{job.salary} LPA</Badge>
                        <Badge variant="outline">{job.position} Positions</Badge>
                    </div>

                    <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                        {job.description}
                    </p>

                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                            Featured until {new Date(job.featuredUntil).toLocaleDateString()}
                        </span>
                        <Button size="sm" className="bg-[#F83002] hover:bg-[#e02a02]">
                            View Details
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeaturedJobCard;
