import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    // General Settings
    siteName: {
        type: String,
        required: true,
        default: "JobPortal"
    },
    logo: {
        type: String,
        default: "/logo.png"
    },
    favicon: {
        type: String,
        default: "/favicon.ico"
    },
    contactEmail: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    contactPhone: {
        type: String
    },
    address: {
        type: String
    },

    // Social Links
    socialLinks: {
        facebook: { type: String, default: "" },
        twitter: { type: String, default: "" },
        linkedin: { type: String, default: "" },
        instagram: { type: String, default: "" },
        youtube: { type: String, default: "" },
        github: { type: String, default: "" }
    },

    // SEO Meta
    seoMeta: {
        title: {
            type: String,
            default: "JobPortal - Find Your Dream Job"
        },
        description: {
            type: String,
            default: "Search and apply for thousands of job opportunities. Connect with top employers."
        },
        keywords: {
            type: [String],
            default: ["jobs", "careers", "employment", "hiring", "recruitment"]
        },
        ogImage: {
            type: String,
            default: "/og-image.png"
        }
    },

    // Feature Toggles
    features: {
        registrationEnabled: {
            type: Boolean,
            default: true
        },
        jobPostingEnabled: {
            type: Boolean,
            default: true
        },
        maintenanceMode: {
            type: Boolean,
            default: false
        },
        maintenanceMessage: {
            type: String,
            default: "Site is under maintenance. We'll be back soon!"
        },
        enableEmailVerification: {
            type: Boolean,
            default: true
        },
        enableTwoFactorAuth: {
            type: Boolean,
            default: true
        },
        enableJobAlerts: {
            type: Boolean,
            default: true
        }
    },

    // Advanced Settings
    advanced: {
        maxFileSize: {
            type: Number,
            default: 5, // in MB
            min: 1,
            max: 50
        },
        allowedFileTypes: {
            type: [String],
            default: [".pdf", ".doc", ".docx"]
        },
        sessionTimeout: {
            type: Number,
            default: 30, // in minutes
            min: 5,
            max: 1440
        },
        passwordMinLength: {
            type: Number,
            default: 8,
            min: 6,
            max: 32
        },
        passwordRequireSpecialChar: {
            type: Boolean,
            default: true
        },
        passwordRequireNumber: {
            type: Boolean,
            default: true
        },
        passwordRequireUppercase: {
            type: Boolean,
            default: true
        }
    },

    // Application Settings
    application: {
        jobsPerPage: {
            type: Number,
            default: 12,
            min: 6,
            max: 50
        },
        companiesPerPage: {
            type: Number,
            default: 10,
            min: 5,
            max: 50
        },
        maxApplicationsPerDay: {
            type: Number,
            default: 10,
            min: 1,
            max: 100
        },
        allowMultipleApplications: {
            type: Boolean,
            default: false
        }
    },

    // Email Settings
    email: {
        fromName: {
            type: String,
            default: "JobPortal"
        },
        fromEmail: {
            type: String
        },
        replyToEmail: {
            type: String
        }
    },

    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

export const Settings = mongoose.model("Settings", settingsSchema);
