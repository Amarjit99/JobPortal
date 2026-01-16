import React, { useState, useEffect } from 'react';
import axios from '@/utils/axios';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Loader2, Plus, Save, Eye, Copy, Trash2, CheckCircle2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const HomeContentEditor = () => {
    const [contents, setContents] = useState([]);
    const [activeContent, setActiveContent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    
    const [formData, setFormData] = useState({
        hero: {
            title: 'Find Your Dream Job Today',
            subtitle: 'Connect with top employers and discover exciting career opportunities',
            backgroundImage: '',
            ctaText: 'Get Started',
            ctaLink: '/jobs',
            showSearchBar: true
        },
        features: [],
        statistics: {
            enabled: true,
            stats: []
        },
        testimonials: {
            enabled: true,
            title: 'What Our Users Say',
            items: []
        },
        ctaBlocks: [],
        howItWorks: {
            enabled: true,
            title: 'How It Works',
            steps: []
        }
    });

    useEffect(() => {
        fetchAllContent();
    }, []);

    const fetchAllContent = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:8000/api/v1/home-content/all');
            if (res.data.success) {
                setContents(res.data.contents);
                const active = res.data.contents.find(c => c.isActive);
                if (active) {
                    setActiveContent(active);
                    setFormData(active);
                }
            }
        } catch (error) {
            toast.error('Failed to fetch content');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const url = activeContent
                ? `http://localhost:8000/api/v1/home-content/${activeContent._id}`
                : 'http://localhost:8000/api/v1/home-content/create';
            
            const method = activeContent ? 'put' : 'post';
            const res = await axios[method](url, formData);

            if (res.data.success) {
                toast.success('Content saved successfully');
                fetchAllContent();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Save failed');
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (id) => {
        try {
            const res = await axios.patch(`http://localhost:8000/api/v1/home-content/${id}/activate`);
            if (res.data.success) {
                toast.success('Content activated');
                fetchAllContent();
            }
        } catch (error) {
            toast.error('Failed to activate content');
        }
    };

    const handleDuplicate = async (id) => {
        try {
            const res = await axios.post(`http://localhost:8000/api/v1/home-content/${id}/duplicate`);
            if (res.data.success) {
                toast.success('Content duplicated');
                fetchAllContent();
            }
        } catch (error) {
            toast.error('Failed to duplicate content');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this content version?')) return;
        try {
            const res = await axios.delete(`http://localhost:8000/api/v1/home-content/${id}`);
            if (res.data.success) {
                toast.success('Content deleted');
                fetchAllContent();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Delete failed');
        }
    };

    const addFeature = () => {
        setFormData({
            ...formData,
            features: [...formData.features, { icon: 'briefcase', title: '', description: '', order: formData.features.length }]
        });
    };

    const removeFeature = (index) => {
        setFormData({
            ...formData,
            features: formData.features.filter((_, i) => i !== index)
        });
    };

    const updateFeature = (index, field, value) => {
        const newFeatures = [...formData.features];
        newFeatures[index][field] = value;
        setFormData({ ...formData, features: newFeatures });
    };

    const addStat = () => {
        setFormData({
            ...formData,
            statistics: {
                ...formData.statistics,
                stats: [...formData.statistics.stats, { label: '', value: '', suffix: '+', order: formData.statistics.stats.length }]
            }
        });
    };

    const removeStat = (index) => {
        setFormData({
            ...formData,
            statistics: {
                ...formData.statistics,
                stats: formData.statistics.stats.filter((_, i) => i !== index)
            }
        });
    };

    const updateStat = (index, field, value) => {
        const newStats = [...formData.statistics.stats];
        newStats[index][field] = value;
        setFormData({ ...formData, statistics: { ...formData.statistics, stats: newStats } });
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Homepage Content Editor</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
                        <Eye className="mr-2 h-4 w-4" /> {previewMode ? 'Edit' : 'Preview'}
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save
                    </Button>
                </div>
            </div>

            {/* Content Versions */}
            <div className="mb-6 p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">Content Versions</h3>
                <div className="grid gap-2">
                    {contents.map((content) => (
                        <div key={content._id} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-3">
                                {content.isActive && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                                <div>
                                    <div className="font-medium">Version {content.version}</div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(content.updatedAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => { setFormData(content); setActiveContent(content); }}>
                                    Edit
                                </Button>
                                {!content.isActive && (
                                    <>
                                        <Button size="sm" variant="outline" onClick={() => handleActivate(content._id)}>
                                            Activate
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleDuplicate(content._id)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(content._id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Tabs defaultValue="hero" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="hero">Hero</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="statistics">Statistics</TabsTrigger>
                    <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
                    <TabsTrigger value="cta">CTA Blocks</TabsTrigger>
                </TabsList>

                <TabsContent value="hero" className="space-y-4">
                    <div>
                        <Label>Title</Label>
                        <Input
                            value={formData.hero.title}
                            onChange={(e) => setFormData({ ...formData, hero: { ...formData.hero, title: e.target.value } })}
                        />
                    </div>
                    <div>
                        <Label>Subtitle</Label>
                        <Input
                            value={formData.hero.subtitle}
                            onChange={(e) => setFormData({ ...formData, hero: { ...formData.hero, subtitle: e.target.value } })}
                        />
                    </div>
                    <div>
                        <Label>Background Image URL</Label>
                        <Input
                            value={formData.hero.backgroundImage}
                            onChange={(e) => setFormData({ ...formData, hero: { ...formData.hero, backgroundImage: e.target.value } })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>CTA Text</Label>
                            <Input
                                value={formData.hero.ctaText}
                                onChange={(e) => setFormData({ ...formData, hero: { ...formData.hero, ctaText: e.target.value } })}
                            />
                        </div>
                        <div>
                            <Label>CTA Link</Label>
                            <Input
                                value={formData.hero.ctaLink}
                                onChange={(e) => setFormData({ ...formData, hero: { ...formData.hero, ctaLink: e.target.value } })}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.hero.showSearchBar}
                            onChange={(e) => setFormData({ ...formData, hero: { ...formData.hero, showSearchBar: e.target.checked } })}
                        />
                        <Label>Show Search Bar</Label>
                    </div>
                </TabsContent>

                <TabsContent value="features" className="space-y-4">
                    <Button onClick={addFeature}>
                        <Plus className="mr-2 h-4 w-4" /> Add Feature
                    </Button>
                    {formData.features.map((feature, index) => (
                        <div key={index} className="p-4 border rounded space-y-3">
                            <div className="flex justify-between">
                                <h4 className="font-semibold">Feature {index + 1}</h4>
                                <Button size="sm" variant="destructive" onClick={() => removeFeature(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Icon</Label>
                                    <Input
                                        value={feature.icon}
                                        onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Order</Label>
                                    <Input
                                        type="number"
                                        value={feature.order}
                                        onChange={(e) => updateFeature(index, 'order', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Title</Label>
                                <Input
                                    value={feature.title}
                                    onChange={(e) => updateFeature(index, 'title', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Input
                                    value={feature.description}
                                    onChange={(e) => updateFeature(index, 'description', e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                </TabsContent>

                <TabsContent value="statistics" className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="checkbox"
                            checked={formData.statistics.enabled}
                            onChange={(e) => setFormData({ ...formData, statistics: { ...formData.statistics, enabled: e.target.checked } })}
                        />
                        <Label>Enable Statistics Section</Label>
                    </div>
                    <Button onClick={addStat}>
                        <Plus className="mr-2 h-4 w-4" /> Add Statistic
                    </Button>
                    {formData.statistics.stats.map((stat, index) => (
                        <div key={index} className="p-4 border rounded space-y-3">
                            <div className="flex justify-between">
                                <h4 className="font-semibold">Stat {index + 1}</h4>
                                <Button size="sm" variant="destructive" onClick={() => removeStat(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label>Label</Label>
                                    <Input
                                        value={stat.label}
                                        onChange={(e) => updateStat(index, 'label', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Value</Label>
                                    <Input
                                        value={stat.value}
                                        onChange={(e) => updateStat(index, 'value', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>Suffix</Label>
                                    <Input
                                        value={stat.suffix}
                                        onChange={(e) => updateStat(index, 'suffix', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </TabsContent>

                <TabsContent value="testimonials" className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="checkbox"
                            checked={formData.testimonials.enabled}
                            onChange={(e) => setFormData({ ...formData, testimonials: { ...formData.testimonials, enabled: e.target.checked } })}
                        />
                        <Label>Enable Testimonials Section</Label>
                    </div>
                    <div>
                        <Label>Section Title</Label>
                        <Input
                            value={formData.testimonials.title}
                            onChange={(e) => setFormData({ ...formData, testimonials: { ...formData.testimonials, title: e.target.value } })}
                        />
                    </div>
                    <p className="text-sm text-gray-600">Testimonial management coming soon...</p>
                </TabsContent>

                <TabsContent value="cta" className="space-y-4">
                    <p className="text-sm text-gray-600">CTA Blocks management coming soon...</p>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default HomeContentEditor;
