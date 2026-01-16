import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from '@/utils/axios';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, Video, Phone, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';

const INTERVIEW_API_END_POINT = "http://localhost:8000/api/v1/interviews";
const APPLICATION_API_END_POINT = "http://localhost:8000/api/v1/application";

const InterviewScheduler = ({ open, setOpen, applicationId }) => {
    const [loading, setLoading] = useState(false);
    const [application, setApplication] = useState(null);
    const { user } = useSelector(store => store.auth);

    const [formData, setFormData] = useState({
        interviewDate: '',
        interviewTime: '',
        duration: 60,
        interviewType: 'video',
        location: '',
        meetingLink: '',
        interviewRound: 'screening',
        instructions: ''
    });

    // Fetch application details
    useEffect(() => {
        if (applicationId && open) {
            fetchApplicationDetails();
        }
    }, [applicationId, open]);

    const fetchApplicationDetails = async () => {
        try {
            const res = await axios.get(`${APPLICATION_API_END_POINT}/${applicationId}`, {
                withCredentials: true
            });
            if (res.data.success) {
                setApplication(res.data.application);
            }
        } catch (error) {
            console.error('Error fetching application:', error);
            toast.error('Failed to load application details');
        }
    };

    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.interviewDate || !formData.interviewTime || !formData.interviewType) {
            toast.error('Please fill all required fields');
            return;
        }

        // Validate location or meeting link based on interview type
        if (formData.interviewType === 'in-person' && !formData.location) {
            toast.error('Please provide interview location');
            return;
        }
        if (formData.interviewType === 'video' && !formData.meetingLink) {
            toast.error('Please provide meeting link');
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(
                `${INTERVIEW_API_END_POINT}/send`,
                {
                    applicationId,
                    ...formData
                },
                { withCredentials: true }
            );

            if (res.data.success) {
                toast.success('Interview invitation sent successfully');
                setOpen(false);
                resetForm();
            }
        } catch (error) {
            console.error('Error sending invitation:', error);
            toast.error(error.response?.data?.message || 'Failed to send interview invitation');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            interviewDate: '',
            interviewTime: '',
            duration: 60,
            interviewType: 'video',
            location: '',
            meetingLink: '',
            interviewRound: 'screening',
            instructions: ''
        });
    };

    const handleClose = () => {
        setOpen(false);
        resetForm();
    };

    // Get minimum date (today)
    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Schedule Interview</DialogTitle>
                    <DialogDescription>
                        Send an interview invitation to{' '}
                        <span className="font-semibold">{application?.applicant?.fullname}</span>
                        {application?.job && (
                            <> for the position of <span className="font-semibold">{application.job.title}</span></>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="interviewDate">
                                Interview Date <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    id="interviewDate"
                                    type="date"
                                    min={getMinDate()}
                                    value={formData.interviewDate}
                                    onChange={(e) => handleChange('interviewDate', e.target.value)}
                                    className="pl-9"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="interviewTime">
                                Interview Time <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    id="interviewTime"
                                    type="time"
                                    value={formData.interviewTime}
                                    onChange={(e) => handleChange('interviewTime', e.target.value)}
                                    className="pl-9"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input
                            id="duration"
                            type="number"
                            min="15"
                            max="240"
                            step="15"
                            value={formData.duration}
                            onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                        />
                    </div>

                    {/* Interview Type */}
                    <div className="space-y-2">
                        <Label htmlFor="interviewType">
                            Interview Type <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                            value={formData.interviewType}
                            onValueChange={(value) => handleChange('interviewType', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select interview type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="video">
                                    <div className="flex items-center gap-2">
                                        <Video className="w-4 h-4" />
                                        <span>Video Call</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="phone">
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        <span>Phone Call</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="in-person">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        <span>In-Person</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Conditional: Location or Meeting Link */}
                    {formData.interviewType === 'in-person' && (
                        <div className="space-y-2">
                            <Label htmlFor="location">
                                Location <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                <Textarea
                                    id="location"
                                    placeholder="Enter office address..."
                                    value={formData.location}
                                    onChange={(e) => handleChange('location', e.target.value)}
                                    className="pl-9"
                                    rows={2}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {formData.interviewType === 'video' && (
                        <div className="space-y-2">
                            <Label htmlFor="meetingLink">
                                Meeting Link <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="meetingLink"
                                type="url"
                                placeholder="https://meet.google.com/..."
                                value={formData.meetingLink}
                                onChange={(e) => handleChange('meetingLink', e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {formData.interviewType === 'phone' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                The candidate will be contacted via the phone number provided in their application.
                            </p>
                        </div>
                    )}

                    {/* Interview Round */}
                    <div className="space-y-2">
                        <Label htmlFor="interviewRound">Interview Round</Label>
                        <Select 
                            value={formData.interviewRound}
                            onValueChange={(value) => handleChange('interviewRound', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select round" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="screening">Screening</SelectItem>
                                <SelectItem value="technical">Technical</SelectItem>
                                <SelectItem value="hr">HR Round</SelectItem>
                                <SelectItem value="final">Final Round</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-2">
                        <Label htmlFor="instructions">Instructions for Candidate</Label>
                        <Textarea
                            id="instructions"
                            placeholder="Add any special instructions, topics to prepare, documents to bring, etc."
                            value={formData.instructions}
                            onChange={(e) => handleChange('instructions', e.target.value)}
                            rows={4}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Invitation'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default InterviewScheduler;
