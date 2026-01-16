import { Job } from '../models/job.model.js';
import { Application } from '../models/application.model.js';
import { User } from '../models/user.model.js';
import { Company } from '../models/company.model.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import logger from '../utils/logger.js';

export const generateCustomReport = async (req, res) => {
    try {
        const { reportType, format = 'json', dateFrom, dateTo, filters = {} } = req.body;

        let data;
        const dateFilter = {};
        if (dateFrom) dateFilter.$gte = new Date(dateFrom);
        if (dateTo) dateFilter.$lte = new Date(dateTo);

        switch (reportType) {
            case 'jobs':
                data = await Job.find({
                    ...(dateFrom || dateTo ? { createdAt: dateFilter } : {}),
                    ...filters
                }).populate('company').lean();
                break;
            case 'applications':
                data = await Application.find({
                    ...(dateFrom || dateTo ? { createdAt: dateFilter } : {}),
                    ...filters
                }).populate('applicant job').lean();
                break;
            case 'users':
                data = await User.find({
                    ...(dateFrom || dateTo ? { createdAt: dateFilter } : {}),
                    ...filters
                }).select('-password').lean();
                break;
            case 'companies':
                data = await Company.find({
                    ...(dateFrom || dateTo ? { createdAt: dateFilter } : {}),
                    ...filters
                }).lean();
                break;
            default:
                return res.status(400).json({ message: 'Invalid report type', success: false });
        }

        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(reportType);

            if (data.length > 0) {
                worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key, width: 20 }));
                data.forEach(row => worksheet.addRow(row));
            }

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.xlsx`);
            await workbook.xlsx.write(res);
            res.end();
        } else if (format === 'pdf') {
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.pdf`);
            doc.pipe(res);

            doc.fontSize(20).text(`${reportType.toUpperCase()} Report`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`);
            doc.text(`Total Records: ${data.length}`);
            doc.moveDown();

            data.slice(0, 50).forEach((item, idx) => {
                doc.text(`${idx + 1}. ${JSON.stringify(item, null, 2).substring(0, 200)}...`);
            });

            doc.end();
        } else {
            return res.status(200).json({
                message: 'Report generated',
                reportType,
                totalRecords: data.length,
                data,
                success: true
            });
        }
    } catch (error) {
        logger.error('Error in generateCustomReport:', error);
        return res.status(500).json({ message: 'Failed to generate report', success: false });
    }
};

export const getReportTemplates = async (req, res) => {
    try {
        const templates = [
            { id: 1, name: 'Monthly Jobs Report', type: 'jobs', schedule: 'monthly' },
            { id: 2, name: 'Application Analytics', type: 'applications', schedule: 'weekly' },
            { id: 3, name: 'User Growth Report', type: 'users', schedule: 'monthly' },
            { id: 4, name: 'Company Performance', type: 'companies', schedule: 'quarterly' }
        ];

        return res.status(200).json({ templates, success: true });
    } catch (error) {
        logger.error('Error in getReportTemplates:', error);
        return res.status(500).json({ message: 'Failed to get templates', success: false });
    }
};
