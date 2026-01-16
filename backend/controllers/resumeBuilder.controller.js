import { parseResume, generateSuggestions } from '../utils/resumeParser.js';
import { User } from '../models/user.model.js';
import PDFDocument from 'pdfkit';
import logger from '../utils/logger.js';

/**
 * Parse uploaded resume
 * @route POST /api/v1/resume/parse
 */
export const parseUploadedResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: 'Please upload a resume file',
                success: false
            });
        }

        const { targetRole } = req.body;
        const fileBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;

        // Parse the resume
        const parsedData = await parseResume(fileBuffer, mimeType);

        // Generate suggestions
        const suggestions = generateSuggestions(parsedData, targetRole);

        // Update user profile with parsed data (optional)
        if (req.query.autoUpdate === 'true') {
            const userId = req.id;
            const updateData = {};

            if (parsedData.skills.length > 0) {
                updateData['profile.skills'] = parsedData.skills;
            }

            // Add experience if parsed
            if (parsedData.experience.length > 0) {
                updateData['profile.experience'] = parsedData.experience.map(exp => ({
                    title: exp.title,
                    company: exp.company,
                    duration: exp.duration,
                    description: exp.description || ''
                }));
            }

            // Add education if parsed
            if (parsedData.education.length > 0) {
                updateData['profile.education'] = parsedData.education.map(edu => ({
                    degree: edu.degree,
                    field: edu.field,
                    institution: edu.institution,
                    year: edu.year
                }));
            }

            if (Object.keys(updateData).length > 0) {
                await User.findByIdAndUpdate(userId, updateData);
            }
        }

        return res.status(200).json({
            message: 'Resume parsed successfully',
            data: {
                parsed: parsedData,
                suggestions: suggestions,
                scoreBreakdown: {
                    overall: suggestions.overallScore,
                    rating: suggestions.overallScore >= 80 ? 'Excellent' :
                            suggestions.overallScore >= 60 ? 'Good' :
                            suggestions.overallScore >= 40 ? 'Fair' : 'Needs Improvement'
                }
            },
            success: true
        });

    } catch (error) {
        logger.error('Error in parseUploadedResume:', error);
        return res.status(500).json({
            message: error.message || 'Failed to parse resume',
            success: false
        });
    }
};

/**
 * Get resume templates
 * @route GET /api/v1/resume/templates
 */
export const getResumeTemplates = async (req, res) => {
    try {
        const templates = [
            {
                id: 'modern',
                name: 'Modern Professional',
                description: 'Clean and contemporary design with a focus on readability',
                thumbnail: '/templates/modern.png',
                recommended: true
            },
            {
                id: 'classic',
                name: 'Classic Traditional',
                description: 'Traditional format suitable for corporate positions',
                thumbnail: '/templates/classic.png',
                recommended: false
            },
            {
                id: 'creative',
                name: 'Creative Designer',
                description: 'Eye-catching design for creative professionals',
                thumbnail: '/templates/creative.png',
                recommended: false
            },
            {
                id: 'minimal',
                name: 'Minimal',
                description: 'Simple and elegant with minimalist aesthetics',
                thumbnail: '/templates/minimal.png',
                recommended: false
            },
            {
                id: 'technical',
                name: 'Technical',
                description: 'Optimized for developers and technical roles',
                thumbnail: '/templates/technical.png',
                recommended: true
            }
        ];

        return res.status(200).json({
            message: 'Resume templates retrieved successfully',
            templates,
            success: true
        });

    } catch (error) {
        logger.error('Error in getResumeTemplates:', error);
        return res.status(500).json({
            message: 'Failed to get templates',
            success: false
        });
    }
};

/**
 * Build resume with template
 * @route POST /api/v1/resume/build
 */
export const buildResume = async (req, res) => {
    try {
        const userId = req.id;
        const { templateId = 'modern', customData } = req.body;

        // Get user data
        const user = await User.findById(userId).select('fullname email phoneNumber profile');

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        // Merge user data with custom data
        const resumeData = {
            name: customData?.name || user.fullname,
            email: customData?.email || user.email,
            phone: customData?.phone || user.phoneNumber,
            bio: customData?.bio || user.profile?.bio || '',
            skills: customData?.skills || user.profile?.skills || [],
            experience: customData?.experience || user.profile?.experience || [],
            education: customData?.education || user.profile?.education || [],
            certifications: customData?.certifications || [],
            projects: customData?.projects || [],
            links: customData?.links || []
        };

        // Build resume structure based on template
        const resume = {
            templateId,
            data: resumeData,
            generatedAt: new Date(),
            format: 'pdf'
        };

        return res.status(200).json({
            message: 'Resume built successfully',
            resume,
            downloadUrl: `/api/v1/resume/download/${userId}?template=${templateId}`,
            success: true
        });

    } catch (error) {
        logger.error('Error in buildResume:', error);
        return res.status(500).json({
            message: 'Failed to build resume',
            success: false
        });
    }
};

/**
 * Export resume to PDF
 * @route GET /api/v1/resume/download/:userId
 */
