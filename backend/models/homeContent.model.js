import mongoose from "mongoose";

const homeContentSchema = new mongoose.Schema({
    // Hero Section
    hero: {
        title: {
            type: String,
            default: 'Find Your Dream Job Today'
        },
        subtitle: {
            type: String,
            default: 'Connect with top employers and discover exciting career opportunities'
        },
        backgroundImage: {
            type: String,
            default: ''
        },
        ctaText: {
            type: String,
            default: 'Get Started'
        },
        ctaLink: {
            type: String,
            default: '/jobs'
        },
        showSearchBar: {
            type: Boolean,
            default: true
        }
    },

    // Features Section
    features: [{
        icon: {
            type: String,
            default: 'briefcase'
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        order: {
            type: Number,
            default: 0
        }
    }],

    // Statistics Section
    statistics: {
        enabled: {
            type: Boolean,
            default: true
        },
        stats: [{
            label: {
                type: String,
                required: true
            },
            value: {
                type: String,
                required: true
            },
            suffix: {
                type: String,
                default: '+'
            },
            order: {
                type: Number,
                default: 0
            }
        }]
    },

    // Testimonials Section
    testimonials: {
        enabled: {
            type: Boolean,
            default: true
        },
        title: {
            type: String,
            default: 'What Our Users Say'
        },
        items: [{
            name: {
                type: String,
                required: true
            },
            role: {
                type: String,
                required: true
            },
            company: {
                type: String
            },
            avatar: {
                type: String
            },
            content: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                min: 1,
                max: 5,
                default: 5
            },
            order: {
                type: Number,
                default: 0
            }
        }]
    },

    // CTA Blocks
    ctaBlocks: [{
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        buttonText: {
            type: String,
            required: true
        },
        buttonLink: {
            type: String,
            required: true
        },
        backgroundColor: {
            type: String,
            default: '#F83002'
        },
        textColor: {
            type: String,
            default: '#ffffff'
        },
        image: {
            type: String
        },
        order: {
            type: Number,
            default: 0
        }
    }],

    // How It Works Section
    howItWorks: {
        enabled: {
            type: Boolean,
            default: true
        },
        title: {
            type: String,
            default: 'How It Works'
        },
        steps: [{
            stepNumber: {
                type: Number,
                required: true
            },
            title: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: true
            },
            icon: {
                type: String,
                default: 'circle'
            }
        }]
    },

    // Meta Information
    isActive: {
        type: Boolean,
        default: true
    },
    version: {
        type: Number,
        default: 1
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Ensure only one active content at a time
homeContentSchema.pre('save', async function(next) {
    if (this.isActive) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { $set: { isActive: false } }
        );
    }
    next();
});

// Static method to get active content
homeContentSchema.statics.getActiveContent = function() {
    return this.findOne({ isActive: true })
        .populate('lastModifiedBy', 'fullname email');
};

export const HomeContent = mongoose.model("HomeContent", homeContentSchema);
