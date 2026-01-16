import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

// Verify payment signature
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
    
    return expectedSignature === signature;
};

// Verify webhook signature
export const verifyWebhookSignature = (payload, signature) => {
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret')
        .update(JSON.stringify(payload))
        .digest('hex');
    
    return expectedSignature === signature;
};

// Create order
export const createRazorpayOrder = async (amount, currency = 'INR', receipt) => {
    try {
        const options = {
            amount: amount * 100, // amount in smallest currency unit (paise)
            currency,
            receipt,
            payment_capture: 1 // auto capture
        };

        const order = await razorpay.orders.create(options);
        return order;
    } catch (error) {
        console.error('Razorpay create order error:', error);
        throw error;
    }
};

// Fetch payment details
export const fetchPaymentDetails = async (paymentId) => {
    try {
        const payment = await razorpay.payments.fetch(paymentId);
        return payment;
    } catch (error) {
        console.error('Razorpay fetch payment error:', error);
        throw error;
    }
};

// Process refund
export const processRefund = async (paymentId, amount) => {
    try {
        const refund = await razorpay.payments.refund(paymentId, {
            amount: amount * 100 // amount in paise
        });
        return refund;
    } catch (error) {
        console.error('Razorpay refund error:', error);
        throw error;
    }
};

// Create subscription
export const createRazorpaySubscription = async (planId, customerId, totalCount) => {
    try {
        const options = {
            plan_id: planId,
            customer_notify: 1,
            total_count: totalCount
        };

        if (customerId) {
            options.customer_id = customerId;
        }

        const subscription = await razorpay.subscriptions.create(options);
        return subscription;
    } catch (error) {
        console.error('Razorpay create subscription error:', error);
        throw error;
    }
};

// Cancel subscription
export const cancelRazorpaySubscription = async (subscriptionId) => {
    try {
        const subscription = await razorpay.subscriptions.cancel(subscriptionId);
        return subscription;
    } catch (error) {
        console.error('Razorpay cancel subscription error:', error);
        throw error;
    }
};
