import React, { useState, useEffect } from 'react';
import { Shield, Upload, CheckCircle, XCircle, Clock, FileText, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import axios from '@/utils/axios';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';

const CompanyVerification = ({ companyId }) => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [verification, setVerification] = useState(null);
    const [files, setFiles] = useState({
        gstCertificate: null,
        panCard: null,
        registrationCertificate: null
    });

    useEffect(() => {
        if (companyId) {
            fetchVerificationStatus();
        }
    }, [companyId]);

    const fetchVerificationStatus = async () => {
        try {
            const response = await axios.get(
                `http://localhost:8000/api/v1/verification/status/${companyId}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setVerification(response.data.verification);
            }
        } catch (error) {
            console.error('Error fetching verification status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (docType, file) => {
        if (file) {
            // Validate file type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Only PDF and image files (JPG, PNG) are allowed');
                return;
            }

            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }

            setFiles(prev => ({
                ...prev,
                [docType]: file
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if at least 2 documents are uploaded
        const uploadedCount = Object.values(files).filter(f => f !== null).length;
        if (uploadedCount < 2) {
            toast.error('Please upload at least 2 verification documents');
            return;
        }

        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('companyId', companyId);
            
            if (files.gstCertificate) {
                formData.append('gstCertificate', files.gstCertificate);
            }
            if (files.panCard) {
                formData.append('panCard', files.panCard);
            }
            if (files.registrationCertificate) {
                formData.append('registrationCertificate', files.registrationCertificate);
            }

            const response = await axios.post(
                'http://localhost:8000/api/v1/verification/submit',
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success) {
                toast.success('Verification documents submitted successfully!');
                fetchVerificationStatus();
                setFiles({
                    gstCertificate: null,
                    panCard: null,
                    registrationCertificate: null
                });
            }
        } catch (error) {
            console.error('Error submitting verification:', error);
            toast.error(error.response?.data?.message || 'Failed to submit verification documents');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                    </Badge>
                );
            case 'pending':
            case 'resubmitted':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending Review
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Not Submitted
                    </Badge>
                );
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    const status = verification?.status;
    const isApproved = status === 'approved';
    const isPending = status === 'pending' || status === 'resubmitted';
    const isRejected = status === 'rejected';
    const canSubmit = !isApproved && !isPending;

    return (
        <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Company Verification</h2>
                        <p className="text-sm text-gray-500">Get your company verified to build trust</p>
                    </div>
                </div>
                {getStatusBadge(status)}
            </div>

            {/* Status Messages */}
            {isApproved && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-green-800">Company Verified!</h3>
                            <p className="text-sm text-green-700">
                                Your company has been verified. You'll see a verified badge on all your job postings.
                            </p>
                            {verification.verifiedAt && (
                                <p className="text-xs text-green-600 mt-1">
                                    Verified on {new Date(verification.verifiedAt).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isPending && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-yellow-800">Verification Pending</h3>
                            <p className="text-sm text-yellow-700">
                                Your verification documents are under review. You'll be notified via email once the review is complete.
                            </p>
                            {verification.submittedAt && (
                                <p className="text-xs text-yellow-600 mt-1">
                                    Submitted on {new Date(verification.submittedAt).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isRejected && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-800">Verification Rejected</h3>
                            <p className="text-sm text-red-700 mb-2">
                                {verification.rejectionReason || 'Your verification request was rejected. Please check your documents and resubmit.'}
                            </p>
                            <p className="text-xs text-red-600">
                                You can resubmit your documents with the correct information.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Form */}
            {canSubmit && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Upload at least 2 of the following documents to verify your company:
                        </p>

                        {/* GST Certificate */}
                        <div>
                            <Label htmlFor="gst" className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4" />
                                GST Certificate
                            </Label>
                            <Input
                                id="gst"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileChange('gstCertificate', e.target.files[0])}
                            />
                            {files.gstCertificate && (
                                <p className="text-xs text-green-600 mt-1">
                                    ✓ {files.gstCertificate.name}
                                </p>
                            )}
                        </div>

                        {/* PAN Card */}
                        <div>
                            <Label htmlFor="pan" className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4" />
                                PAN Card
                            </Label>
                            <Input
                                id="pan"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileChange('panCard', e.target.files[0])}
                            />
                            {files.panCard && (
                                <p className="text-xs text-green-600 mt-1">
                                    ✓ {files.panCard.name}
                                </p>
                            )}
                        </div>

                        {/* Registration Certificate */}
                        <div>
                            <Label htmlFor="registration" className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4" />
                                Company Registration Certificate
                            </Label>
                            <Input
                                id="registration"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileChange('registrationCertificate', e.target.files[0])}
                            />
                            {files.registrationCertificate && (
                                <p className="text-xs text-green-600 mt-1">
                                    ✓ {files.registrationCertificate.name}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={submitting} size="lg">
                            {submitting ? 'Submitting...' : 'Submit for Verification'}
                        </Button>
                    </div>
                </form>
            )}

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Why verify your company?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Build trust with job seekers</li>
                    <li>• Get a verified badge on your company profile</li>
                    <li>• Higher visibility in job search results</li>
                    <li>• Faster application responses</li>
                </ul>
            </div>
        </div>
    );
};

export default CompanyVerification;
