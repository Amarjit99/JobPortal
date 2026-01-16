import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, Shield, Key } from 'lucide-react';
import { toast } from 'sonner';

const TwoFactorVerify = ({ email, onVerify, onCancel, onUseBackupCode }) => {
    const [token, setToken] = useState('');
    const [backupCode, setBackupCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [useBackup, setUseBackup] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (useBackup) {
            if (!backupCode.trim()) {
                toast.error('Please enter a backup code');
                return;
            }
            setLoading(true);
            await onVerify(null, backupCode.trim().toUpperCase());
            setLoading(false);
        } else {
            if (!token.trim() || token.length !== 6) {
                toast.error('Please enter a valid 6-digit code');
                return;
            }
            setLoading(true);
            await onVerify(token.trim(), null);
            setLoading(false);
        }
    };

    const handleTokenChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setToken(value);
    };

    const handleBackupCodeChange = (e) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
        setBackupCode(value);
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold">Two-Factor Authentication</h2>
                <p className="text-gray-600 mt-2">
                    {useBackup 
                        ? 'Enter one of your backup codes'
                        : 'Enter the 6-digit code from your authenticator app'
                    }
                </p>
                <p className="text-sm text-gray-500 mt-1">{email}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {!useBackup ? (
                    <div>
                        <Label htmlFor="token">Authentication Code</Label>
                        <Input
                            id="token"
                            type="text"
                            inputMode="numeric"
                            placeholder="000000"
                            value={token}
                            onChange={handleTokenChange}
                            maxLength={6}
                            className="text-center text-2xl tracking-widest font-mono"
                            autoFocus
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Code refreshes every 30 seconds
                        </p>
                    </div>
                ) : (
                    <div>
                        <Label htmlFor="backupCode">Backup Code</Label>
                        <Input
                            id="backupCode"
                            type="text"
                            placeholder="XXXXXXXX"
                            value={backupCode}
                            onChange={handleBackupCodeChange}
                            maxLength={8}
                            className="text-center text-xl tracking-wider font-mono uppercase"
                            autoFocus
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Each backup code can only be used once
                        </p>
                    </div>
                )}

                <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading || (!useBackup && token.length !== 6) || (useBackup && backupCode.length < 8)}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        'Verify & Login'
                    )}
                </Button>

                <div className="text-center space-y-2">
                    <button
                        type="button"
                        onClick={() => {
                            setUseBackup(!useBackup);
                            setToken('');
                            setBackupCode('');
                        }}
                        className="text-sm text-blue-600 hover:underline flex items-center justify-center mx-auto"
                    >
                        <Key className="h-3 w-3 mr-1" />
                        {useBackup ? 'Use authenticator code instead' : 'Use backup code instead'}
                    </button>

                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="text-sm text-gray-600 hover:underline block w-full"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                    <strong>Lost your device?</strong> Use one of your backup codes to access your account.
                </p>
            </div>
        </div>
    );
};

export default TwoFactorVerify;