export const downloadResumePDF = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { template = 'modern' } = req.query;

        // Verify user
        if (req.id !== userId) {
            return res.status(403).json({
                message: 'Unauthorized access',
                success: false
            });
        }

        // Get user data
        const user = await User.findById(userId).select('fullname email phoneNumber profile');

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        // Create PDF document
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=resume-${user.fullname.replace(/\s+/g, '-')}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Build PDF content based on template
        if (template === 'modern' || template === 'technical') {
            // Header with name
            doc.fontSize(28).font('Helvetica-Bold').text(user.fullname, { align: 'center' });
            doc.moveDown(0.5);

            // Contact info
            doc.fontSize(10).font('Helvetica');
            const contactInfo = [];
            if (user.email) contactInfo.push(user.email);
            if (user.phoneNumber) contactInfo.push(user.phoneNumber);
            doc.text(contactInfo.join(' | '), { align: 'center' });
            
            doc.moveDown(1);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(1);

            // Bio/Summary
            if (user.profile?.bio) {
                doc.fontSize(14).font('Helvetica-Bold').text('PROFESSIONAL SUMMARY');
                doc.moveDown(0.5);
                doc.fontSize(10).font('Helvetica').text(user.profile.bio, { align: 'justify' });
                doc.moveDown(1.5);
            }

            // Skills
            if (user.profile?.skills && user.profile.skills.length > 0) {
                doc.fontSize(14).font('Helvetica-Bold').text('SKILLS');
                doc.moveDown(0.5);
                doc.fontSize(10).font('Helvetica').text(user.profile.skills.join(' • '), { align: 'left' });
                doc.moveDown(1.5);
            }

            // Experience
            if (user.profile?.experience && user.profile.experience.length > 0) {
                doc.fontSize(14).font('Helvetica-Bold').text('WORK EXPERIENCE');
                doc.moveDown(0.5);

                user.profile.experience.forEach((exp, index) => {
                    doc.fontSize(12).font('Helvetica-Bold').text(exp.title || 'Position');
                    doc.fontSize(10).font('Helvetica-Oblique').text(
                        `${exp.company || 'Company'} | ${exp.duration || 'Duration not specified'}`
                    );
                    doc.moveDown(0.3);
                    if (exp.description) {
                        doc.fontSize(10).font('Helvetica').text(exp.description, { align: 'justify' });
                    }
                    if (index < user.profile.experience.length - 1) {
                        doc.moveDown(1);
                    }
                });
                doc.moveDown(1.5);
            }

            // Education
            if (user.profile?.education && user.profile.education.length > 0) {
                doc.fontSize(14).font('Helvetica-Bold').text('EDUCATION');
                doc.moveDown(0.5);

                user.profile.education.forEach((edu, index) => {
                    doc.fontSize(12).font('Helvetica-Bold').text(edu.degree || 'Degree');
                    const eduDetails = [];
                    if (edu.field) eduDetails.push(edu.field);
                    if (edu.institution) eduDetails.push(edu.institution);
                    if (edu.year) eduDetails.push(edu.year);
                    
                    doc.fontSize(10).font('Helvetica').text(eduDetails.join(' | '));
                    if (index < user.profile.education.length - 1) {
                        doc.moveDown(0.8);
                    }
                });
            }

        } else {
            // Classic/Simple template
            doc.fontSize(24).font('Helvetica-Bold').text(user.fullname);
            doc.fontSize(10).font('Helvetica').text(user.email);
            if (user.phoneNumber) doc.text(user.phoneNumber);
            
            doc.moveDown(2);

            if (user.profile?.skills && user.profile.skills.length > 0) {
                doc.fontSize(14).font('Helvetica-Bold').text('Skills:');
                doc.fontSize(10).font('Helvetica').text(user.profile.skills.join(', '));
                doc.moveDown(1);
            }

            if (user.profile?.experience && user.profile.experience.length > 0) {
                doc.fontSize(14).font('Helvetica-Bold').text('Experience:');
                user.profile.experience.forEach(exp => {
                    doc.fontSize(11).font('Helvetica-Bold').text(exp.title || '');
                    doc.fontSize(10).font('Helvetica').text(exp.company || '');
                    doc.fontSize(9).text(exp.duration || '');
                    doc.moveDown(0.5);
                });
            }
        }

        // Finalize PDF
        doc.end();

    } catch (error) {
        logger.error('Error in downloadResumePDF:', error);
        if (!res.headersSent) {
            return res.status(500).json({
                message: 'Failed to generate PDF',
                success: false
            });
        }
    }
};

/**
 * Get AI-powered resume improvement suggestions
 * @route POST /api/v1/resume/analyze
 */
export const analyzeResume = async (req, res) => {
    try {
        const userId = req.id;
        const { targetRole } = req.body;

        // Get user profile
        const user = await User.findById(userId).select('profile');

        if (!user || !user.profile) {
            return res.status(404).json({
                message: 'User profile not found',
                success: false
            });
        }

        // Create a mock parsed data structure from user profile
        const parsedData = {
            name: user.fullname,
            emails: [user.email],
            phones: user.phoneNumber ? [user.phoneNumber] : [],
            urls: [],
            skills: user.profile.skills || [],
            education: user.profile.education || [],
            experience: user.profile.experience || [],
            experienceYears: user.profile.experience?.length || 0,
            rawText: JSON.stringify(user.profile)
        };

        // Generate suggestions
        const suggestions = generateSuggestions(parsedData, targetRole);

        return res.status(200).json({
            message: 'Resume analysis completed',
            analysis: {
                score: suggestions.overallScore,
                rating: suggestions.overallScore >= 80 ? 'Excellent' :
                        suggestions.overallScore >= 60 ? 'Good' :
                        suggestions.overallScore >= 40 ? 'Fair' : 'Needs Improvement',
                suggestions: {
                    skills: suggestions.skillSuggestions,
                    content: suggestions.contentSuggestions,
                    format: suggestions.formatSuggestions
                },
                strengths: [],
                improvements: [
                    ...suggestions.skillSuggestions,
                    ...suggestions.contentSuggestions,
                    ...suggestions.formatSuggestions
                ]
            },
            success: true
        });

    } catch (error) {
        logger.error('Error in analyzeResume:', error);
        return res.status(500).json({
            message: 'Failed to analyze resume',
            success: false
        });
    }
};
