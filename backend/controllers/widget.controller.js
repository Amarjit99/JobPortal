import { Job } from '../models/job.model.js';
import { Company } from '../models/company.model.js';
import logger from '../utils/logger.js';

export const getJobWidget = async (req, res) => {
    try {
        const { companyId, limit = 5, theme = 'light' } = req.query;

        const query = { isActive: true };
        if (companyId) query.company = companyId;

        const jobs = await Job.find(query)
            .populate('company', 'name logo')
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean();

        const widgetHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        .job-widget { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'}; color: ${theme === 'dark' ? '#ffffff' : '#000000'}; padding: 20px; border-radius: 8px; }
        .job-item { border-bottom: 1px solid #ccc; padding: 15px 0; }
        .job-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .job-company { color: #666; margin-bottom: 5px; }
        .job-location { color: #999; font-size: 14px; }
        .apply-btn { background: #0066cc; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="job-widget">
        <h2>Latest Jobs</h2>
        ${jobs.map(job => `
            <div class="job-item">
                <div class="job-title">${job.title}</div>
                <div class="job-company">${job.company?.name || 'Unknown'}</div>
                <div class="job-location">${job.location} • ${job.jobType}</div>
                <a href="/jobs/${job._id}" class="apply-btn">Apply Now</a>
            </div>
        `).join('')}
    </div>
</body>
</html>`;

        return res.status(200).send(widgetHTML);
    } catch (error) {
        logger.error('Error in getJobWidget:', error);
        return res.status(500).send('<p>Error loading widget</p>');
    }
};

export const getEmbedCode = async (req, res) => {
    try {
        const { companyId, limit = 5, theme = 'light' } = req.query;
        const widgetUrl = `${req.protocol}://${req.get('host')}/api/v1/widgets/jobs?companyId=${companyId || ''}&limit=${limit}&theme=${theme}`;

        const embedCode = `<iframe src="${widgetUrl}" width="100%" height="600" frameborder="0" scrolling="auto"></iframe>`;

        return res.status(200).json({
            message: 'Embed code generated',
            embedCode,
            widgetUrl,
            success: true
        });
    } catch (error) {
        logger.error('Error in getEmbedCode:', error);
        return res.status(500).json({ message: 'Failed to generate embed code', success: false });
    }
};
