import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { Download, Trash2, Shield, FileText, AlertTriangle } from 'lucide-react';

const PrivacyCenter = () => {
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [loading, setLoading] = useState(false);

    const exportData = async (format) => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/gdpr/export-data`,
                {
                    params: { format },
                    withCredentials: true,
                    responseType: format === 'pdf' ? 'blob' : 'json'
                }
            );

            if (format === 'pdf') {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'my-data.pdf');
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                const dataStr = JSON.stringify(response.data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = window.URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'my-data.json');
                document.body.appendChild(link);
                link.click();
                link.remove();
            }

            toast.success(`Data exported as ${format.toUpperCase()}`);
        } catch (error) {
            toast.error('Failed to export data');
        } finally {
            setLoading(false);
        }
    };

    const deleteAccount = async () => {
        if (deleteConfirm !== 'DELETE MY ACCOUNT') {
            toast.error('Please type the confirmation text exactly');
            return;
        }

        setLoading(true);
        try {
            await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/gdpr/delete-account`,
                {
                    data: { confirmation: deleteConfirm },
                    withCredentials: true
                }
            );
            toast.success('Account deleted successfully');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete account');
        } finally {
            setLoading(false);
            setShowDeleteDialog(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <Shield className="w-8 h-8" />
                    Privacy Center
                </h1>
                <p className="text-gray-600">Manage your data and privacy preferences</p>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="w-5 h-5" />
                            Export Your Data
                        </CardTitle>
                        <CardDescription>
                            Download a copy of your personal data in JSON or PDF format
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Your exported data includes profile information, applications, saved jobs, and activity history.
                        </p>
                        <div className="flex gap-3">
                            <Button onClick={() => exportData('json')} disabled={loading}>
                                <FileText className="w-4 h-4 mr-2" />
                                Export as JSON
                            </Button>
                            <Button onClick={() => exportData('pdf')} variant="outline" disabled={loading}>
                                <FileText className="w-4 h-4 mr-2" />
                                Export as PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Privacy Rights</CardTitle>
                        <CardDescription>Information about your data privacy rights</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                                <div>
                                    <strong>Right to Access:</strong> You can download all your personal data at any time.
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                                <div>
                                    <strong>Right to Rectification:</strong> Update your profile information anytime.
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                                <div>
                                    <strong>Right to Erasure:</strong> Request complete deletion of your account and data.
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                                <div>
                                    <strong>Right to Data Portability:</strong> Export your data in machine-readable format.
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="w-5 h-5" />
                            Delete Account
                        </CardTitle>
                        <CardDescription>
                            Permanently delete your account and all associated data
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded p-4">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                                <div className="text-sm text-red-900">
                                    <strong>Warning:</strong> This action cannot be undone. All your data including profile,
                                    applications, messages, and activity history will be permanently deleted.
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            Delete My Account
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Account Deletion</DialogTitle>
                        <DialogDescription>
                            This action is permanent and cannot be reversed. Type "DELETE MY ACCOUNT" to confirm.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="Type: DELETE MY ACCOUNT"
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={deleteAccount}
                            disabled={loading || deleteConfirm !== 'DELETE MY ACCOUNT'}
                        >
                            Delete Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PrivacyCenter;
