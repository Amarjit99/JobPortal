import React, { useEffect, useState } from 'react'
import { Label } from './ui/label'
import { useDispatch } from 'react-redux'
import { setSearchedQuery } from '@/redux/jobSlice'
import { Checkbox } from './ui/checkbox'
import { Slider } from './ui/slider'
import { Button } from './ui/button'

const FilterCard = () => {
    const dispatch = useDispatch();
    const [filters, setFilters] = useState({
        locations: [],
        jobTypes: [],
        experienceLevel: [0, 10],
        salaryRange: [0, 50]
    });

    const locationOptions = ["Delhi NCR", "Bangalore", "Hyderabad", "Pune", "Mumbai", "Chennai", "Kolkata", "Remote"];
    const jobTypeOptions = ["Full-time", "Part-time", "Contract", "Internship"];

    const handleLocationChange = (location) => {
        setFilters(prev => ({
            ...prev,
            locations: prev.locations.includes(location)
                ? prev.locations.filter(l => l !== location)
                : [...prev.locations, location]
        }));
    };

    const handleJobTypeChange = (jobType) => {
        setFilters(prev => ({
            ...prev,
            jobTypes: prev.jobTypes.includes(jobType)
                ? prev.jobTypes.filter(jt => jt !== jobType)
                : [...prev.jobTypes, jobType]
        }));
    };

    const handleClearFilters = () => {
        setFilters({
            locations: [],
            jobTypes: [],
            experienceLevel: [0, 10],
            salaryRange: [0, 50]
        });
    };

    useEffect(() => {
        // Build query string from filters
        const queryParts = [];
        
        if (filters.locations.length > 0) {
            queryParts.push(`location:${filters.locations.join(',')}`);
        }
        if (filters.jobTypes.length > 0) {
            queryParts.push(`jobType:${filters.jobTypes.join(',')}`);
        }
        if (filters.experienceLevel[0] !== 0 || filters.experienceLevel[1] !== 10) {
            queryParts.push(`experience:${filters.experienceLevel[0]}-${filters.experienceLevel[1]}`);
        }
        if (filters.salaryRange[0] !== 0 || filters.salaryRange[1] !== 50) {
            queryParts.push(`salary:${filters.salaryRange[0]}-${filters.salaryRange[1]}`);
        }

        dispatch(setSearchedQuery(queryParts.join('|')));
    }, [filters, dispatch]);

    return (
        <div className='w-full bg-white p-4 rounded-md shadow-md'>
            <div className='flex items-center justify-between mb-4'>
                <h1 className='font-bold text-lg'>Filter Jobs</h1>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearFilters}
                    className="text-xs text-blue-600"
                >
                    Clear All
                </Button>
            </div>
            <hr className='mb-4' />

            {/* Location Filter */}
            <div className='mb-6'>
                <h2 className='font-semibold text-md mb-3'>Location</h2>
                <div className='space-y-2'>
                    {locationOptions.map((location) => (
                        <div key={location} className='flex items-center space-x-2'>
                            <Checkbox
                                id={`location-${location}`}
                                checked={filters.locations.includes(location)}
                                onCheckedChange={() => handleLocationChange(location)}
                            />
                            <Label 
                                htmlFor={`location-${location}`}
                                className="text-sm cursor-pointer"
                            >
                                {location}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Job Type Filter */}
            <div className='mb-6'>
                <h2 className='font-semibold text-md mb-3'>Job Type</h2>
                <div className='space-y-2'>
                    {jobTypeOptions.map((jobType) => (
                        <div key={jobType} className='flex items-center space-x-2'>
                            <Checkbox
                                id={`jobtype-${jobType}`}
                                checked={filters.jobTypes.includes(jobType)}
                                onCheckedChange={() => handleJobTypeChange(jobType)}
                            />
                            <Label 
                                htmlFor={`jobtype-${jobType}`}
                                className="text-sm cursor-pointer"
                            >
                                {jobType}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Experience Level Filter */}
            <div className='mb-6'>
                <h2 className='font-semibold text-md mb-3'>
                    Experience Level ({filters.experienceLevel[0]} - {filters.experienceLevel[1]}+ years)
                </h2>
                <Slider
                    min={0}
                    max={10}
                    step={1}
                    value={filters.experienceLevel}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, experienceLevel: value }))}
                    className="mt-2"
                />
                <div className='flex justify-between text-xs text-gray-500 mt-1'>
                    <span>0 yrs</span>
                    <span>10+ yrs</span>
                </div>
            </div>

            {/* Salary Range Filter */}
            <div className='mb-4'>
                <h2 className='font-semibold text-md mb-3'>
                    Salary Range ({filters.salaryRange[0]} - {filters.salaryRange[1]}+ LPA)
                </h2>
                <Slider
                    min={0}
                    max={50}
                    step={5}
                    value={filters.salaryRange}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, salaryRange: value }))}
                    className="mt-2"
                />
                <div className='flex justify-between text-xs text-gray-500 mt-1'>
                    <span>0 LPA</span>
                    <span>50+ LPA</span>
                </div>
            </div>
        </div>
    )
}

export default FilterCard