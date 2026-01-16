import mongoose from "mongoose";

const employerPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['Free', 'Basic', 'Premium', 'Enterprise']
    },
    displayName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        monthly: {
            type: Number,
            required: true,
            default: 0
        },
        annual: {
            type: Number,
            required: true,
            default: 0
        }
    },
    currency: {
        type: String,
        default: 'USD'
    },
    features: [{
        name: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        included: {
            type: Boolean,
            default: true
        }
    }],
    limits: {
        jobPostings: {
            type: Number,
            default: 0 // 0 means unlimited
        },
        featuredJobs: {
            type: Number,
            default: 0
        },
        resumeCredits: {
            type: Number,
            default: 0
        },
        applicantTracking: {
            type: Boolean,
            default: false
        },
        analytics: {
            type: Boolean,
            default: false
        },
        prioritySupport: {
            type: Boolean,
            default: false
        },
        customBranding: {
            type: Boolean,
            default: false
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    isPopular: {
        type: Boolean,
        default: false
    },
    stripePriceId: {
        monthly: String,
        annual: String
    },
    razorpayPlanId: {
        monthly: String,
        annual: String
    }
}, { timestamps: true });

// Static method to get all active plans
employerPlanSchema.statics.getActivePlans = function() {
    return this.find({ isActive: true }).sort({ order: 1 });
};

// Static method to initialize default plans
employerPlanSchema.statics.initializeDefaultPlans = async function() {
    const defaultPlans = [
        {
            name: 'Free',
            displayName: 'Free Plan',
            description: 'Perfect for startups and small businesses',
            price: { monthly: 0, annual: 0 },
            features: [
                { name: 'Job Postings', description: 'Post up to 5 jobs', included: true },
                { name: 'Basic Analytics', description: 'View application metrics', included: true },
                { name: 'Email Support', description: 'Response within 48 hours', included: true },
                { name: 'Featured Jobs', description: 'Highlight your listings', included: false },
                { name: 'Resume Credits', description: 'Unlock candidate resumes', included: false },
                { name: 'Priority Support', description: '24/7 dedicated support', included: false }
            ],
            limits: {
                jobPostings: 5,
                featuredJobs: 0,
                resumeCredits: 0,
                applicantTracking: true,
                analytics: false,
                prioritySupport: false,
                customBranding: false
            },
            order: 1,
            isPopular: false
        },
        {
            name: 'Basic',
            displayName: 'Basic Plan',
            description: 'For growing companies hiring regularly',
            price: { monthly: 49, annual: 490 }, // 2 months free on annual
            features: [
                { name: 'Job Postings', description: 'Post up to 20 jobs', included: true },
                { name: 'Featured Jobs', description: '10 featured job slots', included: true },
                { name: 'Resume Credits', description: '25 resume unlocks per month', included: true },
                { name: 'Advanced Analytics', description: 'Detailed hiring insights', included: true },
                { name: 'Email & Chat Support', description: 'Response within 24 hours', included: true },
                { name: 'Priority Support', description: '24/7 dedicated support', included: false }
            ],
            limits: {
                jobPostings: 20,
                featuredJobs: 10,
                resumeCredits: 25,
                applicantTracking: true,
                analytics: true,
                prioritySupport: false,
                customBranding: false
            },
            order: 2,
            isPopular: true
        },
        {
            name: 'Premium',
            displayName: 'Premium Plan',
            description: 'For enterprises with high-volume hiring',
            price: { monthly: 149, annual: 1490 },
            features: [
                { name: 'Unlimited Job Postings', description: 'Post as many jobs as you need', included: true },
                { name: 'Unlimited Featured Jobs', description: 'Feature all your listings', included: true },
                { name: 'Resume Credits', description: '100 resume unlocks per month', included: true },
                { name: 'Advanced Analytics', description: 'Full hiring dashboard', included: true },
                { name: 'Priority Support', description: '24/7 phone & chat support', included: true },
                { name: 'Custom Branding', description: 'Your logo on job pages', included: true }
            ],
            limits: {
                jobPostings: 0, // unlimited
                featuredJobs: 0, // unlimited
                resumeCredits: 100,
                applicantTracking: true,
                analytics: true,
                prioritySupport: true,
                customBranding: true
            },
            order: 3,
            isPopular: false
        },
        {
            name: 'Enterprise',
            displayName: 'Enterprise Plan',
            description: 'Custom solutions for large organizations',
            price: { monthly: 0, annual: 0 }, // Contact for pricing
            features: [
                { name: 'Everything in Premium', description: 'All premium features included', included: true },
                { name: 'Dedicated Account Manager', description: 'Personal hiring consultant', included: true },
                { name: 'API Access', description: 'Integrate with your ATS', included: true },
                { name: 'Custom Integrations', description: 'Connect your tools', included: true },
                { name: 'White-label Solution', description: 'Fully branded platform', included: true },
                { name: 'SLA Guarantee', description: '99.9% uptime guarantee', included: true }
            ],
            limits: {
                jobPostings: 0,
                featuredJobs: 0,
                resumeCredits: 0, // unlimited
                applicantTracking: true,
                analytics: true,
                prioritySupport: true,
                customBranding: true
            },
            order: 4,
            isPopular: false
        }
    ];

    for (const planData of defaultPlans) {
        const exists = await this.findOne({ name: planData.name });
        if (!exists) {
            await this.create(planData);
            console.log(`Default plan created: ${planData.name}`);
        }
    }
};

export const EmployerPlan = mongoose.model("EmployerPlan", employerPlanSchema);
