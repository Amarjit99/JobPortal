import React, { useState, useEffect } from 'react';
import axios from '@/utils/axios';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Image as ImageIcon, BarChart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Badge } from '../ui/badge';

const BannerManagement = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        image: '',
        link: '',
        linkText: 'Learn More',
        displayOrder: 0,
        startDate: '',
        endDate: '',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        targetAudience: 'all'
    });

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:8000/api/v1/banners/all');
            if (res.data.success) {
                setBanners(res.data.banners);
            }
        } catch (error) {
            toast.error('Failed to fetch banners');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editingBanner
                ? `http://localhost:8000/api/v1/banners/${editingBanner._id}`
                : 'http://localhost:8000/api/v1/banners/create';
            
            const method = editingBanner ? 'put' : 'post';
            
            const res = await axios[method](url, formData);

            if (res.data.success) {
                toast.success(editingBanner ? 'Banner updated successfully' : 'Banner created successfully');
                setDialogOpen(false);
                resetForm();
                fetchBanners();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const res = await axios.patch(`http://localhost:8000/api/v1/banners/${id}/toggle`);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchBanners();
            }
        } catch (error) {
            toast.error('Failed to toggle banner status');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this banner?')) return;

        try {
            const res = await axios.delete(`http://localhost:8000/api/v1/banners/${id}`);
            if (res.data.success) {
                toast.success('Banner deleted successfully');
                fetchBanners();
            }
        } catch (error) {
            toast.error('Failed to delete banner');
        }
    };

    const openEditDialog = (banner) => {
        setEditingBanner(banner);
        setFormData({
            title: banner.title,
            subtitle: banner.subtitle || '',
            image: banner.image,
            link: banner.link || '',
            linkText: banner.linkText || 'Learn More',
            displayOrder: banner.displayOrder,
            startDate: banner.startDate ? new Date(banner.startDate).toISOString().slice(0, 16) : '',
            endDate: banner.endDate ? new Date(banner.endDate).toISOString().slice(0, 16) : '',
            backgroundColor: banner.backgroundColor || '#ffffff',
            textColor: banner.textColor || '#000000',
            targetAudience: banner.targetAudience || 'all'
        });
        setDialogOpen(true);
    };

    const resetForm = () => {
        setEditingBanner(null);
        setFormData({
            title: '',
            subtitle: '',
            image: '',
            link: '',
            linkText: 'Learn More',
            displayOrder: 0,
            startDate: '',
            endDate: '',
            backgroundColor: '#ffffff',
            textColor: '#000000',
            targetAudience: 'all'
        });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Banner Management</h1>
                <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Create Banner
                </Button>
            </div>

            {loading && !banners.length ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {banners.map((banner) => (
                        <div key={banner._id} className="border rounded-lg p-4 flex items-center gap-4">
                            <img
                                src={banner.image}
                                alt={banner.title}
                                className="w-32 h-20 object-cover rounded"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold">{banner.title}</h3>
                                    <Badge variant={banner.isActive ? "default" : "secondary"}>
                                        {banner.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <Badge variant="outline">{banner.targetAudience}</Badge>
                                </div>
                                {banner.subtitle && (
                                    <p className="text-sm text-gray-600">{banner.subtitle}</p>
                                )}
                                <div className="flex gap-4 text-xs text-gray-500 mt-2">
                                    <span>Order: {banner.displayOrder}</span>
                                    <span>Clicks: {banner.clicks}</span>
                                    <span>Impressions: {banner.impressions}</span>
                                    <span>CTR: {banner.impressions > 0 ? ((banner.clicks / banner.impressions) * 100).toFixed(2) : 0}%</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => openEditDialog(banner)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleStatus(banner._id)}
                                >
                                    {banner.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(banner._id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingBanner ? 'Edit Banner' : 'Create Banner'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                maxLength={100}
                            />
                        </div>
                        <div>
                            <Label htmlFor="subtitle">Subtitle</Label>
                            <Input
                                id="subtitle"
                                name="subtitle"
                                value={formData.subtitle}
                                onChange={handleChange}
                                maxLength={200}
                            />
                        </div>
                        <div>
                            <Label htmlFor="image">Image URL *</Label>
                            <Input
                                id="image"
                                name="image"
                                value={formData.image}
                                onChange={handleChange}
                                placeholder="https://example.com/image.jpg"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="link">Link URL</Label>
                            <Input
                                id="link"
                                name="link"
                                value={formData.link}
                                onChange={handleChange}
                                placeholder="https://example.com"
                            />
                        </div>
                        <div>
                            <Label htmlFor="linkText">Link Text</Label>
                            <Input
                                id="linkText"
                                name="linkText"
                                value={formData.linkText}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="displayOrder">Display Order</Label>
                                <Input
                                    id="displayOrder"
                                    name="displayOrder"
                                    type="number"
                                    value={formData.displayOrder}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <Label htmlFor="targetAudience">Target Audience</Label>
                                <select
                                    id="targetAudience"
                                    name="targetAudience"
                                    value={formData.targetAudience}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value="all">All Users</option>
                                    <option value="job-seekers">Job Seekers</option>
                                    <option value="recruiters">Recruiters</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    name="startDate"
                                    type="datetime-local"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    name="endDate"
                                    type="datetime-local"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="backgroundColor">Background Color</Label>
                                <Input
                                    id="backgroundColor"
                                    name="backgroundColor"
                                    type="color"
                                    value={formData.backgroundColor}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <Label htmlFor="textColor">Text Color</Label>
                                <Input
                                    id="textColor"
                                    name="textColor"
                                    type="color"
                                    value={formData.textColor}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingBanner ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BannerManagement;
