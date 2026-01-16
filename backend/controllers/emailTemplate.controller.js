import { EmailTemplate } from "../models/emailTemplate.model.js";

// Get all email templates (admin)
export const getAllTemplates = async (req, res) => {
    try {
        const { category } = req.query;
        
        const filter = {};
        if (category) {
            filter.category = category;
        }

        const templates = await EmailTemplate.find(filter)
            .populate('lastModifiedBy', 'fullname email')
            .sort({ category: 1, name: 1 });

        return res.status(200).json({
            success: true,
            templates
        });
    } catch (error) {
        console.error('Get templates error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get template by ID (admin)
export const getTemplateById = async (req, res) => {
    try {
        const template = await EmailTemplate.findById(req.params.id)
            .populate('lastModifiedBy', 'fullname email');

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found"
            });
        }

        return res.status(200).json({
            success: true,
            template
        });
    } catch (error) {
        console.error('Get template error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get template by name (internal use)
export const getTemplateByName = async (req, res) => {
    try {
        const { name } = req.params;
        
        const template = await EmailTemplate.findOne({ name, isActive: true });

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found"
            });
        }

        return res.status(200).json({
            success: true,
            template
        });
    } catch (error) {
        console.error('Get template by name error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Create template (admin)
export const createTemplate = async (req, res) => {
    try {
        const { name, subject, htmlBody, textBody, category, variables } = req.body;
        const adminId = req.id;

        // Validate required fields
        if (!name || !subject || !htmlBody || !category) {
            return res.status(400).json({
                success: false,
                message: "Name, subject, body, and category are required"
            });
        }

        // Check if template name already exists
        const existingTemplate = await EmailTemplate.findOne({ name });
        if (existingTemplate) {
            return res.status(400).json({
                success: false,
                message: "Template with this name already exists"
            });
        }

        const template = await EmailTemplate.create({
            name,
            subject,
            htmlBody,
            textBody,
            category,
            variables: variables || [],
            lastModifiedBy: adminId
        });

        console.log(`Email template created: ${name} by admin ${adminId}`);

        return res.status(201).json({
            success: true,
            message: "Template created successfully",
            template
        });
    } catch (error) {
        console.error('Create template error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Update template (admin)
export const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const adminId = req.id;

        const template = await EmailTemplate.findById(id);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found"
            });
        }

        // Prevent modifying name of default templates
        if (template.isDefault && updates.name && updates.name !== template.name) {
            return res.status(400).json({
                success: false,
                message: "Cannot change name of default template"
            });
        }

        // Check if new name already exists
        if (updates.name && updates.name !== template.name) {
            const existingTemplate = await EmailTemplate.findOne({ name: updates.name });
            if (existingTemplate) {
                return res.status(400).json({
                    success: false,
                    message: "Template with this name already exists"
                });
            }
        }

        // Update fields
        const allowedFields = ['name', 'subject', 'htmlBody', 'textBody', 'category', 'variables', 'isActive'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                template[field] = updates[field];
            }
        });

        template.lastModifiedBy = adminId;
        await template.save();

        console.log(`Email template updated: ${template.name} by admin ${adminId}`);

        return res.status(200).json({
            success: true,
            message: "Template updated successfully",
            template
        });
    } catch (error) {
        console.error('Update template error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Delete template (admin)
export const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.id;

        const template = await EmailTemplate.findById(id);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found"
            });
        }

        // Prevent deleting default templates
        if (template.isDefault) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete default template"
            });
        }

        await template.deleteOne();

        console.log(`Email template deleted: ${template.name} by admin ${adminId}`);

        return res.status(200).json({
            success: true,
            message: "Template deleted successfully"
        });
    } catch (error) {
        console.error('Delete template error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Toggle template active status (admin)
export const toggleTemplateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.id;

        const template = await EmailTemplate.findById(id);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found"
            });
        }

        template.isActive = !template.isActive;
        template.lastModifiedBy = adminId;
        await template.save();

        console.log(`Template ${template.name} status: ${template.isActive} by admin ${adminId}`);

        return res.status(200).json({
            success: true,
            message: `Template ${template.isActive ? 'activated' : 'deactivated'}`,
            template
        });
    } catch (error) {
        console.error('Toggle template error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Preview template with sample data (admin)
export const previewTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { sampleData } = req.body;

        const template = await EmailTemplate.findById(id);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found"
            });
        }

        // Render template with sample data
        const rendered = template.render(sampleData || {});

        return res.status(200).json({
            success: true,
            preview: rendered
        });
    } catch (error) {
        console.error('Preview template error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Duplicate template (admin)
export const duplicateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.id;

        const originalTemplate = await EmailTemplate.findById(id).lean();
        if (!originalTemplate) {
            return res.status(404).json({
                success: false,
                message: "Template not found"
            });
        }

        // Create new template with suffix
        const newName = `${originalTemplate.name} (Copy)`;
        
        delete originalTemplate._id;
        delete originalTemplate.createdAt;
        delete originalTemplate.updatedAt;

        const newTemplate = await EmailTemplate.create({
            ...originalTemplate,
            name: newName,
            isDefault: false,
            isActive: false,
            lastModifiedBy: adminId
        });

        console.log(`Template duplicated: ${newName} by admin ${adminId}`);

        return res.status(201).json({
            success: true,
            message: "Template duplicated successfully",
            template: newTemplate
        });
    } catch (error) {
        console.error('Duplicate template error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Initialize default templates
export const initializeDefaultTemplates = async () => {
    try {
        const defaultTemplates = [
            {
                name: "Email Verification",
                subject: "Verify Your Email - {{siteName}}",
                htmlBody: `
                    <h2>Welcome to {{siteName}}!</h2>
                    <p>Hi {{userName}},</p>
                    <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
                    <a href="{{verificationLink}}" style="display: inline-block; padding: 12px 24px; background-color: #F83002; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a>
                    <p>Or copy and paste this link in your browser:</p>
                    <p>{{verificationLink}}</p>
                    <p>This link will expire in {{expiryHours}} hours.</p>
                    <p>If you didn't create an account, please ignore this email.</p>
                `,
                textBody: "Welcome to {{siteName}}! Please verify your email by visiting: {{verificationLink}}",
                category: "verification",
                variables: [
                    { name: "siteName", description: "Name of the website", example: "JobPortal" },
                    { name: "userName", description: "User's full name", example: "John Doe" },
                    { name: "verificationLink", description: "Email verification URL", example: "https://jobportal.com/verify/..." },
                    { name: "expiryHours", description: "Hours until link expires", example: "24" }
                ],
                isDefault: true,
                isActive: true
            },
            {
                name: "Password Reset",
                subject: "Reset Your Password - {{siteName}}",
                htmlBody: `
                    <h2>Password Reset Request</h2>
                    <p>Hi {{userName}},</p>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    <a href="{{resetLink}}" style="display: inline-block; padding: 12px 24px; background-color: #F83002; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
                    <p>Or copy and paste this link in your browser:</p>
                    <p>{{resetLink}}</p>
                    <p>This link will expire in {{expiryHours}} hours.</p>
                    <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                `,
                textBody: "Password reset requested. Visit: {{resetLink}}",
                category: "password-reset",
                variables: [
                    { name: "siteName", description: "Name of the website", example: "JobPortal" },
                    { name: "userName", description: "User's full name", example: "John Doe" },
                    { name: "resetLink", description: "Password reset URL", example: "https://jobportal.com/reset/..." },
                    { name: "expiryHours", description: "Hours until link expires", example: "1" }
                ],
                isDefault: true,
                isActive: true
            },
            {
                name: "Job Alert",
                subject: "New Job Match: {{jobTitle}} - {{siteName}}",
                htmlBody: `
                    <h2>New Job Opportunity!</h2>
                    <p>Hi {{userName}},</p>
                    <p>We found a job that matches your preferences:</p>
                    <div style="border: 1px solid #ddd; padding: 16px; border-radius: 8px; margin: 16px 0;">
                        <h3>{{jobTitle}}</h3>
                        <p><strong>Company:</strong> {{companyName}}</p>
                        <p><strong>Location:</strong> {{location}}</p>
                        <p><strong>Salary:</strong> {{salary}}</p>
                        <p><strong>Type:</strong> {{jobType}}</p>
                    </div>
                    <a href="{{jobLink}}" style="display: inline-block; padding: 12px 24px; background-color: #F83002; color: white; text-decoration: none; border-radius: 4px;">View Job Details</a>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">To unsubscribe from job alerts, <a href="{{unsubscribeLink}}">click here</a>.</p>
                `,
                textBody: "New job: {{jobTitle}} at {{companyName}}. View: {{jobLink}}",
                category: "job-alert",
                variables: [
                    { name: "siteName", description: "Name of the website", example: "JobPortal" },
                    { name: "userName", description: "User's full name", example: "John Doe" },
                    { name: "jobTitle", description: "Job title", example: "Senior Developer" },
                    { name: "companyName", description: "Company name", example: "Tech Corp" },
                    { name: "location", description: "Job location", example: "New York, NY" },
                    { name: "salary", description: "Salary range", example: "$100k - $150k" },
                    { name: "jobType", description: "Job type", example: "Full-time" },
                    { name: "jobLink", description: "Link to job posting", example: "https://jobportal.com/jobs/..." },
                    { name: "unsubscribeLink", description: "Unsubscribe link", example: "https://jobportal.com/unsubscribe/..." }
                ],
                isDefault: true,
                isActive: true
            },
            {
                name: "Application Status Update",
                subject: "Application Update: {{jobTitle}} - {{siteName}}",
                htmlBody: `
                    <h2>Application Status Update</h2>
                    <p>Hi {{userName}},</p>
                    <p>Your application for <strong>{{jobTitle}}</strong> at <strong>{{companyName}}</strong> has been updated.</p>
                    <p><strong>Status:</strong> {{status}}</p>
                    <p>{{message}}</p>
                    <a href="{{applicationLink}}" style="display: inline-block; padding: 12px 24px; background-color: #F83002; color: white; text-decoration: none; border-radius: 4px;">View Application</a>
                `,
                textBody: "Application update for {{jobTitle}}: {{status}}",
                category: "application-update",
                variables: [
                    { name: "siteName", description: "Name of the website", example: "JobPortal" },
                    { name: "userName", description: "User's full name", example: "John Doe" },
                    { name: "jobTitle", description: "Job title", example: "Senior Developer" },
                    { name: "companyName", description: "Company name", example: "Tech Corp" },
                    { name: "status", description: "Application status", example: "Under Review" },
                    { name: "message", description: "Additional message", example: "Your resume looks great!" },
                    { name: "applicationLink", description: "Link to application", example: "https://jobportal.com/applications/..." }
                ],
                isDefault: true,
                isActive: true
            }
        ];

        for (const templateData of defaultTemplates) {
            const exists = await EmailTemplate.findOne({ name: templateData.name });
            if (!exists) {
                await EmailTemplate.create(templateData);
                console.log(`Default template created: ${templateData.name}`);
            }
        }
    } catch (error) {
        console.error('Initialize default templates error:', error);
    }
};
