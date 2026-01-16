import mongoose from "mongoose";

const refundSchema = new mongoose.Schema({
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        enum: [
            'duplicate-payment',
            'service-not-delivered',
            'not-as-described',
            'technical-issue',
            'change-of-mind',
            'other'
        ],
        required: true
    },
    description: String,
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'processed', 'failed'],
        default: 'pending'
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processedAt: Date,
    gatewayRefundId: String,
    rejectionReason: String,
    adminNotes: String
}, { timestamps: true });

// Index
refundSchema.index({ paymentId: 1 });
refundSchema.index({ userId: 1, status: 1 });
refundSchema.index({ status: 1, createdAt: -1 });

export const Refund = mongoose.model("Refund", refundSchema);
