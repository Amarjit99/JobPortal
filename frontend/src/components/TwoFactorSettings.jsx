import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Loader2, Shield, ShieldCheck, ShieldOff, Key, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from '@/utils/axios';
import { TWO_FACTOR_API_END_POINT } from '@/utils/constant';
import TwoFactorSetup from './TwoFactorSetup';

const TwoFactorSettings = () => {
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showSetupDialog, setShowSetupDialog] = useState(false);
    const [showDisableDialog, setShowDisableDialog] = useState(false);
    const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
    const [password, setPassword] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        check2FAStatus();
    }, []);

    const check2FAStatus = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${TWO_FACTOR_API_END_POINT}/status`, {
                withCredentials: true
            });
            setTwoFactorEnabled(res.data.data.twoFactorEnabled);
        } catch (error) {
            console.error('Failed to check 2FA status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnable2FA = () => {
        setShowSetupDialog(true);
    };

    const handleSetupComplete = () => {
        setShowSetupDialog(false);
        setTwoFactorEnabled(true);
        toast.success('Two-factor authentication is now enabled');
    };

    const handleDisable2FA = async (e) => {
        e.preventDefault();
        
        if (!password) {
            toast.error('Please enter your password');
            return;
        }

        try {
            setActionLoading(true);
            const res = await axios.post(
                `${TWO_FACTOR_API_END_POINT}/disable`,
                { password },
                { withCredentials: true }
            );

            if (res.data.success) {
                setTwoFactorEnabled(false);
                setShowDisableDialog(false);
                setPassword('');
                toast.success('Two-factor authentication disabled');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to disable 2FA');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRegenerateBackupCodes = async (e) => {
        e.preventDefault();
        
        if (!password) {
            toast.error('Please enter your password');
            return;
        }

        try {
            setActionLoading(true);
            const res = await axios.post(
                `${TWO_FACTOR_API_END_POINT}/regenerate-backup-codes`,
                { password },
                { withCredentials: true }
            );

            if (res.data.success) {
                const codes = res.data.data.backupCodes;
                
                // Download codes
                const content = `Job Portal - Two-Factor Authentication Backup Codes\n\nRegenerated: ${new Date().toLocaleString()}\n\nBackup Codes (use each code only once):\n\n${codes.map((code, i) => `${i + 1}. ${code}`).join('\n')}\n\nKeep these codes in a safe place. Each code can only be used once.`;
                
                const blob = new Blob([content], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `jobportal-2fa-backup-codes-${Date.now()}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                setShowRegenerateDialog(false);
                setPassword('');
                toast.success('New backup codes generated and downloaded');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to regenerate backup codes');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Two-Factor Authentication</h3>
                
                <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            {twoFactorEnabled ? (
                                <>
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <ShieldCheck className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-green-700">Enabled</p>
                                        <p className="text-sm text-gray-600">Your account is protected with 2FA</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                        <ShieldOff className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-700">Disabled</p>
                                        <p className="text-sm text-gray-600">Add an extra layer of security</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {!twoFactorEnabled ? (
                        <>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start">
                                    <Shield className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium mb-1">Secure your account</p>
                                        <p>Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.</p>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleEnable2FA} className="w-full">
                                <Shield className="mr-2 h-4 w-4" />
                                Enable Two-Factor Authentication
                            </Button>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <Button 
                                onClick={() => setShowRegenerateDialog(true)}
                                variant="outline"
                                className="w-full"
                            >
                                <Key className="mr-2 h-4 w-4" />
                                Regenerate Backup Codes
                            </Button>
                            <Button 
                                onClick={() => setShowDisableDialog(true)}
                                variant="destructive"
                                className="w-full"
                            >
                                <ShieldOff className="mr-2 h-4 w-4" />
                                Disable Two-Factor Authentication
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Setup Dialog */}
            <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <TwoFactorSetup 
                        onComplete={handleSetupComplete}
                        onCancel={() => setShowSetupDialog(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Disable Dialog */}
            <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                        <DialogDescription>
                            Enter your password to confirm disabling 2FA
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleDisable2FA} className="space-y-4 mt-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-yellow-800">
                                    <p className="font-medium mb-1">Warning</p>
                                    <p>Disabling 2FA will make your account less secure. You'll only need your password to log in.</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="disable-password">Password</Label>
                            <Input
                                id="disable-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                disabled={actionLoading}
                            />
                        </div>
                        <div className="flex space-x-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowDisableDialog(false);
                                    setPassword('');
                                }}
                                className="flex-1"
                                disabled={actionLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                className="flex-1"
                                disabled={actionLoading || !password}
                            >
                                {actionLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Disabling...
                                    </>
                                ) : (
                                    'Disable 2FA'
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Regenerate Backup Codes Dialog */}
            <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Regenerate Backup Codes</DialogTitle>
                        <DialogDescription>
                            Enter your password to generate new backup codes
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRegenerateBackupCodes} className="space-y-4 mt-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <Key className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1">New codes will replace old ones</p>
                                    <p>Your old backup codes will no longer work. Save the new codes in a safe place.</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="regenerate-password">Password</Label>
                            <Input
                                id="regenerate-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                disabled={actionLoading}
                            />
                        </div>
                        <div className="flex space-x-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowRegenerateDialog(false);
                                    setPassword('');
                                }}
                                className="flex-1"
                                disabled={actionLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={actionLoading || !password}
                            >
                                {actionLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    'Generate New Codes'
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TwoFactorSettings;
