import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const PricingPlans = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const navigate = useNavigate();

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:8000/api/v1/plans');
            if (res.data.success) {
                setPlans(res.data.plans);
            }
        } catch (error) {
            console.error('Failed to fetch plans:', error);
            toast.error('Failed to load pricing plans');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = (plan) => {
        // Navigate to checkout with plan details
        navigate('/checkout', {
            state: {
                plan,
                billingCycle
            }
        });
    };

    const getPrice = (plan) => {
        return billingCycle === 'monthly' ? plan.price.monthly : plan.price.annual;
    };

    const getSavingsText = (plan) => {
        if (billingCycle === 'annual' && plan.price.annual > 0) {
            const monthlyCost = plan.price.monthly * 12;
            const savings = monthlyCost - plan.price.annual;
            if (savings > 0) {
                return `Save $${savings}/year`;
            }
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Select the perfect plan for your hiring needs
                    </p>

                    {/* Billing Cycle Toggle */}
                    <div className="inline-flex items-center gap-4 p-1 bg-white rounded-lg shadow-sm">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2 rounded-md transition ${
                                billingCycle === 'monthly'
                                    ? 'bg-[#F83002] text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('annual')}
                            className={`px-6 py-2 rounded-md transition ${
                                billingCycle === 'annual'
                                    ? 'bg-[#F83002] text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            Annual
                            <Badge className="ml-2 bg-green-100 text-green-800">Save 17%</Badge>
                        </button>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid md:grid-cols-4 gap-6">
                    {plans.map((plan) => {
                        const price = getPrice(plan);
                        const savings = getSavingsText(plan);
                        
                        return (
                            <div
                                key={plan._id}
                                className={`bg-white rounded-lg shadow-lg overflow-hidden relative ${
                                    plan.isPopular ? 'border-2 border-[#F83002]' : 'border border-gray-200'
                                }`}
                            >
                                {plan.isPopular && (
                                    <div className="absolute top-0 right-0 bg-[#F83002] text-white px-4 py-1 text-sm font-semibold">
                                        Most Popular
                                    </div>
                                )}

                                <div className="p-6">
                                    {/* Plan Header */}
                                    <h3 className="text-2xl font-bold mb-2">{plan.displayName}</h3>
                                    <p className="text-gray-600 mb-6 min-h-[48px]">{plan.description}</p>

                                    {/* Pricing */}
                                    <div className="mb-6">
                                        {price === 0 ? (
                                            plan.name === 'Enterprise' ? (
                                                <div className="text-3xl font-bold">Contact Us</div>
                                            ) : (
                                                <div className="text-3xl font-bold">Free</div>
                                            )
                                        ) : (
                                            <>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-bold">${price}</span>
                                                    <span className="text-gray-600">
                                                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                                                    </span>
                                                </div>
                                                {savings && (
                                                    <div className="text-sm text-green-600 mt-1">{savings}</div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <div className="space-y-3 mb-8">
                                        {plan.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                {feature.included ? (
                                                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                ) : (
                                                    <X className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                                )}
                                                <div className={feature.included ? '' : 'text-gray-400'}>
                                                    <div className="font-medium">{feature.name}</div>
                                                    {feature.description && (
                                                        <div className="text-sm text-gray-600">
                                                            {feature.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA Button */}
                                    <Button
                                        className="w-full"
                                        variant={plan.isPopular ? 'default' : 'outline'}
                                        size="lg"
                                        onClick={() => handleSelectPlan(plan)}
                                    >
                                        {plan.name === 'Free' 
                                            ? 'Get Started'
                                            : plan.name === 'Enterprise'
                                            ? 'Contact Sales'
                                            : 'Subscribe Now'
                                        }
                                    </Button>
                                </div>

                                {/* Plan Limits Footer */}
                                <div className="bg-gray-50 px-6 py-4 text-sm text-gray-600 border-t">
                                    <div className="space-y-1">
                                        {plan.limits.jobPostings === 0 ? (
                                            <div>• Unlimited job postings</div>
                                        ) : (
                                            <div>• Up to {plan.limits.jobPostings} job postings</div>
                                        )}
                                        {plan.limits.featuredJobs > 0 && (
                                            <div>• {plan.limits.featuredJobs} featured jobs</div>
                                        )}
                                        {plan.limits.resumeCredits > 0 && (
                                            <div>• {plan.limits.resumeCredits} resume credits/mo</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ Section */}
                <div className="mt-16 text-center">
                    <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
                    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8 text-left">
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold mb-2">Can I change plans later?</h3>
                                <p className="text-gray-600">
                                    Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately with prorated billing.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                                <p className="text-gray-600">
                                    We accept all major credit cards, debit cards, and online payment methods through our secure payment gateway.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Is there a refund policy?</h3>
                                <p className="text-gray-600">
                                    Yes, we offer a 7-day money-back guarantee for all paid plans if you're not satisfied.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPlans;
