import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Eye, FileText, Building2, Mail, Phone, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import axios from '@/utils/axios';
import { toast } from 'sonner';

const VerificationQueue = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [viewingDocument, setViewingDocument] = useState(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');

    useEffect(() => {
        fetchVerificationQueue();
    }, [statusFilter]);

    const fetchVerificationQueue = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `http://localhost:8000/api/v1/verification/queue?status=${statusFilter}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setCompanies(response.data.companies);
            }
        } catch (error) {
            console.error('Error fetching verification queue:', error);
            toast.error('Failed to load verification queue');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (companyId) => {
        try {
            const response = await axios.put(
                `http://localhost:8000/api/v1/verification/approve/${companyId}`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Company verified successfully!');
                fetchVerificationQueue();
                setSelectedCompany(null);
            }
        } catch (error) {
            console.error('Error approving company:', error);
            toast.error(error.response?.data?.message || 'Failed to approve company');
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        try {
            const response = await axios.put(
                `http://localhost:8000/api/v1/verification/reject/${selectedCompany._id}`,
                { reason: rejectionReason },
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Company verification rejected');
                fetchVerificationQueue();
                setRejectDialogOpen(false);
                setSelectedCompany(null);
                setRejectionReason('');
            }
        } catch (error) {
            console.error('Error rejecting company:', error);
            toast.error(error.response?.data?.message || 'Failed to reject company');
        }
    };

    const openRejectDialog = (company) => {
        setSelectedCompany(company);
        setRejectDialogOpen(true);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            case 'resubmitted':
                return <Badge className="bg-blue-100 text-blue-800">Resubmitted</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Verification Queue</h1>
                        <p className="text-gray-500">Review and approve company verification requests</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    <Button
                        variant={statusFilter === 'pending' ? 'default' : 'outline'}
                        onClick={() => setStatusFilter('pending')}
                    >
                        Pending
                    </Button>
                    <Button
                        variant={statusFilter === 'resubmitted' ? 'default' : 'outline'}
                        onClick={() => setStatusFilter('resubmitted')}
                    >
                        Resubmitted
                    </Button>
                    <Button
                        variant={statusFilter === 'approved' ? 'default' : 'outline'}
                        onClick={() => setStatusFilter('approved')}
                    >
                        Approved
                    </Button>
                    <Button
                        variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                        onClick={() => setStatusFilter('rejected')}
                    >
                        Rejected
                    </Button>
                    <Button
                        variant={statusFilter === 'pending,resubmitted' ? 'default' : 'outline'}
                        onClick={() => setStatusFilter('pending,resubmitted')}
                    >
                        All Pending
                    </Button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}

            {/* Empty State */}
            {!loading && companies.length === 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No verification requests</h3>
                    <p className="text-gray-500">There are no companies with {statusFilter} verification status</p>
                </div>
            )}

            {/* Companies Grid */}
            {!loading && companies.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {companies.map((company) => (
                        <div key={company._id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                            {/* Company Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {company.logo ? (
                                        <img src={company.logo} alt={company.name} className="w-12 h-12 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                            <Building2 className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">{company.name}</h3>
                                        {company.location && (
                                            <p className="text-sm text-gray-500">{company.location}</p>
                                        )}
                                    </div>
                                </div>
                                {getStatusBadge(company.verification?.status)}
                            </div>

                            {/* Company Details */}
                            <div className="space-y-2 mb-4">
                                {company.userId && (
                                    <>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail className="w-4 h-4" />
                                            {company.userId.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4" />
                                            {company.userId.phoneNumber || 'N/A'}
                                        </div>
                                    </>
                                )}
                                {company.verification?.submittedAt && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        Submitted: {new Date(company.verification.submittedAt).toLocaleDateString()}
                                    </div>
                                )}
                                {company.verification?.resubmissionCount > 0 && (
                                    <div className="text-sm text-blue-600">
                                        Resubmission #{company.verification.resubmissionCount}
                                    </div>
                                )}
                            </div>

                            {/* Documents */}
                            <div className="mb-4">
                                <p className="text-sm font-semibold text-gray-700 mb-2">Submitted Documents:</p>
                                <div className="space-y-2">
                                    {company.verification?.documents?.gstCertificate && (
                                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-600" />
                                                <span className="text-sm">GST Certificate</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setViewingDocument(company.verification.documents.gstCertificate.url)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                    {company.verification?.documents?.panCard && (
                                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-600" />
                                                <span className="text-sm">PAN Card</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setViewingDocument(company.verification.documents.panCard.url)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                    {company.verification?.documents?.registrationCertificate && (
                                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-600" />
                                                <span className="text-sm">Registration Certificate</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setViewingDocument(company.verification.documents.registrationCertificate.url)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Rejection Reason */}
                            {company.verification?.rejectionReason && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                                    <p className="text-sm font-semibold text-red-800 mb-1">Previous Rejection:</p>
                                    <p className="text-sm text-red-700">{company.verification.rejectionReason}</p>
                                </div>
                            )}

                            {/* Actions */}
                            {(company.verification?.status === 'pending' || company.verification?.status === 'resubmitted') && (
                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                        onClick={() => handleApprove(company._id)}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => openRejectDialog(company)}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Document Viewer Dialog */}
            <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Document Preview</DialogTitle>
                    </DialogHeader>
                    {viewingDocument && (
                        <div className="overflow-auto max-h-[70vh]">
                            <img src={viewingDocument} alt="Document" className="w-full" />
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewingDocument(null)}>
                            Close
                        </Button>
                        <Button onClick={() => window.open(viewingDocument, '_blank')}>
                            Open in New Tab
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Verification</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this company's verification. The company will be able to resubmit their documents.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reason">Rejection Reason</Label>
                            <Input
                                id="reason"
                                placeholder="e.g., GST certificate is not clear, documents don't match company name"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setRejectDialogOpen(false);
                            setRejectionReason('');
                        }}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject}>
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VerificationQueue;
