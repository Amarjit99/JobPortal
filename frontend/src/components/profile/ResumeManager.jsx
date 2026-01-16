import React, { useState, useEffect } from 'react';
import { FileText, Upload, Star, Download, Trash2, Calendar, HardDrive } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import axios from '@/utils/axios';
import { toast } from 'sonner';

const ResumeManager = () => {
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        fetchResumes();
    }, []);

    const fetchResumes = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/v1/user/resume', {
                withCredentials: true
            });

            if (response.data.success) {
                setResumes(response.data.resumes);
            }
        } catch (error) {
            console.error('Error fetching resumes:', error);
            toast.error(error.response?.data?.message || 'Failed to load resumes');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (file) => {
        if (!file) return;

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Invalid file type. Only PDF, DOC, and DOCX are allowed');
            return;
        }

        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            toast.error('File size exceeds 5MB limit');
            return;
        }

        // Check if user already has 5 resumes
        if (resumes.length >= 5) {
            toast.error('Maximum 5 resumes allowed. Please delete an existing resume first');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(
                'http://localhost:8000/api/v1/user/resume/upload',
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success) {
                toast.success('Resume uploaded successfully');
                fetchResumes();
            }
        } catch (error) {
            console.error('Error uploading resume:', error);
            toast.error(error.response?.data?.message || 'Failed to upload resume');
        } finally {
            setUploading(false);
        }
    };

    const handleInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
        // Reset input value to allow uploading the same file again
        e.target.value = '';
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleSetDefault = async (resumeId) => {
        try {
            const response = await axios.put(
                `http://localhost:8000/api/v1/user/resume/${resumeId}/default`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Default resume updated');
                fetchResumes();
            }
        } catch (error) {
            console.error('Error setting default resume:', error);
            toast.error(error.response?.data?.message || 'Failed to set default resume');
        }
    };

    const handleDelete = async (resumeId) => {
        if (!window.confirm('Are you sure you want to delete this resume?')) {
            return;
        }

        try {
            const response = await axios.delete(
                `http://localhost:8000/api/v1/user/resume/${resumeId}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Resume deleted successfully');
                fetchResumes();
            }
        } catch (error) {
            console.error('Error deleting resume:', error);
            toast.error(error.response?.data?.message || 'Failed to delete resume');
        }
    };

    const handleDownload = (resume) => {
        window.open(resume.cloudinaryUrl, '_blank');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Resume Manager</h2>
                        <p className="text-sm text-gray-500">
                            {resumes.length}/5 resumes uploaded
                        </p>
                    </div>
                </div>
            </div>

            {/* Upload Area */}
            <div
                className={`mb-8 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                } ${resumes.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => {
                    if (resumes.length < 5 && !uploading) {
                        document.getElementById('resume-upload').click();
                    }
                }}
            >
                <input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={uploading || resumes.length >= 5}
                />
                
                <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} />
                
                {uploading ? (
                    <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="text-gray-600">Uploading...</span>
                    </div>
                ) : resumes.length >= 5 ? (
                    <>
                        <p className="text-gray-600 font-medium mb-1">Maximum resumes reached</p>
                        <p className="text-sm text-gray-500">Delete an existing resume to upload a new one</p>
                    </>
                ) : (
                    <>
                        <p className="text-gray-600 font-medium mb-1">
                            {dragActive ? 'Drop your resume here' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-sm text-gray-500">PDF, DOC, or DOCX (Max 5MB)</p>
                    </>
                )}
            </div>

            {/* Resumes Grid */}
            {resumes.length === 0 ? (
                <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes uploaded</h3>
                    <p className="text-gray-500">Upload your first resume to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resumes.map((resume) => (
                        <div
                            key={resume._id}
                            className={`relative bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-5 hover:shadow-md transition-shadow border ${
                                resume.isDefault ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200'
                            }`}
                        >
                            {/* Default Badge */}
                            {resume.isDefault && (
                                <Badge className="absolute top-3 right-3 bg-green-100 text-green-800 hover:bg-green-100">
                                    <Star className="w-3 h-3 mr-1 fill-green-800" />
                                    Default
                                </Badge>
                            )}

                            {/* File Icon */}
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate mb-1">
                                        {resume.originalName}
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <HardDrive className="w-3 h-3" />
                                            {formatFileSize(resume.fileSize)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(resume.uploadedAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                {!resume.isDefault && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSetDefault(resume._id)}
                                        className="flex-1"
                                    >
                                        <Star className="w-3 h-3 mr-1" />
                                        Set Default
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownload(resume)}
                                >
                                    <Download className="w-3 h-3" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDelete(resume._id)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ResumeManager;
