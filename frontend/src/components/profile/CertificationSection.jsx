import React, { useState, useEffect } from 'react';
import { Award, Calendar, ExternalLink, Plus, Edit, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import axios from '@/utils/axios';
import { toast } from 'sonner';
import CertificationModal from './CertificationModal';

const CertificationSection = () => {
    const [certifications, setCertifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedCertification, setSelectedCertification] = useState(null);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'

    useEffect(() => {
        fetchCertifications();
    }, []);

    const fetchCertifications = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/v1/user/certifications', {
                withCredentials: true
            });

            if (response.data.success) {
                setCertifications(response.data.certifications);
            }
        } catch (error) {
            console.error('Error fetching certifications:', error);
            toast.error(error.response?.data?.message || 'Failed to load certifications');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setModalMode('add');
        setSelectedCertification(null);
        setShowModal(true);
    };

    const handleEdit = (cert) => {
        setModalMode('edit');
        setSelectedCertification(cert);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this certification?')) {
            return;
        }

        try {
            const response = await axios.delete(
                `http://localhost:8000/api/v1/user/certifications/${id}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Certification deleted successfully');
                fetchCertifications();
            }
        } catch (error) {
            console.error('Error deleting certification:', error);
            toast.error(error.response?.data?.message || 'Failed to delete certification');
        }
    };

    const handleSave = async (formData) => {
        try {
            let response;

            if (modalMode === 'edit' && selectedCertification) {
                // Update existing certification
                response = await axios.put(
                    `http://localhost:8000/api/v1/user/certifications/${selectedCertification._id}`,
                    formData,
                    { withCredentials: true }
                );
            } else {
                // Add new certification
                response = await axios.post(
                    'http://localhost:8000/api/v1/user/certifications',
                    formData,
                    { withCredentials: true }
                );
            }

            if (response.data.success) {
                toast.success(
                    modalMode === 'edit' 
                        ? 'Certification updated successfully' 
                        : 'Certification added successfully'
                );
                setShowModal(false);
                fetchCertifications();
            }
        } catch (error) {
            console.error('Error saving certification:', error);
            toast.error(error.response?.data?.message || 'Failed to save certification');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const isExpired = (expirationDate) => {
        if (!expirationDate) return false;
        return new Date(expirationDate) < new Date();
    };

    const isExpiringSoon = (expirationDate) => {
        if (!expirationDate) return false;
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        const expDate = new Date(expirationDate);
        return expDate > new Date() && expDate <= threeMonthsFromNow;
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
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Award className="w-5 h-5 text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Certifications</h2>
                    </div>
                    <Button onClick={handleAdd} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Certification
                    </Button>
                </div>

                {/* Certifications Grid */}
                {certifications.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <Award className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No certifications yet</h3>
                        <p className="text-gray-500 mb-6">Add your professional certifications and credentials</p>
                        <Button onClick={handleAdd}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Certification
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {certifications.map((cert) => (
                            <div
                                key={cert._id}
                                className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 hover:shadow-md transition-shadow border border-purple-100"
                            >
                                {/* Header with status badge */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-purple-600" />
                                        {cert.expirationDate && (
                                            <>
                                                {isExpired(cert.expirationDate) ? (
                                                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                                                        <AlertCircle className="w-3 h-3 mr-1" />
                                                        Expired
                                                    </Badge>
                                                ) : isExpiringSoon(cert.expirationDate) ? (
                                                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                                        <AlertCircle className="w-3 h-3 mr-1" />
                                                        Expiring Soon
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Active
                                                    </Badge>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEdit(cert)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDelete(cert._id)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Certification info */}
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{cert.name}</h3>
                                <p className="text-purple-600 font-medium mb-3">{cert.issuingOrganization}</p>

                                {/* Dates */}
                                {cert.issueDate && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            Issued {formatDate(cert.issueDate)}
                                            {cert.expirationDate && ` · Expires ${formatDate(cert.expirationDate)}`}
                                        </span>
                                    </div>
                                )}

                                {/* Credential ID */}
                                {cert.credentialID && (
                                    <div className="text-sm text-gray-600 mb-3">
                                        <span className="font-medium">ID:</span> {cert.credentialID}
                                    </div>
                                )}

                                {/* Credential URL */}
                                {cert.credentialURL && (
                                    <a
                                        href={cert.credentialURL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                    >
                                        View Credential
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <CertificationModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                certification={selectedCertification}
                mode={modalMode}
            />
        </>
    );
};

export default CertificationSection;
