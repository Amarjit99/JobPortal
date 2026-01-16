import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, Download, Copy, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import axios from '@/utils/axios';
import { TWO_FACTOR_API_END_POINT } from '@/utils/constant';

const TwoFactorSetup = ({ onComplete, onCancel }) => {
    const [step, setStep] = useState(1); // 1: setup, 2: verify, 3: backup codes
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [token, setToken] = useState('');
    const [backupCodes, setBackupCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        initiate2FASetup();
    }, []);

    const initiate2FASetup = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${TWO_FACTOR_API_END_POINT}/setup`, {
                withCredentials: true
            });
            
            if (res.data.success) {
                setQrCode(res.data.data.qrCode);
                setSecret(res.data.data.secret);
                toast.success('Scan the QR code with your authenticator app');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to setup 2FA');
            if (onCancel) onCancel();
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndEnable = async (e) => {
        e.preventDefault();
        
        if (token.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        try {
            setLoading(true);

            // First verify the token
            await axios.post(`${TWO_FACTOR_API_END_POINT}/verify`, 
                { token }, 
                { withCredentials: true }
            );

            // Then enable 2FA
            const res = await axios.post(`${TWO_FACTOR_API_END_POINT}/enable`, 
                { token }, 
                { withCredentials: true }
            );

            if (res.data.success) {
                setBackupCodes(res.data.data.backupCodes);
                setStep(3);
                toast.success('2FA enabled successfully!');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    const handleTokenChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setToken(value);
    };

    const copySecret = () => {
        navigator.clipboard.writeText(secret);
        setCopied(true);
        toast.success('Secret key copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadBackupCodes = () => {
        const content = `Job Portal - Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\nBackup Codes (use each code only once):\n\n${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}\n\nKeep these codes in a safe place. Each code can only be used once.`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jobportal-2fa-backup-codes.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Backup codes downloaded');
    };

    const copyBackupCodes = () => {
        const text = backupCodes.join('\n');
        navigator.clipboard.writeText(text);
        toast.success('Backup codes copied to clipboard');
    };

    if (loading && step === 1) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
                <div className="flex items-center space-x-4">
                    <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                            1
                        </div>
                        <span className="ml-2 text-sm font-medium">Scan QR</span>
                    </div>
                    <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                            2
                        </div>
                        <span className="ml-2 text-sm font-medium">Verify</span>
                    </div>
                    <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                            3
                        </div>
                        <span className="ml-2 text-sm font-medium">Backup</span>
                    </div>
                </div>
            </div>

            {/* Step 1: QR Code */}
            {step === 1 && (
                <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Set Up Two-Factor Authentication</h2>
                    <p className="text-gray-600 mb-6">Scan the QR code with your authenticator app</p>

                    <div className="bg-white p-6 rounded-lg border-2 border-gray-200 mb-6 inline-block">
                        {qrCode && <img src={qrCode} alt="QR Code" className="w-64 h-64" />}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <p className="text-sm text-gray-700 mb-2 font-medium">Can't scan? Enter this key manually:</p>
                        <div className="flex items-center justify-center space-x-2">
                            <code className="bg-white px-4 py-2 rounded border text-sm font-mono">
                                {secret}
                            </code>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={copySecret}
                            >
                                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3 text-left bg-blue-50 p-4 rounded-lg mb-6">
                        <p className="font-medium text-blue-900">Recommended Apps:</p>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Google Authenticator (iOS & Android)</li>
                            <li>• Microsoft Authenticator (iOS & Android)</li>
                            <li>• Authy (iOS, Android & Desktop)</li>
                        </ul>
                    </div>

                    <Button 
                        onClick={() => setStep(2)} 
                        className="w-full"
                    >
                        I've Scanned the QR Code
                    </Button>
                </div>
            )}

            {/* Step 2: Verify Token */}
            {step === 2 && (
                <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Verify Your Setup</h2>
                    <p className="text-gray-600 mb-6">Enter the 6-digit code from your authenticator app</p>

                    <form onSubmit={handleVerifyAndEnable} className="space-y-6">
                        <div>
                            <Label htmlFor="token" className="sr-only">Verification Code</Label>
                            <Input
                                id="token"
                                type="text"
                                inputMode="numeric"
                                placeholder="000000"
                                value={token}
                                onChange={handleTokenChange}
                                maxLength={6}
                                className="text-center text-3xl tracking-widest font-mono"
                                autoFocus
                                disabled={loading}
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                This code refreshes every 30 seconds
                            </p>
                        </div>

                        <div className="flex space-x-3">
                            <Button 
                                type="button"
                                variant="outline"
                                onClick={() => setStep(1)}
                                className="flex-1"
                                disabled={loading}
                            >
                                Back
                            </Button>
                            <Button 
                                type="submit" 
                                className="flex-1"
                                disabled={loading || token.length !== 6}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify & Enable'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Step 3: Backup Codes */}
            {step === 3 && (
                <div>
                    <div className="text-center mb-6">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">2FA Enabled Successfully!</h2>
                        <p className="text-gray-600">Save your backup codes in a safe place</p>
                    </div>

                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-800">
                                <p className="font-medium mb-1">Important: Save these backup codes!</p>
                                <p>Each code can be used once to access your account if you lose your device.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg border mb-6">
                        <div className="grid grid-cols-2 gap-3">
                            {backupCodes.map((code, index) => (
                                <div key={index} className="bg-white p-3 rounded border text-center">
                                    <span className="text-xs text-gray-500 block mb-1">{index + 1}</span>
                                    <code className="font-mono font-medium">{code}</code>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex space-x-3 mb-4">
                        <Button 
                            onClick={downloadBackupCodes}
                            variant="outline"
                            className="flex-1"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                        <Button 
                            onClick={copyBackupCodes}
                            variant="outline"
                            className="flex-1"
                        >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                        </Button>
                    </div>

                    <Button 
                        onClick={onComplete}
                        className="w-full"
                    >
                        Done
                    </Button>
                </div>
            )}

            {/* Cancel Button (only on steps 1 and 2) */}
            {step < 3 && onCancel && (
                <div className="text-center mt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-sm text-gray-600 hover:underline"
                    >
                        Cancel Setup
                    </button>
                </div>
            )}
        </div>
    );
};

export default TwoFactorSetup;
