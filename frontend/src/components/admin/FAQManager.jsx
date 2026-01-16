import React, { useState, useEffect } from 'react';
import axios from '@/utils/axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Loader2, Plus, Edit, Trash2, ToggleLeft, ToggleRight, GripVertical, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';

const FAQManager = () => {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingFAQ, setEditingFAQ] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [draggedItem, setDraggedItem] = useState(null);

    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        category: 'general',
        order: 0
    });

    const categories = [
        { value: 'all', label: 'All Categories' },
        { value: 'general', label: 'General' },
        { value: 'job-seekers', label: 'Job Seekers' },
        { value: 'employers', label: 'Employers' },
        { value: 'payments', label: 'Payments' },
        { value: 'technical', label: 'Technical' },
        { value: 'account', label: 'Account' },
        { value: 'privacy', label: 'Privacy' }
    ];

    useEffect(() => {
        fetchFAQs();
    }, [selectedCategory]);

    const fetchFAQs = async () => {
        try {
            setLoading(true);
            const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};
            const res = await axios.get('http://localhost:8000/api/v1/faqs', { params });
            if (res.data.success) {
                setFaqs(res.data.faqs);
            }
        } catch (error) {
            console.error('Failed to fetch FAQs:', error);
            toast.error('Failed to load FAQs');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (faq = null) => {
        if (faq) {
            setEditingFAQ(faq);
            setFormData({
                question: faq.question,
                answer: faq.answer,
                category: faq.category,
                order: faq.order
            });
        } else {
            setEditingFAQ(null);
            setFormData({
                question: '',
                answer: '',
                category: selectedCategory !== 'all' ? selectedCategory : 'general',
                order: faqs.length
            });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingFAQ) {
                const res = await axios.put(
                    `http://localhost:8000/api/v1/faqs/${editingFAQ._id}`,
                    formData
                );
                if (res.data.success) {
                    toast.success('FAQ updated successfully');
                    fetchFAQs();
                    setDialogOpen(false);
                }
            } else {
                const res = await axios.post(
                    'http://localhost:8000/api/v1/faqs/create',
                    formData
                );
                if (res.data.success) {
                    toast.success('FAQ created successfully');
                    fetchFAQs();
                    setDialogOpen(false);
                }
            }
        } catch (error) {
            console.error('Save FAQ error:', error);
            toast.error(error.response?.data?.message || 'Failed to save FAQ');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this FAQ?')) return;

        try {
            const res = await axios.delete(`http://localhost:8000/api/v1/faqs/${id}`);
            if (res.data.success) {
                toast.success('FAQ deleted successfully');
                fetchFAQs();
            }
        } catch (error) {
            console.error('Delete FAQ error:', error);
            toast.error('Failed to delete FAQ');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const res = await axios.patch(`http://localhost:8000/api/v1/faqs/${id}/toggle`);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchFAQs();
            }
        } catch (error) {
            console.error('Toggle status error:', error);
            toast.error('Failed to toggle status');
        }
    };

    const handleDragStart = (e, faq) => {
        setDraggedItem(faq);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, targetFaq) => {
        e.preventDefault();
        
        if (!draggedItem || draggedItem._id === targetFaq._id) return;

        const draggedIndex = faqs.findIndex(f => f._id === draggedItem._id);
        const targetIndex = faqs.findIndex(f => f._id === targetFaq._id);

        // Create new array with reordered items
        const newFaqs = [...faqs];
        const [removed] = newFaqs.splice(draggedIndex, 1);
        newFaqs.splice(targetIndex, 0, removed);

        // Update order values
        const updates = newFaqs.map((faq, index) => ({
            id: faq._id,
            order: index
        }));

        setFaqs(newFaqs);

        try {
            await axios.post('http://localhost:8000/api/v1/faqs/reorder', { updates });
            toast.success('FAQs reordered successfully');
        } catch (error) {
            console.error('Reorder error:', error);
            toast.error('Failed to reorder FAQs');
            fetchFAQs(); // Revert on error
        }

        setDraggedItem(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">FAQ Management</h1>
                    <p className="text-gray-600 mt-1">Manage frequently asked questions</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    New FAQ
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

            {/* FAQ List */}
            <div className="space-y-3">
                {faqs.map((faq) => (
                    <div
                        key={faq._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, faq)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, faq)}
                        className="border rounded-lg p-4 bg-white hover:shadow-md transition cursor-move"
                    >
                        <div className="flex items-start gap-3">
                            <GripVertical className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-lg">{faq.question}</h3>
                                    <Badge variant={faq.isPublished ? 'default' : 'secondary'}>
                                        {faq.isPublished ? 'Published' : 'Draft'}
                                    </Badge>
                                    <Badge variant="outline">{faq.category}</Badge>
                                </div>
                                
                                <p className="text-gray-700 mb-3 whitespace-pre-wrap">{faq.answer}</p>
                                
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Eye className="h-4 w-4" />
                                        {faq.views} views
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <ThumbsUp className="h-4 w-4" />
                                        {faq.helpful} helpful
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <ThumbsDown className="h-4 w-4" />
                                        {faq.notHelpful} not helpful
                                    </span>
                                    <span>Order: {faq.order}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 flex-shrink-0">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenDialog(faq)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleStatus(faq._id)}
                                >
                                    {faq.isPublished ? (
                                        <ToggleRight className="h-4 w-4" />
                                    ) : (
                                        <ToggleLeft className="h-4 w-4" />
                                    )}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(faq._id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}

                {faqs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No FAQs found. Create your first FAQ to get started.
                    </div>
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingFAQ ? 'Edit FAQ' : 'Create New FAQ'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Question *</Label>
                            <Input
                                value={formData.question}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                placeholder="What is your question?"
                                required
                            />
                        </div>

                        <div>
                            <Label>Answer *</Label>
                            <textarea
                                className="w-full border rounded-md p-2 min-h-[150px]"
                                value={formData.answer}
                                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                placeholder="Provide a detailed answer..."
                                required
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
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

                            <div>
                                <Label>Display Order</Label>
                                <Input
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingFAQ ? 'Update FAQ' : 'Create FAQ'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FAQManager;
