import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { PAYMENT_API_END_POINT } from '../utils/constant';
import axios from 'axios';
import { toast } from 'sonner';

const Checkout = ({ plan, billingCycle }) => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handlePayment = async () => {
        try {
            setLoading(true);

            // Create order
            const orderRes = await axios.post(
                `${PAYMENT_API_END_POINT}/create-order`,
                {
                    planId: plan._id,
                    billingCycle
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );

            const orderData = orderRes.data.order;

            // Razorpay options
            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'JobPortal',
                description: `${plan.displayName} - ${billingCycle} subscription`,
                order_id: orderData.id,
                handler: async function (response) {
                    try {
                        // Verify payment
                        const verifyRes = await axios.post(
                            `${PAYMENT_API_END_POINT}/verify`,
                            {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            },
                            {
                                withCredentials: true
                            }
                        );

                        toast.success('Payment successful! Your subscription is now active.');
                        navigate('/dashboard');
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        toast.error('Payment verification failed');
                    }
                },
                prefill: {
                    name: '',
                    email: '',
                    contact: ''
                },
                theme: {
                    color: '#F83002'
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                        toast.error('Payment cancelled');
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error.response?.data?.message || 'Failed to initiate payment');
            setLoading(false);
        }
    };

    const price = billingCycle === 'annual' ? plan.price.annual : plan.price.monthly;

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Complete Your Purchase</h1>

            <div className="border rounded-lg p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-semibold">{plan.displayName}</h2>
                        <p className="text-gray-600 mt-1">{plan.description}</p>
                    </div>
                    {plan.isPopular && (
                        <Badge className="bg-[#F83002]">Popular</Badge>
                    )}
                </div>

                <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-2">Included Features:</h3>
                    <ul className="space-y-2">
                        {plan.features.filter(f => f.included).map((feature, idx) => (
                            <li key={idx} className="flex items-start">
                                <span className="text-green-500 mr-2">✓</span>
                                <span>{feature.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between mb-2">
                        <span>Billing Cycle:</span>
                        <span className="font-semibold capitalize">{billingCycle}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span>Price:</span>
                        <span className="font-semibold">₹{price}</span>
                    </div>
                    {billingCycle === 'annual' && (
                        <div className="flex justify-between text-green-600">
                            <span>You Save:</span>
                            <span className="font-semibold">
                                ₹{plan.price.monthly * 12 - plan.price.annual}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="border rounded-lg p-6 mb-6 bg-gray-50">
                <h3 className="font-semibold mb-3">Payment Details</h3>
                <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>₹{price}</span>
                </div>
            </div>

            <div className="flex gap-4">
                <Button
                    variant="outline"
                    onClick={() => navigate('/pricing')}
                    className="flex-1"
                >
                    Back
                </Button>
                <Button
                    onClick={handlePayment}
                    disabled={loading}
                    className="flex-1 bg-[#F83002] hover:bg-[#e02a02]"
                >
                    {loading ? 'Processing...' : 'Proceed to Payment'}
                </Button>
            </div>

            <p className="text-sm text-gray-500 mt-4 text-center">
                Secure payment powered by Razorpay. Your payment information is encrypted and secure.
            </p>
        </div>
    );
};

export default Checkout;
