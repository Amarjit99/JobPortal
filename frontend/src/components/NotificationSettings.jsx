import { useEffect, useState } from 'react';
import axios from '@/utils/axios';
import { USER_API_END_POINT } from '@/utils/constant';
import { toast } from 'sonner';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Bell, Mail, Briefcase } from 'lucide-react';

const NotificationSettings = () => {
    const [loading, setLoading] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState({
        jobAlerts: true,
        applicationUpdates: true,
        newApplicants: true
    });
    const [jobAlertPreferences, setJobAlertPreferences] = useState({
        jobTypes: [],
        locations: [],
        minSalary: 0,
        maxSalary: 50
    });

    const jobTypes = ['Full Time', 'Part Time', 'Contract', 'Internship'];
    const locations = [
        'Delhi NCR', 'Bangalore', 'Hyderabad', 'Pune', 
        'Mumbai', 'Chennai', 'Kolkata', 'Ahmedabad'
    ];

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const res = await axios.get(`${USER_API_END_POINT}/notification-preferences`, {
                withCredentials: true
            });
            if (res.data.success) {
                setEmailNotifications(res.data.emailNotifications);
                setJobAlertPreferences(res.data.jobAlertPreferences || {
                    jobTypes: [],
                    locations: [],
                    minSalary: 0,
                    maxSalary: 50
                });
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
        }
    };

    const handleEmailNotificationUpdate = async (key, value) => {
        try {
            const updatedNotifications = { ...emailNotifications, [key]: value };
            setEmailNotifications(updatedNotifications);

            const res = await axios.put(
                `${USER_API_END_POINT}/email-notifications`,
                updatedNotifications,
                { withCredentials: true }
            );

            if (res.data.success) {
                toast.success('Notification preferences updated');
            }
        } catch (error) {
            console.error('Error updating notifications:', error);
            toast.error('Failed to update preferences');
            // Revert on error
            setEmailNotifications(emailNotifications);
        }
    };

    const handleJobAlertUpdate = async () => {
        setLoading(true);
        try {
            const res = await axios.put(
                `${USER_API_END_POINT}/job-alert-preferences`,
                jobAlertPreferences,
                { withCredentials: true }
            );

            if (res.data.success) {
                toast.success('Job alert preferences saved');
            }
        } catch (error) {
            console.error('Error updating job alerts:', error);
            toast.error('Failed to save preferences');
        } finally {
            setLoading(false);
        }
    };

    const handleJobTypeToggle = (type) => {
        const updated = jobAlertPreferences.jobTypes.includes(type)
            ? jobAlertPreferences.jobTypes.filter(t => t !== type)
            : [...jobAlertPreferences.jobTypes, type];
        setJobAlertPreferences({ ...jobAlertPreferences, jobTypes: updated });
    };

    const handleLocationToggle = (location) => {
        const updated = jobAlertPreferences.locations.includes(location)
            ? jobAlertPreferences.locations.filter(l => l !== location)
            : [...jobAlertPreferences.locations, location];
        setJobAlertPreferences({ ...jobAlertPreferences, locations: updated });
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold mb-2">Notification Settings</h1>
                <p className="text-gray-600">Manage your email notifications and job alerts</p>
            </div>

            {/* Email Notifications */}
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <Mail className="w-5 h-5 text-[#6A38C2]" />
                    <h2 className="text-xl font-semibold">Email Notifications</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <Label className="text-base font-medium">Job Alerts</Label>
                            <p className="text-sm text-gray-600">
                                Receive daily emails about new jobs matching your preferences
                            </p>
                        </div>
                        <Switch
                            checked={emailNotifications.jobAlerts}
                            onCheckedChange={(value) => handleEmailNotificationUpdate('jobAlerts', value)}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <Label className="text-base font-medium">Application Updates</Label>
                            <p className="text-sm text-gray-600">
                                Get notified when your application status changes
                            </p>
                        </div>
                        <Switch
                            checked={emailNotifications.applicationUpdates}
                            onCheckedChange={(value) => handleEmailNotificationUpdate('applicationUpdates', value)}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <Label className="text-base font-medium">New Applicants (Recruiters)</Label>
                            <p className="text-sm text-gray-600">
                                Get notified when someone applies to your job posting
                            </p>
                        </div>
                        <Switch
                            checked={emailNotifications.newApplicants}
                            onCheckedChange={(value) => handleEmailNotificationUpdate('newApplicants', value)}
                        />
                    </div>
                </div>
            </div>

            {/* Job Alert Preferences */}
            {emailNotifications.jobAlerts && (
                <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Briefcase className="w-5 h-5 text-[#6A38C2]" />
                        <h2 className="text-xl font-semibold">Job Alert Preferences</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Job Types */}
                        <div>
                            <Label className="text-base font-medium mb-3 block">Job Types</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {jobTypes.map((type) => (
                                    <div key={type} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={type}
                                            checked={jobAlertPreferences.jobTypes.includes(type)}
                                            onCheckedChange={() => handleJobTypeToggle(type)}
                                        />
                                        <label htmlFor={type} className="text-sm cursor-pointer">
                                            {type}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Locations */}
                        <div>
                            <Label className="text-base font-medium mb-3 block">Preferred Locations</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {locations.map((location) => (
                                    <div key={location} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={location}
                                            checked={jobAlertPreferences.locations.includes(location)}
                                            onCheckedChange={() => handleLocationToggle(location)}
                                        />
                                        <label htmlFor={location} className="text-sm cursor-pointer">
                                            {location}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Salary Range */}
                        <div>
                            <Label className="text-base font-medium mb-3 block">
                                Salary Range: ₹{jobAlertPreferences.minSalary} - ₹{jobAlertPreferences.maxSalary} LPA
                            </Label>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm text-gray-600 mb-2 block">Minimum Salary</Label>
                                    <Slider
                                        value={[jobAlertPreferences.minSalary]}
                                        onValueChange={(value) => 
                                            setJobAlertPreferences({ ...jobAlertPreferences, minSalary: value[0] })
                                        }
                                        max={50}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600 mb-2 block">Maximum Salary</Label>
                                    <Slider
                                        value={[jobAlertPreferences.maxSalary]}
                                        onValueChange={(value) => 
                                            setJobAlertPreferences({ ...jobAlertPreferences, maxSalary: value[0] })
                                        }
                                        max={50}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button 
                            onClick={handleJobAlertUpdate} 
                            disabled={loading}
                            className="w-full bg-[#6A38C2] hover:bg-[#5b30a6]"
                        >
                            {loading ? 'Saving...' : 'Save Job Alert Preferences'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                    <p className="text-sm text-blue-900">
                        <strong>Daily Job Alerts:</strong> We'll send you an email every day at 9:00 AM IST 
                        with new jobs matching your preferences from the last 24 hours.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;
