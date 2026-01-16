import React, { useState, useEffect } from 'react';
import axios from '@/utils/axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, Save, RotateCcw, Mail } from 'lucide-react';
import { toast } from 'sonner';

const SystemSettings = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/v1/settings');
            if (res.data.success) {
                setSettings(res.data.settings);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const res = await axios.put('http://localhost:8000/api/v1/settings', settings);
            if (res.data.success) {
                toast.success('Settings saved successfully');
                setSettings(res.data.settings);
            }
        } catch (error) {
            console.error('Save settings error:', error);
            toast.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('Are you sure you want to reset all settings to defaults?')) return;

        try {
            setSaving(true);
            const res = await axios.post('http://localhost:8000/api/v1/settings/reset');
            if (res.data.success) {
                toast.success('Settings reset to defaults');
                setSettings(res.data.settings);
            }
        } catch (error) {
            console.error('Reset settings error:', error);
            toast.error('Failed to reset settings');
        } finally {
            setSaving(false);
        }
    };

    const handleTestEmail = async () => {
        const testEmail = prompt('Enter email address to send test email:');
        if (!testEmail) return;

        try {
            const res = await axios.post('http://localhost:8000/api/v1/settings/test-email', {
                testEmail
            });
            if (res.data.success) {
                toast.success('Test email sent successfully');
            }
        } catch (error) {
            console.error('Test email error:', error);
            toast.error('Failed to send test email');
        }
    };

    const updateField = (path, value) => {
        const keys = path.split('.');
        const newSettings = { ...settings };
        let current = newSettings;
        
        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = { ...current[keys[i]] };
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        setSettings(newSettings);
    };

    const updateArrayField = (path, value) => {
        // Convert comma-separated string to array
        const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
        updateField(path, arrayValue);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!settings) return null;

    const tabs = [
        { id: 'general', label: 'General' },
        { id: 'seo', label: 'SEO & Meta' },
        { id: 'features', label: 'Features' },
        { id: 'advanced', label: 'Advanced' },
        { id: 'email', label: 'Email' },
        { id: 'application', label: 'Application' }
    ];

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">System Settings</h1>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={saving}
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset to Defaults
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b mb-6">
                <div className="flex gap-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 border-b-2 transition ${
                                activeTab === tab.id
                                    ? 'border-[#F83002] text-[#F83002] font-semibold'
                                    : 'border-transparent hover:border-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* General Tab */}
            {activeTab === 'general' && (
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <Label>Site Name *</Label>
                            <Input
                                value={settings.siteName}
                                onChange={(e) => updateField('siteName', e.target.value)}
                                placeholder="JobPortal"
                            />
                        </div>
                        <div>
                            <Label>Contact Email *</Label>
                            <Input
                                type="email"
                                value={settings.contactEmail}
                                onChange={(e) => updateField('contactEmail', e.target.value)}
                                placeholder="contact@jobportal.com"
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <Label>Contact Phone</Label>
                            <Input
                                value={settings.contactPhone || ''}
                                onChange={(e) => updateField('contactPhone', e.target.value)}
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>
                        <div>
                            <Label>Address</Label>
                            <Input
                                value={settings.address || ''}
                                onChange={(e) => updateField('address', e.target.value)}
                                placeholder="123 Main St, City, Country"
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <Label>Logo URL</Label>
                            <Input
                                value={settings.logo}
                                onChange={(e) => updateField('logo', e.target.value)}
                                placeholder="/logo.png"
                            />
                        </div>
                        <div>
                            <Label>Favicon URL</Label>
                            <Input
                                value={settings.favicon}
                                onChange={(e) => updateField('favicon', e.target.value)}
                                placeholder="/favicon.ico"
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">Social Links</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            {Object.keys(settings.socialLinks).map(platform => (
                                <div key={platform}>
                                    <Label className="capitalize">{platform}</Label>
                                    <Input
                                        value={settings.socialLinks[platform]}
                                        onChange={(e) =>
                                            updateField(`socialLinks.${platform}`, e.target.value)
                                        }
                                        placeholder={`https://${platform}.com/...`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
                <div className="space-y-6">
                    <div>
                        <Label>Meta Title</Label>
                        <Input
                            value={settings.seoMeta.title}
                            onChange={(e) => updateField('seoMeta.title', e.target.value)}
                            placeholder="JobPortal - Find Your Dream Job"
                        />
                    </div>

                    <div>
                        <Label>Meta Description</Label>
                        <textarea
                            className="w-full border rounded-md p-2 min-h-[100px]"
                            value={settings.seoMeta.description}
                            onChange={(e) => updateField('seoMeta.description', e.target.value)}
                            placeholder="Search and apply for thousands of job opportunities..."
                        />
                    </div>

                    <div>
                        <Label>Meta Keywords (comma-separated)</Label>
                        <Input
                            value={settings.seoMeta.keywords.join(', ')}
                            onChange={(e) => updateArrayField('seoMeta.keywords', e.target.value)}
                            placeholder="jobs, careers, employment, hiring"
                        />
                    </div>

                    <div>
                        <Label>Open Graph Image URL</Label>
                        <Input
                            value={settings.seoMeta.ogImage}
                            onChange={(e) => updateField('seoMeta.ogImage', e.target.value)}
                            placeholder="/og-image.png"
                        />
                    </div>
                </div>
            )}

            {/* Features Tab */}
            {activeTab === 'features' && (
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                            <input
                                type="checkbox"
                                checked={settings.features.registrationEnabled}
                                onChange={(e) =>
                                    updateField('features.registrationEnabled', e.target.checked)
                                }
                                className="w-4 h-4"
                            />
                            <div>
                                <Label>Enable User Registration</Label>
                                <p className="text-sm text-gray-600">
                                    Allow new users to register on the platform
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                            <input
                                type="checkbox"
                                checked={settings.features.jobPostingEnabled}
                                onChange={(e) =>
                                    updateField('features.jobPostingEnabled', e.target.checked)
                                }
                                className="w-4 h-4"
                            />
                            <div>
                                <Label>Enable Job Posting</Label>
                                <p className="text-sm text-gray-600">
                                    Allow employers to post new job listings
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                            <input
                                type="checkbox"
                                checked={settings.features.enableEmailVerification}
                                onChange={(e) =>
                                    updateField('features.enableEmailVerification', e.target.checked)
                                }
                                className="w-4 h-4"
                            />
                            <div>
                                <Label>Enable Email Verification</Label>
                                <p className="text-sm text-gray-600">
                                    Require email verification for new accounts
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                            <input
                                type="checkbox"
                                checked={settings.features.enableTwoFactorAuth}
                                onChange={(e) =>
                                    updateField('features.enableTwoFactorAuth', e.target.checked)
                                }
                                className="w-4 h-4"
                            />
                            <div>
                                <Label>Enable Two-Factor Authentication</Label>
                                <p className="text-sm text-gray-600">
                                    Allow users to enable 2FA for enhanced security
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                            <input
                                type="checkbox"
                                checked={settings.features.enableJobAlerts}
                                onChange={(e) =>
                                    updateField('features.enableJobAlerts', e.target.checked)
                                }
                                className="w-4 h-4"
                            />
                            <div>
                                <Label>Enable Job Alerts</Label>
                                <p className="text-sm text-gray-600">
                                    Allow users to subscribe to job alert notifications
                                </p>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex items-center gap-3 p-4 border rounded-lg bg-yellow-50">
                                <input
                                    type="checkbox"
                                    checked={settings.features.maintenanceMode}
                                    onChange={(e) =>
                                        updateField('features.maintenanceMode', e.target.checked)
                                    }
                                    className="w-4 h-4"
                                />
                                <div className="flex-1">
                                    <Label>Maintenance Mode</Label>
                                    <p className="text-sm text-gray-600">
                                        Put the site in maintenance mode (only admins can access)
                                    </p>
                                </div>
                            </div>
                            {settings.features.maintenanceMode && (
                                <div className="mt-4">
                                    <Label>Maintenance Message</Label>
                                    <Input
                                        value={settings.features.maintenanceMessage}
                                        onChange={(e) =>
                                            updateField('features.maintenanceMessage', e.target.value)
                                        }
                                        placeholder="Site is under maintenance..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <Label>Max File Size (MB)</Label>
                            <Input
                                type="number"
                                min="1"
                                max="50"
                                value={settings.advanced.maxFileSize}
                                onChange={(e) =>
                                    updateField('advanced.maxFileSize', parseInt(e.target.value))
                                }
                            />
                            <p className="text-sm text-gray-600 mt-1">Between 1 and 50 MB</p>
                        </div>

                        <div>
                            <Label>Session Timeout (minutes)</Label>
                            <Input
                                type="number"
                                min="5"
                                max="1440"
                                value={settings.advanced.sessionTimeout}
                                onChange={(e) =>
                                    updateField('advanced.sessionTimeout', parseInt(e.target.value))
                                }
                            />
                            <p className="text-sm text-gray-600 mt-1">Between 5 and 1440 minutes</p>
                        </div>
                    </div>

                    <div>
                        <Label>Allowed File Types (comma-separated)</Label>
                        <Input
                            value={settings.advanced.allowedFileTypes.join(', ')}
                            onChange={(e) =>
                                updateArrayField('advanced.allowedFileTypes', e.target.value)
                            }
                            placeholder=".pdf, .doc, .docx"
                        />
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">Password Requirements</h3>
                        <div className="space-y-4">
                            <div>
                                <Label>Minimum Length</Label>
                                <Input
                                    type="number"
                                    min="6"
                                    max="32"
                                    value={settings.advanced.passwordMinLength}
                                    onChange={(e) =>
                                        updateField(
                                            'advanced.passwordMinLength',
                                            parseInt(e.target.value)
                                        )
                                    }
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={settings.advanced.passwordRequireSpecialChar}
                                    onChange={(e) =>
                                        updateField(
                                            'advanced.passwordRequireSpecialChar',
                                            e.target.checked
                                        )
                                    }
                                    className="w-4 h-4"
                                />
                                <Label>Require Special Character</Label>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={settings.advanced.passwordRequireNumber}
                                    onChange={(e) =>
                                        updateField('advanced.passwordRequireNumber', e.target.checked)
                                    }
                                    className="w-4 h-4"
                                />
                                <Label>Require Number</Label>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={settings.advanced.passwordRequireUppercase}
                                    onChange={(e) =>
                                        updateField(
                                            'advanced.passwordRequireUppercase',
                                            e.target.checked
                                        )
                                    }
                                    className="w-4 h-4"
                                />
                                <Label>Require Uppercase Letter</Label>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Tab */}
            {activeTab === 'email' && (
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <Label>From Name</Label>
                            <Input
                                value={settings.email.fromName}
                                onChange={(e) => updateField('email.fromName', e.target.value)}
                                placeholder="JobPortal"
                            />
                        </div>
                        <div>
                            <Label>From Email</Label>
                            <Input
                                type="email"
                                value={settings.email.fromEmail || ''}
                                onChange={(e) => updateField('email.fromEmail', e.target.value)}
                                placeholder="noreply@jobportal.com"
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Reply-To Email</Label>
                        <Input
                            type="email"
                            value={settings.email.replyToEmail || ''}
                            onChange={(e) => updateField('email.replyToEmail', e.target.value)}
                            placeholder="support@jobportal.com"
                        />
                    </div>

                    <div className="border-t pt-4">
                        <Button variant="outline" onClick={handleTestEmail}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Test Email
                        </Button>
                        <p className="text-sm text-gray-600 mt-2">
                            Send a test email to verify your configuration
                        </p>
                    </div>
                </div>
            )}

            {/* Application Tab */}
            {activeTab === 'application' && (
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <Label>Jobs Per Page</Label>
                            <Input
                                type="number"
                                min="6"
                                max="50"
                                value={settings.application.jobsPerPage}
                                onChange={(e) =>
                                    updateField('application.jobsPerPage', parseInt(e.target.value))
                                }
                            />
                        </div>

                        <div>
                            <Label>Companies Per Page</Label>
                            <Input
                                type="number"
                                min="5"
                                max="50"
                                value={settings.application.companiesPerPage}
                                onChange={(e) =>
                                    updateField(
                                        'application.companiesPerPage',
                                        parseInt(e.target.value)
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Max Applications Per Day</Label>
                        <Input
                            type="number"
                            min="1"
                            max="100"
                            value={settings.application.maxApplicationsPerDay}
                            onChange={(e) =>
                                updateField(
                                    'application.maxApplicationsPerDay',
                                    parseInt(e.target.value)
                                )
                            }
                        />
                        <p className="text-sm text-gray-600 mt-1">
                            Prevent spam by limiting applications per user per day
                        </p>
                    </div>

                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                        <input
                            type="checkbox"
                            checked={settings.application.allowMultipleApplications}
                            onChange={(e) =>
                                updateField('application.allowMultipleApplications', e.target.checked)
                            }
                            className="w-4 h-4"
                        />
                        <div>
                            <Label>Allow Multiple Applications</Label>
                            <p className="text-sm text-gray-600">
                                Allow users to apply to the same job multiple times
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemSettings;
