import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';

const EducationModal = ({ open, onClose, onSave, education, mode = 'add' }) => {
    const [formData, setFormData] = useState({
        degree: '',
        institution: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        grade: '',
        description: '',
        current: false
    });

    useEffect(() => {
        if (education && mode === 'edit') {
            setFormData({
                degree: education.degree || '',
                institution: education.institution || '',
                fieldOfStudy: education.fieldOfStudy || '',
                startDate: education.startDate ? new Date(education.startDate).toISOString().split('T')[0] : '',
                endDate: education.endDate ? new Date(education.endDate).toISOString().split('T')[0] : '',
                grade: education.grade || '',
                description: education.description || '',
                current: education.current || false
            });
        } else {
            // Reset form for add mode
            setFormData({
                degree: '',
                institution: '',
                fieldOfStudy: '',
                startDate: '',
                endDate: '',
                grade: '',
                description: '',
                current: false
            });
        }
    }, [education, mode, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCurrentChange = (checked) => {
        setFormData(prev => ({ 
            ...prev, 
            current: checked,
            endDate: checked ? '' : prev.endDate
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'add' ? 'Add Education' : 'Edit Education'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Degree */}
                    <div className="space-y-2">
                        <Label htmlFor="degree">Degree *</Label>
                        <Input
                            id="degree"
                            name="degree"
                            value={formData.degree}
                            onChange={handleChange}
                            placeholder="e.g., Bachelor of Science"
                            required
                        />
                    </div>

                    {/* Institution */}
                    <div className="space-y-2">
                        <Label htmlFor="institution">Institution *</Label>
                        <Input
                            id="institution"
                            name="institution"
                            value={formData.institution}
                            onChange={handleChange}
                            placeholder="e.g., University of Example"
                            required
                        />
                    </div>

                    {/* Field of Study */}
                    <div className="space-y-2">
                        <Label htmlFor="fieldOfStudy">Field of Study</Label>
                        <Input
                            id="fieldOfStudy"
                            name="fieldOfStudy"
                            value={formData.fieldOfStudy}
                            onChange={handleChange}
                            placeholder="e.g., Computer Science"
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date *</Label>
                            <Input
                                id="startDate"
                                name="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                name="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={handleChange}
                                disabled={formData.current}
                            />
                        </div>
                    </div>

                    {/* Currently Studying */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="current"
                            checked={formData.current}
                            onCheckedChange={handleCurrentChange}
                        />
                        <Label htmlFor="current" className="cursor-pointer">
                            I currently study here
                        </Label>
                    </div>

                    {/* Grade */}
                    <div className="space-y-2">
                        <Label htmlFor="grade">Grade/GPA</Label>
                        <Input
                            id="grade"
                            name="grade"
                            value={formData.grade}
                            onChange={handleChange}
                            placeholder="e.g., 3.8/4.0 or First Class"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Describe activities, coursework, achievements..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {mode === 'add' ? 'Add Education' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EducationModal;
