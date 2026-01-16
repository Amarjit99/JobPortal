import React, { useEffect, useState } from 'react'
import Navbar from './shared/Navbar'
import FilterCard from './FilterCard'
import Job from './Job';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Jobs = () => {
    const { allJobs, searchedQuery } = useSelector(store => store.job);
    const [filterJobs, setFilterJobs] = useState(allJobs);
    const [currentPage, setCurrentPage] = useState(1);
    const jobsPerPage = 9; // 3x3 grid

    useEffect(() => {
        if (searchedQuery) {
            // Parse advanced filters from query string
            const filters = {};
            const parts = searchedQuery.split('|');
            
            parts.forEach(part => {
                if (part.includes(':')) {
                    const [key, value] = part.split(':');
                    filters[key] = value;
                }
            });

            let filteredJobs = allJobs;

            // Apply location filter
            if (filters.location) {
                const locations = filters.location.split(',');
                filteredJobs = filteredJobs.filter(job => 
                    locations.some(loc => job.location?.toLowerCase().includes(loc.toLowerCase()))
                );
            }

            // Apply job type filter
            if (filters.jobType) {
                const jobTypes = filters.jobType.split(',');
                filteredJobs = filteredJobs.filter(job => 
                    jobTypes.some(type => job.jobType?.toLowerCase().includes(type.toLowerCase()))
                );
            }

            // Apply experience level filter
            if (filters.experience) {
                const [minExp, maxExp] = filters.experience.split('-').map(Number);
                filteredJobs = filteredJobs.filter(job => 
                    job.experienceLevel >= minExp && job.experienceLevel <= maxExp
                );
            }

            // Apply salary range filter
            if (filters.salary) {
                const [minSalary, maxSalary] = filters.salary.split('-').map(Number);
                filteredJobs = filteredJobs.filter(job => 
                    job.salary >= minSalary && job.salary <= maxSalary
                );
            }

            // Fallback to text search if no structured filters
            if (Object.keys(filters).length === 0) {
                filteredJobs = allJobs.filter((job) => {
                    return job.title.toLowerCase().includes(searchedQuery.toLowerCase()) ||
                        job.description.toLowerCase().includes(searchedQuery.toLowerCase()) ||
                        job.location.toLowerCase().includes(searchedQuery.toLowerCase())
                });
            }

            setFilterJobs(filteredJobs);
        } else {
            setFilterJobs(allJobs)
        }
        setCurrentPage(1); // Reset to first page when search changes
    }, [allJobs, searchedQuery]);

    // Calculate pagination
    const totalPages = Math.ceil(filterJobs.length / jobsPerPage);
    const startIndex = (currentPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    const currentJobs = filterJobs.slice(startIndex, endIndex);

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const handlePageClick = (pageNum) => {
        setCurrentPage(pageNum);
    };

    return (
        <div>
            <Navbar />
            <div className='max-w-7xl mx-auto mt-5'>
                <div className='flex gap-5'>
                    <div className='w-20%'>
                        <FilterCard />
                    </div>
                    {
                        filterJobs.length <= 0 ? <span>Job not found</span> : (
                            <div className='flex-1 h-[88vh] overflow-y-auto pb-5'>
                                <div className='grid grid-cols-3 gap-4'>
                                    {
                                        currentJobs.map((job) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: 100 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -100 }}
                                                transition={{ duration: 0.3 }}
                                                key={job?._id}>
                                                <Job job={job} />
                                            </motion.div>
                                        ))
                                    }
                                </div>
                                
                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className='flex items-center justify-center gap-2 mt-8'>
                                        <Button
                                            onClick={handlePreviousPage}
                                            disabled={currentPage === 1}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <ChevronLeft className='h-4 w-4' />
                                        </Button>
                                        
                                        <div className='flex gap-1'>
                                            {[...Array(totalPages)].map((_, index) => {
                                                const pageNum = index + 1;
                                                // Show first, last, current, and adjacent pages
                                                if (
                                                    pageNum === 1 ||
                                                    pageNum === totalPages ||
                                                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <Button
                                                            key={pageNum}
                                                            onClick={() => handlePageClick(pageNum)}
                                                            variant={currentPage === pageNum ? "default" : "outline"}
                                                            size="sm"
                                                            className='w-10'
                                                        >
                                                            {pageNum}
                                                        </Button>
                                                    );
                                                } else if (
                                                    pageNum === currentPage - 2 ||
                                                    pageNum === currentPage + 2
                                                ) {
                                                    return <span key={pageNum} className='px-2'>...</span>;
                                                }
                                                return null;
                                            })}
                                        </div>
                                        
                                        <Button
                                            onClick={handleNextPage}
                                            disabled={currentPage === totalPages}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <ChevronRight className='h-4 w-4' />
                                        </Button>
                                    </div>
                                )}
                                
                                {/* Page Info */}
                                {totalPages > 1 && (
                                    <div className='text-center mt-4 text-sm text-gray-600'>
                                        Showing {startIndex + 1}-{Math.min(endIndex, filterJobs.length)} of {filterJobs.length} jobs
                                    </div>
                                )}
                            </div>
                        )
                    }
                </div>
            </div>


        </div>
    )
}

export default Jobs