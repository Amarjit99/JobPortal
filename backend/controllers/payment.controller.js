import { Payment } from "../models/payment.model.js";
import { Subscription } from "../models/subscription.model.js";
import { EmployerPlan } from "../models/employerPlan.model.js";
import { Invoice } from "../models/invoice.model.js";
import { Refund } from "../models/refund.model.js";
import { createRazorpayOrder, verifyPaymentSignature, processRefund } from "../utils/razorpay.js";
import crypto from 'crypto';

// Create order
export const createOrder = async (req, res) => {
    try {
        const { planId, billingCycle } = req.body;
        const userId = req.id;

        // Get plan details
        const plan = await EmployerPlan.findById(planId);
        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }

        // Calculate amount
        const amount = billingCycle === 'annual' ? plan.price.annual : plan.price.monthly;

        if (amount === 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot create order for free plan"
            });
        }

        // Generate order ID
        const orderId = `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

        // Create Razorpay order
        const razorpayOrder = await createRazorpayOrder(amount, 'INR', orderId);

        // Create payment record
        const payment = await Payment.create({
            orderId,
            userId,
            planId,
            amount,
            currency: 'INR',
            billingCycle,
            razorpayOrderId: razorpayOrder.id,
            status: 'pending'
        });

        console.log(`Order created: ${orderId} for user ${userId}`);

        return res.status(201).json({
            success: true,
            order: {
                id: razorpayOrder.id,
                orderId: payment.orderId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                key: process.env.RAZORPAY_KEY_ID
            }
        });
    } catch (error) {
        console.error('Create order error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to create order"
        });
    }
};

// Verify payment
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.id;

        // Verify signature
        const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }

        // Find payment
        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        // Update payment status
        payment.status = 'success';
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        await payment.save();

        // Create or update subscription
        const plan = await EmployerPlan.findById(payment.planId);
        const durationMonths = payment.billingCycle === 'annual' ? 12 : 1;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);

        const subscription = await Subscription.create({
            userId,
            planId: payment.planId,
            status: 'active',
            billingCycle: payment.billingCycle,
            startDate,
            endDate,
            currentPeriodStart: startDate,
            currentPeriodEnd: endDate,
            lastPaymentId: payment._id,
            usage: {
                jobPostings: 0,
                featuredJobs: 0,
                resumeCredits: 0
            }
        });

        // Generate invoice
        const invoice = await Invoice.create({
            userId,
            paymentId: payment._id,
            items: [{
                description: `${plan.displayName} - ${payment.billingCycle} subscription`,
                quantity: 1,
                unitPrice: payment.amount,
                amount: payment.amount
            }],
            subtotal: payment.amount,
            tax: {
                rate: 18,
                amount: payment.amount * 0.18
            },
            total: payment.amount * 1.18,
            currency: payment.currency,
            status: 'paid',
            paidDate: new Date()
        });

        console.log(`Payment verified: ${razorpay_payment_id} for user ${userId}`);

        return res.status(200).json({
            success: true,
            message: "Payment successful",
            subscription,
            invoice
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        return res.status(500).json({
            success: false,
            message: "Payment verification failed"
        });
    }
};

// Get payment history
export const getPaymentHistory = async (req, res) => {
    try {
        const userId = req.id;
        const { page = 1, limit = 10, status } = req.query;

        const query = { userId };
        if (status) {
            query.status = status;
        }

        const payments = await Payment.find(query)
            .populate('planId', 'displayName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Payment.countDocuments(query);

        return res.status(200).json({
            success: true,
            payments,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        console.error('Get payment history error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Request refund
export const requestRefund = async (req, res) => {
    try {
        const { paymentId, reason, description } = req.body;
        const userId = req.id;

        // Find payment
        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        // Verify ownership
        if (payment.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        // Check if payment is refundable
        if (payment.status !== 'success') {
            return res.status(400).json({
                success: false,
                message: "Payment cannot be refunded"
            });
        }

        // Check if refund already exists
        const existingRefund = await Refund.findOne({ paymentId });
        if (existingRefund) {
            return res.status(400).json({
                success: false,
                message: "Refund request already exists"
            });
        }

        // Create refund request
        const refund = await Refund.create({
            paymentId,
            userId,
            amount: payment.amount,
            reason,
            description
        });

        console.log(`Refund requested for payment ${paymentId} by user ${userId}`);

        return res.status(201).json({
            success: true,
            message: "Refund request submitted",
            refund
        });
    } catch (error) {
        console.error('Request refund error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Process refund (admin)
export const processRefundRequest = async (req, res) => {
    try {
        const { refundId, action, adminNotes } = req.body; // action: 'approve' or 'reject'
        const adminId = req.id;

        const refund = await Refund.findById(refundId).populate('paymentId');

        if (!refund) {
            return res.status(404).json({
                success: false,
                message: "Refund request not found"
            });
        }

        if (refund.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: "Refund already processed"
            });
        }

        if (action === 'approve') {
            // Process refund through payment gateway
            const razorpayRefund = await processRefund(
                refund.paymentId.razorpayPaymentId,
                refund.amount
            );

            refund.status = 'processed';
            refund.gatewayRefundId = razorpayRefund.id;
            refund.processedBy = adminId;
            refund.processedAt = new Date();
            refund.adminNotes = adminNotes;
            await refund.save();

            // Update payment status
            await refund.paymentId.markRefunded(razorpayRefund.id, refund.amount);

            console.log(`Refund processed: ${refundId} by admin ${adminId}`);

            return res.status(200).json({
                success: true,
                message: "Refund processed successfully",
                refund
            });
        } else if (action === 'reject') {
            refund.status = 'rejected';
            refund.processedBy = adminId;
            refund.processedAt = new Date();
            refund.rejectionReason = adminNotes;
            await refund.save();

            console.log(`Refund rejected: ${refundId} by admin ${adminId}`);

            return res.status(200).json({
                success: true,
                message: "Refund request rejected",
                refund
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid action"
            });
        }
    } catch (error) {
        console.error('Process refund error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get all refund requests (admin)
export const getAllRefunds = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const query = {};
        if (status) {
            query.status = status;
        }

        const refunds = await Refund.find(query)
            .populate('userId', 'fullname email')
            .populate('paymentId')
            .populate('processedBy', 'fullname')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Refund.countDocuments(query);

        return res.status(200).json({
            success: true,
            refunds,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        console.error('Get refunds error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
