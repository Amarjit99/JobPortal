import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { Brain, FileText, Tag, Sparkles } from 'lucide-react';

const NLPTools = () => {
    const [text, setText] = useState('');
    const [keywords, setKeywords] = useState([]);
    const [optimization, setOptimization] = useState(null);
    const [normalizedSkills, setNormalizedSkills] = useState([]);
    const [loading, setLoading] = useState(false);

    const extractKeywords = async () => {
        if (!text.trim()) {
            toast.error('Please enter some text');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/nlp/extract-keywords`,
                { text, limit: 10 },
                { withCredentials: true }
            );
            setKeywords(response.data.keywords);
            toast.success('Keywords extracted successfully');
        } catch (error) {
            toast.error('Failed to extract keywords');
        } finally {
            setLoading(false);
        }
    };

    const optimizeDescription = async () => {
        if (!text.trim()) {
            toast.error('Please enter job description');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/nlp/optimize-description`,
                { description: text },
                { withCredentials: true }
            );
            setOptimization(response.data.analysis);
            toast.success('Description analyzed');
        } catch (error) {
            toast.error('Failed to analyze description');
        } finally {
            setLoading(false);
        }
    };

    const normalizeSkills = async () => {
        const skillsInput = text.split(',').map(s => s.trim()).filter(Boolean);
        if (skillsInput.length === 0) {
            toast.error('Please enter skills separated by commas');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/nlp/normalize-skills`,
                { skills: skillsInput },
                { withCredentials: true }
            );
            setNormalizedSkills(response.data.normalized);
            toast.success('Skills normalized');
        } catch (error) {
            toast.error('Failed to normalize skills');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">NLP Tools</h1>
                <p className="text-gray-600">AI-powered text analysis and optimization</p>
            </div>

            <Tabs defaultValue="keywords" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="keywords">
                        <Brain className="w-4 h-4 mr-2" />
                        Keywords
                    </TabsTrigger>
                    <TabsTrigger value="optimize">
                        <FileText className="w-4 h-4 mr-2" />
                        Optimize
                    </TabsTrigger>
                    <TabsTrigger value="normalize">
                        <Tag className="w-4 h-4 mr-2" />
                        Normalize Skills
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="keywords">
                    <Card>
                        <CardHeader>
                            <CardTitle>Keyword Extraction</CardTitle>
                            <CardDescription>Extract key terms from any text using TF-IDF</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="Paste your text here..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                rows={8}
                            />
                            <Button onClick={extractKeywords} disabled={loading}>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Extract Keywords
                            </Button>
                            {keywords.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="font-semibold mb-2">Extracted Keywords:</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {keywords.map((kw, idx) => (
                                            <Badge key={idx} variant="secondary">
                                                {kw.term} ({kw.score})
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="optimize">
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Description Optimizer</CardTitle>
                            <CardDescription>Analyze and improve your job descriptions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="Paste job description here..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                rows={8}
                            />
                            <Button onClick={optimizeDescription} disabled={loading}>
                                Analyze Description
                            </Button>
                            {optimization && (
                                <div className="mt-4 space-y-3">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-3 bg-gray-50 rounded">
                                            <p className="text-sm text-gray-600">Words</p>
                                            <p className="text-2xl font-bold">{optimization.wordCount}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded">
                                            <p className="text-sm text-gray-600">Score</p>
                                            <p className="text-2xl font-bold">{optimization.score}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded">
                                            <p className="text-sm text-gray-600">Rating</p>
                                            <p className="text-2xl font-bold">{optimization.rating}</p>
                                        </div>
                                    </div>
                                    {optimization.suggestions && optimization.suggestions.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Suggestions:</h3>
                                            {optimization.suggestions.map((suggestion, idx) => (
                                                <div key={idx} className="text-sm p-2 bg-yellow-50 rounded mb-2">
                                                    • {suggestion}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="normalize">
                    <Card>
                        <CardHeader>
                            <CardTitle>Skill Normalizer</CardTitle>
                            <CardDescription>Standardize skill names (e.g., js → JavaScript)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="Enter skills separated by commas (e.g., js, reactjs, node, py)"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                rows={4}
                            />
                            <Button onClick={normalizeSkills} disabled={loading}>
                                Normalize Skills
                            </Button>
                            {normalizedSkills.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="font-semibold mb-2">Normalized Skills:</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {normalizedSkills.map((skill, idx) => (
                                            <Badge key={idx}>{skill}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default NLPTools;
