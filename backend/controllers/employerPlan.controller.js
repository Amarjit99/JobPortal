import { EmployerPlan } from "../models/employerPlan.model.js";
import { Subscription } from "../models/subscription.model.js";

// Get all active plans (public)
export const getAllPlans = async (req, res) => {
    try {
        const plans = await EmployerPlan.getActivePlans();

        return res.status(200).json({
            success: true,
            plans
        });
    } catch (error) {
        console.error('Get plans error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get plan by ID (public)
export const getPlanById = async (req, res) => {
    try {
        const plan = await EmployerPlan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }

        return res.status(200).json({
            success: true,
            plan
        });
    } catch (error) {
        console.error('Get plan error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Compare plans (public)
export const comparePlans = async (req, res) => {
    try {
        const { planIds } = req.query; // comma-separated plan IDs
        
        let query = { isActive: true };
        if (planIds) {
            const ids = planIds.split(',');
            query._id = { $in: ids };
        }

        const plans = await EmployerPlan.find(query).sort({ order: 1 });

        // Extract all unique features
        const allFeatures = new Set();
        plans.forEach(plan => {
            plan.features.forEach(feature => {
                allFeatures.add(feature.name);
            });
        });

        return res.status(200).json({
            success: true,
            plans,
            features: Array.from(allFeatures)
        });
    } catch (error) {
        console.error('Compare plans error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get user's current subscription
export const getCurrentSubscription = async (req, res) => {
    try {
        const userId = req.id;

        const subscription = await Subscription.getActiveSubscription(userId);

        if (!subscription) {
            return res.status(200).json({
                success: true,
                subscription: null,
                message: "No active subscription"
            });
        }

        return res.status(200).json({
            success: true,
            subscription
        });
    } catch (error) {
        console.error('Get subscription error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Check if user can perform action
export const checkUsageLimit = async (req, res) => {
    try {
        const userId = req.id;
        const { action, count = 1 } = req.body;

        const subscription = await Subscription.getActiveSubscription(userId);

        if (!subscription) {
            return res.status(403).json({
                success: false,
                message: "No active subscription found"
            });
        }

        const result = await subscription.canPerformAction(action, count);

        return res.status(200).json({
            success: result.allowed,
            ...result
        });
    } catch (error) {
        console.error('Check usage error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Create plan (admin)
export const createPlan = async (req, res) => {
    try {
        const planData = req.body;
        const adminId = req.id;

        const plan = await EmployerPlan.create(planData);

        console.log(`Plan created by admin ${adminId}: ${plan.name}`);

        return res.status(201).json({
            success: true,
            message: "Plan created successfully",
            plan
        });
    } catch (error) {
        console.error('Create plan error:', error);
        return res.status(500).json({
            success: false,
            message: error.code === 11000 ? "Plan name already exists" : "Server error"
        });
    }
};

// Update plan (admin)
export const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const adminId = req.id;

        const plan = await EmployerPlan.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }

        console.log(`Plan updated by admin ${adminId}: ${plan.name}`);

        return res.status(200).json({
            success: true,
            message: "Plan updated successfully",
            plan
        });
    } catch (error) {
        console.error('Update plan error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Delete plan (admin)
export const deletePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.id;

        // Check if any active subscriptions use this plan
        const activeSubscriptions = await Subscription.countDocuments({
            planId: id,
            status: 'active'
        });

        if (activeSubscriptions > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete plan with ${activeSubscriptions} active subscriptions`
            });
        }

        const plan = await EmployerPlan.findByIdAndDelete(id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }

        console.log(`Plan deleted by admin ${adminId}: ${plan.name}`);

        return res.status(200).json({
            success: true,
            message: "Plan deleted successfully"
        });
    } catch (error) {
        console.error('Delete plan error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Toggle plan status (admin)
export const togglePlanStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.id;

        const plan = await EmployerPlan.findById(id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }

        plan.isActive = !plan.isActive;
        await plan.save();

        console.log(`Plan ${plan.isActive ? 'activated' : 'deactivated'} by admin ${adminId}: ${plan.name}`);

        return res.status(200).json({
            success: true,
            message: `Plan ${plan.isActive ? 'activated' : 'deactivated'}`,
            plan
        });
    } catch (error) {
        console.error('Toggle plan error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
