import React, { useState, useEffect } from 'react';
import axios from '@/utils/axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
    Loader2, Plus, Edit, Trash2, Copy, Eye, EyeOff, 
    Mail, ToggleLeft, ToggleRight, ChevronDown, ChevronUp 
} from 'lucide-react';
import { toast } from 'sonner';

const EmailTemplateManager = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [expandedTemplate, setExpandedTemplate] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        htmlBody: '',
        textBody: '',
        category: 'other',
        variables: []
    });

    const categories = [
        { value: 'all', label: 'All Templates' },
        { value: 'verification', label: 'Verification' },
        { value: 'password-reset', label: 'Password Reset' },
        { value: 'job-alert', label: 'Job Alert' },
        { value: 'application-update', label: 'Application Update' },
        { value: 'interview-invitation', label: 'Interview' },
        { value: 'job-posted', label: 'Job Posted' },
        { value: 'profile-update', label: 'Profile Update' },
        { value: 'welcome', label: 'Welcome' },
        { value: 'notification', label: 'Notification' },
        { value: 'other', label: 'Other' }
    ];

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
        ]
    };

    useEffect(() => {
        fetchTemplates();
    }, [selectedCategory]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};
            const res = await axios.get('http://localhost:8000/api/v1/email-templates', { params });
            if (res.data.success) {
                setTemplates(res.data.templates);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (template = null) => {
        if (template) {
            setEditingTemplate(template);
            setFormData({
                name: template.name,
                subject: template.subject,
                htmlBody: template.htmlBody,
                textBody: template.textBody || '',
                category: template.category,
                variables: template.variables || []
            });
        } else {
            setEditingTemplate(null);
            setFormData({
                name: '',
                subject: '',
                htmlBody: '',
                textBody: '',
                category: 'other',
                variables: []
            });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingTemplate) {
                const res = await axios.put(
                    `http://localhost:8000/api/v1/email-templates/${editingTemplate._id}`,
                    formData
                );
                if (res.data.success) {
                    toast.success('Template updated successfully');
                    fetchTemplates();
                    setDialogOpen(false);
                }
            } else {
                const res = await axios.post(
                    'http://localhost:8000/api/v1/email-templates/create',
                    formData
                );
                if (res.data.success) {
                    toast.success('Template created successfully');
                    fetchTemplates();
                    setDialogOpen(false);
                }
            }
        } catch (error) {
            console.error('Save template error:', error);
            toast.error(error.response?.data?.message || 'Failed to save template');
        }
    };

    const handleDelete = async (id, isDefault) => {
        if (isDefault) {
            toast.error('Cannot delete default template');
            return;
        }

        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            const res = await axios.delete(`http://localhost:8000/api/v1/email-templates/${id}`);
            if (res.data.success) {
                toast.success('Template deleted successfully');
                fetchTemplates();
            }
        } catch (error) {
            console.error('Delete template error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete template');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const res = await axios.patch(`http://localhost:8000/api/v1/email-templates/${id}/toggle`);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchTemplates();
            }
        } catch (error) {
            console.error('Toggle status error:', error);
            toast.error('Failed to toggle status');
        }
    };

    const handleDuplicate = async (id) => {
        try {
            const res = await axios.post(`http://localhost:8000/api/v1/email-templates/${id}/duplicate`);
            if (res.data.success) {
                toast.success('Template duplicated successfully');
                fetchTemplates();
            }
        } catch (error) {
            console.error('Duplicate error:', error);
            toast.error('Failed to duplicate template');
        }
    };

    const handlePreview = async (template) => {
        try {
            const sampleData = {};
            template.variables.forEach(v => {
                sampleData[v.name] = v.example;
            });

            const res = await axios.post(
                `http://localhost:8000/api/v1/email-templates/${template._id}/preview`,
                { sampleData }
            );

            if (res.data.success) {
                setPreviewData(res.data.preview);
                setPreviewOpen(true);
            }
        } catch (error) {
            console.error('Preview error:', error);
            toast.error('Failed to generate preview');
        }
    };

    const addVariable = () => {
        setFormData({
            ...formData,
            variables: [...formData.variables, { name: '', description: '', example: '' }]
        });
    };

    const removeVariable = (index) => {
        const newVariables = formData.variables.filter((_, i) => i !== index);
        setFormData({ ...formData, variables: newVariables });
    };

    const updateVariable = (index, field, value) => {
        const newVariables = [...formData.variables];
        newVariables[index][field] = value;
        setFormData({ ...formData, variables: newVariables });
    };

    const insertVariable = (variableName) => {
        const cursorPosition = document.activeElement;
        const tag = `{{${variableName}}}`;
        
        // Insert into subject if subject field is focused
        if (cursorPosition && cursorPosition.name === 'subject') {
            const start = cursorPosition.selectionStart;
            const end = cursorPosition.selectionEnd;
            const newValue = formData.subject.substring(0, start) + tag + formData.subject.substring(end);
            setFormData({ ...formData, subject: newValue });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Email Template Manager</h1>
                    <p className="text-gray-600 mt-1">Manage email templates for notifications and communications</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Template
                </Button>
            </div>

            {/* Category Filter */}
            <div className="mb-6 flex gap-2 flex-wrap">
                {categories.map(cat => (
                    <Button
                        key={cat.value}
                        variant={selectedCategory === cat.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(cat.value)}
                    >
                        {cat.label}
                    </Button>
                ))}
            </div>

            {/* Templates List */}
            <div className="space-y-4">
                {templates.map(template => (
                    <div key={template._id} className="border rounded-lg">
                        <div 
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                            onClick={() => setExpandedTemplate(
                                expandedTemplate === template._id ? null : template._id
                            )}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold">{template.name}</h3>
                                    <Badge variant={template.isActive ? 'default' : 'secondary'}>
                                        {template.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <Badge variant="outline">{template.category}</Badge>
                                    {template.isDefault && (
                                        <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {template.variables.length} variables • 
                                    Updated {new Date(template.updatedAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex gap-2 items-center">
                                {expandedTemplate === template._id ? (
                                    <ChevronUp className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-400" />
                                )}
                            </div>
                        </div>

                        {expandedTemplate === template._id && (
                            <div className="border-t p-4 bg-gray-50">
                                <div className="flex gap-2 mb-4">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDialog(template);
                                        }}
                                    >
                                        <Edit className="mr-1 h-4 w-4" />
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePreview(template);
                                        }}
                                    >
                                        <Eye className="mr-1 h-4 w-4" />
                                        Preview
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleStatus(template._id);
                                        }}
                                    >
                                        {template.isActive ? (
                                            <ToggleRight className="mr-1 h-4 w-4" />
                                        ) : (
                                            <ToggleLeft className="mr-1 h-4 w-4" />
                                        )}
                                        {template.isActive ? 'Deactivate' : 'Activate'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDuplicate(template._id);
                                        }}
                                    >
                                        <Copy className="mr-1 h-4 w-4" />
                                        Duplicate
                                    </Button>
                                    {!template.isDefault && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(template._id, template.isDefault);
                                            }}
                                        >
                                            <Trash2 className="mr-1 h-4 w-4" />
                                            Delete
                                        </Button>
                                    )}
                                </div>

                                {template.variables.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="font-semibold mb-2">Available Variables:</h4>
                                        <div className="grid md:grid-cols-2 gap-2">
                                            {template.variables.map((v, idx) => (
                                                <div key={idx} className="text-sm bg-white p-2 rounded border">
                                                    <code className="text-[#F83002]">{`{{${v.name}}}`}</code>
                                                    <span className="text-gray-600 ml-2">- {v.description}</span>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Example: {v.example}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTemplate ? 'Edit Template' : 'Create New Template'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Template Name *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Email Verification"
                                    required
                                    disabled={editingTemplate?.isDefault}
                                />
                            </div>
                            <div>
                                <Label>Category *</Label>
                                <select
                                    className="w-full border rounded-md p-2"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                >
                                    {categories.filter(c => c.value !== 'all').map(cat => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label>Subject Line *</Label>
                            <Input
                                name="subject"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="Verify Your Email - {{siteName}}"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Use {`{{variableName}}`} for dynamic content
                            </p>
                        </div>

                        <div>
                            <Label>HTML Body *</Label>
                            <ReactQuill
                                theme="snow"
                                value={formData.htmlBody}
                                onChange={(value) => setFormData({ ...formData, htmlBody: value })}
                                modules={modules}
                                className="bg-white"
                            />
                        </div>

                        <div>
                            <Label>Plain Text Body (Optional)</Label>
                            <textarea
                                className="w-full border rounded-md p-2 min-h-[100px]"
                                value={formData.textBody}
                                onChange={(e) => setFormData({ ...formData, textBody: e.target.value })}
                                placeholder="Plain text version for email clients that don't support HTML"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <Label>Variables</Label>
                                <Button type="button" size="sm" onClick={addVariable}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Variable
                                </Button>
                            </div>
                            {formData.variables.map((variable, index) => (
                                <div key={index} className="grid md:grid-cols-4 gap-2 mb-2">
                                    <Input
                                        placeholder="Variable name"
                                        value={variable.name}
                                        onChange={(e) => updateVariable(index, 'name', e.target.value)}
                                    />
                                    <Input
                                        placeholder="Description"
                                        value={variable.description}
                                        onChange={(e) => updateVariable(index, 'description', e.target.value)}
                                    />
                                    <Input
                                        placeholder="Example value"
                                        value={variable.example}
                                        onChange={(e) => updateVariable(index, 'example', e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => insertVariable(variable.name)}
                                            className="flex-1"
                                        >
                                            Insert
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => removeVariable(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingTemplate ? 'Update Template' : 'Create Template'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Email Preview</DialogTitle>
                    </DialogHeader>

                    {previewData && (
                        <div className="space-y-4">
                            <div>
                                <Label>Subject:</Label>
                                <div className="p-3 bg-gray-100 rounded mt-1">{previewData.subject}</div>
                            </div>

                            <div>
                                <Label>HTML Preview:</Label>
                                <div 
                                    className="p-4 bg-white border rounded mt-1"
                                    dangerouslySetInnerHTML={{ __html: previewData.html }}
                                />
                            </div>

                            {previewData.text && (
                                <div>
                                    <Label>Plain Text:</Label>
                                    <pre className="p-3 bg-gray-100 rounded mt-1 whitespace-pre-wrap">
                                        {previewData.text}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EmailTemplateManager;
