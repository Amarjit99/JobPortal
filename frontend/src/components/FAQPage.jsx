import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Search, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';

const FAQPage = () => {
    const [faqs, setFaqs] = useState([]);
    const [filteredFaqs, setFilteredFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [expandedFaq, setExpandedFaq] = useState(null);

    const categories = [
        { value: 'all', label: 'All' },
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
    }, []);

    useEffect(() => {
        filterFAQs();
    }, [faqs, searchQuery, selectedCategory]);

    const fetchFAQs = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:8000/api/v1/faqs/public');
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

    const filterFAQs = () => {
        let filtered = [...faqs];

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(faq => faq.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(faq => 
                faq.question.toLowerCase().includes(query) ||
                faq.answer.toLowerCase().includes(query)
            );
        }

        setFilteredFaqs(filtered);
    };

    const handleToggleFaq = async (faqId) => {
        if (expandedFaq !== faqId) {
            // Record view when expanding
            try {
                await axios.post(`http://localhost:8000/api/v1/faqs/${faqId}/view`);
            } catch (error) {
                console.error('Failed to record view:', error);
            }
        }
        setExpandedFaq(expandedFaq === faqId ? null : faqId);
    };

    const handleFeedback = async (faqId, helpful) => {
        try {
            const res = await axios.post(`http://localhost:8000/api/v1/faqs/${faqId}/feedback`, {
                helpful
            });
            if (res.data.success) {
                toast.success('Thank you for your feedback!');
            }
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            toast.error('Failed to submit feedback');
        }
    };

    // Group FAQs by category for display
    const groupedFaqs = {};
    filteredFaqs.forEach(faq => {
        if (!groupedFaqs[faq.category]) {
            groupedFaqs[faq.category] = [];
        }
        groupedFaqs[faq.category].push(faq);
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
                    <p className="text-xl text-gray-600">
                        Find answers to common questions about our job portal
                    </p>
                </div>

                {/* Search */}
                <div className="mb-8">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search FAQs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 py-6 text-lg"
                        />
                    </div>
                </div>

                {/* Category Filter */}
                <div className="mb-8 flex gap-2 flex-wrap justify-center">
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

                {/* FAQs */}
                {selectedCategory === 'all' ? (
                    // Display by categories
                    <div className="space-y-8">
                        {Object.keys(groupedFaqs).map(category => (
                            <div key={category}>
                                <h2 className="text-2xl font-bold mb-4 capitalize flex items-center gap-2">
                                    {categories.find(c => c.value === category)?.label || category}
                                    <Badge variant="outline">{groupedFaqs[category].length}</Badge>
                                </h2>
                                <div className="space-y-3">
                                    {groupedFaqs[category].map(faq => (
                                        <FAQItem
                                            key={faq._id}
                                            faq={faq}
                                            isExpanded={expandedFaq === faq._id}
                                            onToggle={() => handleToggleFaq(faq._id)}
                                            onFeedback={handleFeedback}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Display flat list for filtered category
                    <div className="space-y-3">
                        {filteredFaqs.map(faq => (
                            <FAQItem
                                key={faq._id}
                                faq={faq}
                                isExpanded={expandedFaq === faq._id}
                                onToggle={() => handleToggleFaq(faq._id)}
                                onFeedback={handleFeedback}
                            />
                        ))}
                    </div>
                )}

                {filteredFaqs.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-xl text-gray-500">
                            {searchQuery 
                                ? `No FAQs found matching "${searchQuery}"`
                                : 'No FAQs available in this category'
                            }
                        </p>
                    </div>
                )}

                {/* Contact Section */}
                <div className="mt-16 text-center bg-white p-8 rounded-lg shadow-md">
                    <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
                    <p className="text-gray-600 mb-6">
                        Can't find the answer you're looking for? Please contact our support team.
                    </p>
                    <Button size="lg">
                        Contact Support
                    </Button>
                </div>
            </div>
        </div>
    );
};

// FAQ Item Component with Accordion
const FAQItem = ({ faq, isExpanded, onToggle, onFeedback }) => {
    const [feedbackGiven, setFeedbackGiven] = useState(false);

    const handleFeedbackClick = (helpful) => {
        if (feedbackGiven) return;
        onFeedback(faq._id, helpful);
        setFeedbackGiven(true);
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
                <h3 className="text-lg font-semibold text-left pr-4">{faq.question}</h3>
                {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                )}
            </button>

            {isExpanded && (
                <div className="px-6 pb-4 border-t">
                    <p className="text-gray-700 leading-relaxed mt-4 whitespace-pre-wrap">
                        {faq.answer}
                    </p>

                    <div className="mt-6 pt-4 border-t flex items-center justify-between">
                        <span className="text-sm text-gray-600">Was this helpful?</span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFeedbackClick(true)}
                                disabled={feedbackGiven}
                                className={feedbackGiven ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                Yes
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFeedbackClick(false)}
                                disabled={feedbackGiven}
                                className={feedbackGiven ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                                <ThumbsDown className="h-4 w-4 mr-1" />
                                No
                            </Button>
                        </div>
                    </div>

                    {feedbackGiven && (
                        <p className="text-sm text-green-600 mt-2 text-center">
                            Thank you for your feedback!
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default FAQPage;
