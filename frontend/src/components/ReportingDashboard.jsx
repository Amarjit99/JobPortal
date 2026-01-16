import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { FileSpreadsheet, FileText, BarChart3, Calendar } from 'lucide-react';

const ReportingDashboard = () => {
    const [reportType, setReportType] = useState('jobs');
    const [format, setFormat] = useState('json');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [templates] = useState([
        { id: 1, name: 'Monthly Jobs Report', type: 'jobs' },
        { id: 2, name: 'Application Analytics', type: 'applications' },
        { id: 3, name: 'User Growth Report', type: 'users' },
        { id: 4, name: 'Company Performance', type: 'companies' }
    ]);

    const generateReport = async () => {
        setLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/reports/generate`,
                { reportType, format, dateFrom, dateTo },
                {
                    withCredentials: true,
                    responseType: format === 'json' ? 'json' : 'blob'
                }
            );

            if (format === 'json') {
                const dataStr = JSON.stringify(response.data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = window.URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${reportType}-report.json`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                const ext = format === 'excel' ? 'xlsx' : 'pdf';
                link.setAttribute('download', `${reportType}-report.${ext}`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }

            toast.success('Report generated successfully');
        } catch (error) {
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <BarChart3 className="w-8 h-8" />
                    Reporting Dashboard
                </h1>
                <p className="text-gray-600">Generate custom reports and analytics</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Custom Report Builder</CardTitle>
                            <CardDescription>Configure and generate custom reports</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Report Type</label>
                                <Select value={reportType} onValueChange={setReportType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="jobs">Jobs</SelectItem>
                                        <SelectItem value="applications">Applications</SelectItem>
                                        <SelectItem value="users">Users</SelectItem>
                                        <SelectItem value="companies">Companies</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Export Format</label>
                                <Select value={format} onValueChange={setFormat}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="json">JSON</SelectItem>
                                        <SelectItem value="excel">Excel (XLSX)</SelectItem>
                                        <SelectItem value="pdf">PDF</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Date From</label>
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Date To</label>
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button onClick={generateReport} disabled={loading} className="w-full">
                                {loading ? 'Generating...' : 'Generate Report'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Report Templates
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {templates.map((template) => (
                                    <Card key={template.id} className="cursor-pointer hover:bg-gray-50 transition-colors"
                                          onClick={() => setReportType(template.type)}>
                                        <CardContent className="p-4">
                                            <h3 className="font-semibold text-sm">{template.name}</h3>
                                            <p className="text-xs text-gray-600 mt-1 capitalize">{template.type}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="text-sm">Export Formats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4" />
                                <span>JSON - Structured data</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <FileSpreadsheet className="w-4 h-4" />
                                <span>Excel - Spreadsheet format</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4" />
                                <span>PDF - Document format</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ReportingDashboard;
