import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Copy, Eye, Code, Palette } from 'lucide-react';

const WidgetConfigurator = () => {
    const [companyId, setCompanyId] = useState('');
    const [limit, setLimit] = useState('5');
    const [theme, setTheme] = useState('light');
    const [embedCode, setEmbedCode] = useState('');

    const generateEmbedCode = () => {
        const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const widgetUrl = `${baseUrl}/api/v1/widgets/jobs?companyId=${companyId}&limit=${limit}&theme=${theme}`;
        const code = `<iframe src="${widgetUrl}" width="100%" height="600" frameborder="0" scrolling="auto"></iframe>`;
        setEmbedCode(code);
        toast.success('Embed code generated!');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(embedCode);
        toast.success('Copied to clipboard!');
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <Code className="w-8 h-8" />
                    Widget Configurator
                </h1>
                <p className="text-gray-600">Create embeddable job widgets for your website</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="w-5 h-5" />
                                Widget Settings
                            </CardTitle>
                            <CardDescription>Customize your job widget</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Company ID (Optional)</label>
                                <Input
                                    placeholder="Leave empty for all companies"
                                    value={companyId}
                                    onChange={(e) => setCompanyId(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Number of Jobs</label>
                                <Select value={limit} onValueChange={setLimit}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="3">3 jobs</SelectItem>
                                        <SelectItem value="5">5 jobs</SelectItem>
                                        <SelectItem value="10">10 jobs</SelectItem>
                                        <SelectItem value="15">15 jobs</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Theme</label>
                                <Select value={theme} onValueChange={setTheme}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">Light</SelectItem>
                                        <SelectItem value="dark">Dark</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={generateEmbedCode} className="w-full">
                                Generate Embed Code
                            </Button>

                            {embedCode && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium mb-2">Embed Code</label>
                                    <div className="relative">
                                        <textarea
                                            readOnly
                                            value={embedCode}
                                            className="w-full p-3 border rounded bg-gray-50 text-sm font-mono"
                                            rows={4}
                                        />
                                        <Button
                                            size="sm"
                                            className="absolute top-2 right-2"
                                            onClick={copyToClipboard}
                                        >
                                            <Copy className="w-4 h-4 mr-1" />
                                            Copy
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="text-sm">How to Use</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div>1. Configure your widget settings above</div>
                            <div>2. Click "Generate Embed Code"</div>
                            <div>3. Copy the generated code</div>
                            <div>4. Paste it into your website's HTML</div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="w-5 h-5" />
                                Live Preview
                            </CardTitle>
                            <CardDescription>See how your widget will look</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {embedCode ? (
                                <div className="border rounded-lg overflow-hidden">
                                    <iframe
                                        srcDoc={embedCode.match(/src="([^"]+)"/)?.[1] ? 
                                            `<iframe src="${embedCode.match(/src="([^"]+)"/)[1]}" width="100%" height="600" frameborder="0"></iframe>` : 
                                            '<p>Generate embed code to see preview</p>'
                                        }
                                        width="100%"
                                        height="600"
                                        frameBorder="0"
                                        title="Widget Preview"
                                    />
                                </div>
                            ) : (
                                <div className="border-2 border-dashed rounded-lg p-12 text-center text-gray-500">
                                    <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Configure settings and generate code to see preview</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default WidgetConfigurator;
