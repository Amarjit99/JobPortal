import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import axios from '@/utils/axios';
import { toast } from 'sonner';
import ExperienceModal from './ExperienceModal';

const ExperienceSection = () => {
    const [experience, setExperience] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedExperience, setSelectedExperience] = useState(null);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'

    useEffect(() => {
        fetchExperience();
    }, []);

    const fetchExperience = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/v1/user/experience', {
                withCredentials: true
            });

            if (response.data.success) {
                setExperience(response.data.experience);
            }
        } catch (error) {
            console.error('Error fetching experience:', error);
            toast.error(error.response?.data?.message || 'Failed to load work experience');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setModalMode('add');
        setSelectedExperience(null);
        setShowModal(true);
    };

    const handleEdit = (exp) => {
        setModalMode('edit');
        setSelectedExperience(exp);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this work experience?')) {
            return;
        }

        try {
            const response = await axios.delete(
                `http://localhost:8000/api/v1/user/experience/${id}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Work experience deleted successfully');
                fetchExperience();
            }
        } catch (error) {
            console.error('Error deleting experience:', error);
            toast.error(error.response?.data?.message || 'Failed to delete work experience');
        }
    };

    const handleSave = async (formData) => {
        try {
            let response;

            if (modalMode === 'edit' && selectedExperience) {
                // Update existing experience
                response = await axios.put(
                    `http://localhost:8000/api/v1/user/experience/${selectedExperience._id}`,
                    formData,
                    { withCredentials: true }
                );
            } else {
                // Add new experience
                response = await axios.post(
                    'http://localhost:8000/api/v1/user/experience',
                    formData,
                    { withCredentials: true }
                );
            }

            if (response.data.success) {
                toast.success(
                    modalMode === 'edit' 
                        ? 'Work experience updated successfully' 
                        : 'Work experience added successfully'
                );
                setShowModal(false);
                fetchExperience();
            }
        } catch (error) {
            console.error('Error saving experience:', error);
            toast.error(error.response?.data?.message || 'Failed to save work experience');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const calculateDuration = (startDate, endDate, current) => {
        const start = new Date(startDate);
        const end = current ? new Date() : new Date(endDate);
        
        const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                      (end.getMonth() - start.getMonth());
        
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        
        if (years > 0 && remainingMonths > 0) {
            return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
        } else if (years > 0) {
            return `${years} yr${years > 1 ? 's' : ''}`;
        } else {
            return `${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Work Experience</h2>
                    </div>
                    <Button onClick={handleAdd} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Experience
                    </Button>
                </div>

                {/* Experience List */}
                {experience.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <Briefcase className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No work experience yet</h3>
                        <p className="text-gray-500 mb-6">Add your professional experience to showcase your career journey</p>
                        <Button onClick={handleAdd}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Experience
                        </Button>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                        {/* Experience items */}
                        <div className="space-y-8">
                            {experience.map((exp, index) => (
                                <div key={exp._id} className="relative flex gap-4">
                                    {/* Timeline dot */}
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center z-10">
                                        <Briefcase className="w-5 h-5 text-blue-600" />
                                    </div>

                                    {/* Experience card */}
                                    <div className="flex-1 bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                                    {exp.title}
                                                    {exp.current && (
                                                        <Badge className="ml-3 bg-green-100 text-green-800 hover:bg-green-100">
                                                            Current
                                                        </Badge>
                                                    )}
                                                </h3>
                                                <p className="text-lg text-blue-600 font-medium mb-2">{exp.company}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleEdit(exp)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(exp._id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>

                                        {exp.location && (
                                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                                <MapPin className="w-4 h-4" />
                                                <span>{exp.location}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-gray-600 mb-4">
                                            <Calendar className="w-4 h-4" />
                                            <span>
                                                {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                                                <span className="text-gray-400 ml-2">
                                                    · {calculateDuration(exp.startDate, exp.endDate, exp.current)}
                                                </span>
                                            </span>
                                        </div>

                                        {exp.description && (
                                            <p className="text-gray-700 mb-4 whitespace-pre-line">{exp.description}</p>
                                        )}

                                        {exp.skills && exp.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {exp.skills.map((skill, idx) => (
                                                    <Badge
                                                        key={idx}
                                                        variant="secondary"
                                                        className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                    >
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <ExperienceModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                experience={selectedExperience}
                mode={modalMode}
            />
        </>
    );
};

export default ExperienceSection;
