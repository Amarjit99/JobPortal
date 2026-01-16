import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployerPlan'
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed', 'refunded', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'netbanking', 'upi', 'wallet', 'other'],
        default: 'card'
    },
    paymentGateway: {
        type: String,
        enum: ['razorpay', 'stripe'],
        default: 'razorpay'
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    stripePaymentIntentId: String,
    stripeSessionId: String,
    billingCycle: {
        type: String,
        enum: ['monthly', 'annual', 'one-time']
    },
    metadata: {
        type: Map,
        of: String
    },
    failureReason: String,
    refundId: String,
    refundAmount: Number,
    refundedAt: Date
}, { timestamps: true });

// Index for efficient querying
paymentSchema.index({ userId: 1, status: 1 });
// orderId already has unique index from schema definition
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ createdAt: -1 });

// Method to mark payment as successful
paymentSchema.methods.markSuccess = function(paymentId, paymentMethod) {
    this.status = 'success';
    this.razorpayPaymentId = paymentId;
    this.paymentMethod = paymentMethod;
    return this.save();
};

// Method to mark payment as failed
paymentSchema.methods.markFailed = function(reason) {
    this.status = 'failed';
    this.failureReason = reason;
    return this.save();
};

// Method to mark payment as refunded
paymentSchema.methods.markRefunded = function(refundId, amount) {
    this.status = 'refunded';
    this.refundId = refundId;
    this.refundAmount = amount;
    this.refundedAt = new Date();
    return this.save();
};

export const Payment = mongoose.model("Payment", paymentSchema);
