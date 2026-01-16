import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';

const ExperienceModal = ({ open, onClose, onSave, experience, mode }) => {
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
        skills: []
    });

    const [skillInput, setSkillInput] = useState('');

    // Sync form data when experience prop changes (for edit mode)
    React.useEffect(() => {
        if (experience) {
            setFormData({
                title: experience.title || '',
                company: experience.company || '',
                location: experience.location || '',
                startDate: experience.startDate ? new Date(experience.startDate).toISOString().split('T')[0] : '',
                endDate: experience.endDate ? new Date(experience.endDate).toISOString().split('T')[0] : '',
                current: experience.current || false,
                description: experience.description || '',
                skills: experience.skills || []
            });
        } else {
            // Reset form for add mode
            setFormData({
                title: '',
                company: '',
                location: '',
                startDate: '',
                endDate: '',
                current: false,
                description: '',
                skills: []
            });
            setSkillInput('');
        }
    }, [experience, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCurrentChange = (checked) => {
        setFormData(prev => ({
            ...prev,
            current: checked,
            endDate: checked ? '' : prev.endDate
        }));
    };

    const handleAddSkill = () => {
        const trimmedSkill = skillInput.trim();
        if (trimmedSkill && !formData.skills.includes(trimmedSkill)) {
            setFormData(prev => ({
                ...prev,
                skills: [...prev.skills, trimmedSkill]
            }));
            setSkillInput('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToRemove)
        }));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSkill();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        // Reset form
        setFormData({
            title: '',
            company: '',
            location: '',
            startDate: '',
            endDate: '',
            current: false,
            description: '',
            skills: []
        });
        setSkillInput('');
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'edit' ? 'Edit Work Experience' : 'Add Work Experience'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="title">Job Title *</Label>
                        <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Software Engineer"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="company">Company *</Label>
                        <Input
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            placeholder="e.g. Google Inc."
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g. San Francisco, CA"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
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

                        <div>
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

                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="current" 
                            checked={formData.current}
                            onCheckedChange={handleCurrentChange}
                        />
                        <Label htmlFor="current" className="cursor-pointer">
                            I currently work here
                        </Label>
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe your responsibilities and achievements..."
                            rows={4}
                        />
                    </div>

                    <div>
                        <Label htmlFor="skillInput">Skills</Label>
                        <div className="flex gap-2">
                            <Input
                                id="skillInput"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="e.g. React, Node.js"
                            />
                            <Button 
                                type="button" 
                                onClick={handleAddSkill}
                                variant="outline"
                            >
                                Add
                            </Button>
                        </div>
                        
                        {formData.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {formData.skills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                                    >
                                        {skill}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSkill(skill)}
                                            className="ml-1 hover:text-blue-600"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {mode === 'edit' ? 'Update' : 'Save'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ExperienceModal;
