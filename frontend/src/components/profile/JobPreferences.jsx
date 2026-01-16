import React, { useState, useEffect } from 'react';
import { MapPin, DollarSign, Clock, Plus, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import axios from '@/utils/axios';
import { toast } from 'sonner';

const JobPreferences = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [locationInput, setLocationInput] = useState('');
    const [preferences, setPreferences] = useState({
        preferredJobLocations: [],
        expectedSalary: {
            min: 0,
            max: 0,
            currency: 'INR'
        },
        noticePeriod: {
            value: 0,
            immediate: false
        }
    });

    const indianCities = [
        'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai',
        'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
        'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
        'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
        'Remote', 'Any Location'
    ];

    const noticePeriodOptions = [
        { label: 'Immediate / Available Now', value: 0, immediate: true },
        { label: '15 Days', value: 15, immediate: false },
        { label: '30 Days', value: 30, immediate: false },
        { label: '60 Days', value: 60, immediate: false },
        { label: '90 Days', value: 90, immediate: false }
    ];

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/v1/user/preferences', {
                withCredentials: true
            });

            if (response.data.success) {
                setPreferences(response.data.preferences);
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLocation = (location) => {
        const trimmedLocation = location.trim();
        if (trimmedLocation && !preferences.preferredJobLocations.includes(trimmedLocation)) {
            setPreferences(prev => ({
                ...prev,
                preferredJobLocations: [...prev.preferredJobLocations, trimmedLocation]
            }));
        }
        setLocationInput('');
    };

    const handleRemoveLocation = (locationToRemove) => {
        setPreferences(prev => ({
            ...prev,
            preferredJobLocations: prev.preferredJobLocations.filter(loc => loc !== locationToRemove)
        }));
    };

    const handleSalaryChange = (field, value) => {
        setPreferences(prev => ({
            ...prev,
            expectedSalary: {
                ...prev.expectedSalary,
                [field]: field === 'currency' ? value : parseInt(value) || 0
            }
        }));
    };

    const handleNoticePeriodChange = (value) => {
        const selected = noticePeriodOptions.find(opt => 
            opt.immediate ? opt.immediate.toString() === value : opt.value.toString() === value
        );
        
        if (selected) {
            setPreferences(prev => ({
                ...prev,
                noticePeriod: {
                    value: selected.value,
                    immediate: selected.immediate
                }
            }));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await axios.put(
                'http://localhost:8000/api/v1/user/preferences',
                preferences,
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Job preferences updated successfully');
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
            toast.error(error.response?.data?.message || 'Failed to save preferences');
        } finally {
            setSaving(false);
        }
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
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Job Preferences</h2>
                <p className="text-gray-600">Set your job search criteria to get better matches</p>
            </div>

            <div className="space-y-8">
                {/* Preferred Locations */}
                <div>
                    <Label className="text-lg font-semibold flex items-center gap-2 mb-3">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        Preferred Job Locations
                    </Label>
                    
                    <div className="flex gap-2 mb-3">
                        <Input
                            value={locationInput}
                            onChange={(e) => setLocationInput(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddLocation(locationInput);
                                }
                            }}
                            placeholder="Type a city or select below"
                            list="cities"
                        />
                        <datalist id="cities">
                            {indianCities.map((city, idx) => (
                                <option key={idx} value={city} />
                            ))}
                        </datalist>
                        <Button 
                            type="button" 
                            onClick={() => handleAddLocation(locationInput)}
                            variant="outline"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                        {indianCities.slice(0, 8).map((city, idx) => (
                            <Button
                                key={idx}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddLocation(city)}
                                className="text-xs"
                                disabled={preferences.preferredJobLocations.includes(city)}
                            >
                                {city}
                            </Button>
                        ))}
                    </div>

                    {preferences.preferredJobLocations.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
                            {preferences.preferredJobLocations.map((location, idx) => (
                                <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                                >
                                    {location}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveLocation(location)}
                                        className="ml-2 hover:text-blue-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Expected Salary */}
                <div>
                    <Label className="text-lg font-semibold flex items-center gap-2 mb-3">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        Expected Salary (Annual)
                    </Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="minSalary" className="text-sm mb-1">Minimum (LPA)</Label>
                            <Input
                                id="minSalary"
                                type="number"
                                min="0"
                                max="50"
                                value={preferences.expectedSalary.min || ''}
                                onChange={(e) => handleSalaryChange('min', e.target.value)}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <Label htmlFor="maxSalary" className="text-sm mb-1">Maximum (LPA)</Label>
                            <Input
                                id="maxSalary"
                                type="number"
                                min="0"
                                max="50"
                                value={preferences.expectedSalary.max || ''}
                                onChange={(e) => handleSalaryChange('max', e.target.value)}
                                placeholder="50"
                            />
                        </div>
                        <div>
                            <Label htmlFor="currency" className="text-sm mb-1">Currency</Label>
                            <Select
                                value={preferences.expectedSalary.currency}
                                onValueChange={(value) => handleSalaryChange('currency', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INR">INR (₹)</SelectItem>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {preferences.expectedSalary.min > 0 && preferences.expectedSalary.max > 0 && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-800">
                                Expected Range: {preferences.expectedSalary.currency === 'INR' ? '₹' : 
                                               preferences.expectedSalary.currency === 'USD' ? '$' :
                                               preferences.expectedSalary.currency === 'EUR' ? '€' : '£'}
                                {preferences.expectedSalary.min} - {preferences.expectedSalary.currency === 'INR' ? '₹' : 
                                               preferences.expectedSalary.currency === 'USD' ? '$' :
                                               preferences.expectedSalary.currency === 'EUR' ? '€' : '£'}
                                {preferences.expectedSalary.max} {preferences.expectedSalary.currency === 'INR' ? 'LPA' : 'per year'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Notice Period */}
                <div>
                    <Label className="text-lg font-semibold flex items-center gap-2 mb-3">
                        <Clock className="w-5 h-5 text-orange-600" />
                        Notice Period
                    </Label>
                    
                    <Select
                        value={preferences.noticePeriod.immediate ? 'true' : preferences.noticePeriod.value?.toString() || '0'}
                        onValueChange={handleNoticePeriodChange}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select notice period" />
                        </SelectTrigger>
                        <SelectContent>
                            {noticePeriodOptions.map((option, idx) => (
                                <SelectItem 
                                    key={idx} 
                                    value={option.immediate ? 'true' : option.value.toString()}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={saving} size="lg">
                        {saving ? 'Saving...' : 'Save Preferences'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default JobPreferences;
