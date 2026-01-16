import { Settings } from "../models/settings.model.js";

// Get settings (public - limited fields)
export const getPublicSettings = async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        
        // Return only public-facing settings
        const publicSettings = {
            siteName: settings.siteName,
            logo: settings.logo,
            favicon: settings.favicon,
            socialLinks: settings.socialLinks,
            seoMeta: settings.seoMeta,
            features: {
                registrationEnabled: settings.features.registrationEnabled,
                jobPostingEnabled: settings.features.jobPostingEnabled,
                maintenanceMode: settings.features.maintenanceMode,
                maintenanceMessage: settings.features.maintenanceMessage
            }
        };

        return res.status(200).json({
            success: true,
            settings: publicSettings
        });
    } catch (error) {
        console.error('Get public settings error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get all settings (admin only)
export const getAllSettings = async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        
        return res.status(200).json({
            success: true,
            settings
        });
    } catch (error) {
        console.error('Get settings error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Update settings (admin only)
export const updateSettings = async (req, res) => {
    try {
        const updates = req.body;
        const adminId = req.id;

        // Get existing settings
        let settings = await Settings.getSettings();

        // Validate email if being updated
        if (updates.contactEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updates.contactEmail)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid email format"
                });
            }
        }

        // Validate file size
        if (updates.advanced?.maxFileSize) {
            if (updates.advanced.maxFileSize < 1 || updates.advanced.maxFileSize > 50) {
                return res.status(400).json({
                    success: false,
                    message: "Max file size must be between 1 and 50 MB"
                });
            }
        }

        // Validate password settings
        if (updates.advanced?.passwordMinLength) {
            if (updates.advanced.passwordMinLength < 6 || updates.advanced.passwordMinLength > 32) {
                return res.status(400).json({
                    success: false,
                    message: "Password min length must be between 6 and 32"
                });
            }
        }

        // Deep merge nested objects
        if (updates.socialLinks) {
            settings.socialLinks = { ...settings.socialLinks, ...updates.socialLinks };
        }
        if (updates.seoMeta) {
            settings.seoMeta = { ...settings.seoMeta, ...updates.seoMeta };
        }
        if (updates.features) {
            settings.features = { ...settings.features, ...updates.features };
        }
        if (updates.advanced) {
            settings.advanced = { ...settings.advanced, ...updates.advanced };
        }
        if (updates.application) {
            settings.application = { ...settings.application, ...updates.application };
        }
        if (updates.email) {
            settings.email = { ...settings.email, ...updates.email };
        }

        // Update top-level fields
        const topLevelFields = ['siteName', 'logo', 'favicon', 'contactEmail', 'contactPhone', 'address'];
        topLevelFields.forEach(field => {
            if (updates[field] !== undefined) {
                settings[field] = updates[field];
            }
        });

        settings.lastModifiedBy = adminId;
        await settings.save();

        console.log(`Settings updated by admin ${adminId}`);

        return res.status(200).json({
            success: true,
            message: "Settings updated successfully",
            settings
        });
    } catch (error) {
        console.error('Update settings error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Reset settings to default (admin only)
export const resetSettings = async (req, res) => {
    try {
        const adminId = req.id;

        // Delete existing settings
        await Settings.deleteMany({});

        // Create new default settings
        const settings = await Settings.create({ lastModifiedBy: adminId });

        console.log(`Settings reset to defaults by admin ${adminId}`);

        return res.status(200).json({
            success: true,
            message: "Settings reset to defaults",
            settings
        });
    } catch (error) {
        console.error('Reset settings error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Test email configuration (admin only)
export const testEmailConfig = async (req, res) => {
    try {
        const { testEmail } = req.body;

        if (!testEmail) {
            return res.status(400).json({
                success: false,
                message: "Test email address is required"
            });
        }

        const settings = await Settings.getSettings();

        // TODO: Implement actual email sending logic here
        // For now, just return success
        
        console.log(`Test email would be sent to: ${testEmail}`);

        return res.status(200).json({
            success: true,
            message: "Test email sent successfully (mock)"
        });
    } catch (error) {
        console.error('Test email error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to send test email"
        });
    }
};
