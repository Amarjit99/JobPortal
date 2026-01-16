import React, { useState, useEffect } from 'react';
import axios from '@/utils/axios';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import EducationModal from './EducationModal';
import { GraduationCap, Plus, Edit, Trash2, Calendar } from 'lucide-react';

const EDUCATION_API_END_POINT = 'http://localhost:8000/api/v1/user/education';

const EducationSection = () => {
    const [education, setEducation] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedEducation, setSelectedEducation] = useState(null);

    useEffect(() => {
        fetchEducation();
    }, []);

    const fetchEducation = async () => {
        try {
            setLoading(true);
            const response = await axios.get(EDUCATION_API_END_POINT, {
                withCredentials: true
            });
            if (response.data.success) {
                setEducation(response.data.education);
            }
        } catch (error) {
            console.error('Error fetching education:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setModalMode('add');
        setSelectedEducation(null);
        setShowModal(true);
    };

    const handleEdit = (edu) => {
        setModalMode('edit');
        setSelectedEducation(edu);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this education entry?')) {
            return;
        }

        try {
            const response = await axios.delete(`${EDUCATION_API_END_POINT}/${id}`, {
                withCredentials: true
            });
            if (response.data.success) {
                toast.success('Education deleted successfully');
                fetchEducation();
            }
        } catch (error) {
            console.error('Error deleting education:', error);
            toast.error(error.response?.data?.message || 'Failed to delete education');
        }
    };

    const handleSave = async (formData) => {
        try {
            let response;
            if (modalMode === 'add') {
                response = await axios.post(EDUCATION_API_END_POINT, formData, {
                    withCredentials: true
                });
            } else {
                response = await axios.put(
                    `${EDUCATION_API_END_POINT}/${selectedEducation._id}`,
                    formData,
                    { withCredentials: true }
                );
            }

            if (response.data.success) {
                toast.success(
                    modalMode === 'add' ? 'Education added successfully' : 'Education updated successfully'
                );
                setShowModal(false);
                fetchEducation();
            }
        } catch (error) {
            console.error('Error saving education:', error);
            toast.error(error.response?.data?.message || 'Failed to save education');
        }
    };

    const formatDate = (date) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold">Education</h2>
                </div>
                <Button onClick={handleAdd} size="sm" className="flex items-center gap-2">
                    <Plus size={16} />
                    Add Education
                </Button>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading education...</p>
                </div>
            ) : education.length === 0 ? (
                /* Empty State */
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <GraduationCap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">No education added yet</p>
                    <Button onClick={handleAdd} variant="outline">
                        Add Your First Education
                    </Button>
                </div>
            ) : (
                /* Education Timeline */
                <div className="space-y-6">
                    {education.map((edu, index) => (
                        <div key={edu._id} className="relative">
                            {/* Timeline Line */}
                            {index !== education.length - 1 && (
                                <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200"></div>
                            )}

                            {/* Education Card */}
                            <div className="flex gap-4">
                                {/* Timeline Dot */}
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow relative z-10">
                                    <GraduationCap className="w-5 h-5 text-blue-600" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {edu.degree}
                                                {edu.current && (
                                                    <Badge variant="default" className="ml-2 bg-green-500">
                                                        Current
                                                    </Badge>
                                                )}
                                            </h3>
                                            <p className="text-md font-medium text-gray-700 mt-1">
                                                {edu.institution}
                                            </p>
                                            {edu.fieldOfStudy && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {edu.fieldOfStudy}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                                <Calendar size={14} />
                                                <span>
                                                    {formatDate(edu.startDate)} - {edu.current ? 'Present' : formatDate(edu.endDate) || 'N/A'}
                                                </span>
                                            </div>
                                            {edu.grade && (
                                                <p className="text-sm text-gray-600 mt-2">
                                                    <span className="font-medium">Grade:</span> {edu.grade}
                                                </p>
                                            )}
                                            {edu.description && (
                                                <p className="text-sm text-gray-600 mt-3 whitespace-pre-line">
                                                    {edu.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 ml-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(edu)}
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(edu._id)}
                                                title="Delete"
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <EducationModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                education={selectedEducation}
                mode={modalMode}
            />
        </div>
    );
};

export default EducationSection;
