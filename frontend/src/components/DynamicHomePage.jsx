import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DynamicHomePage = () => {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/v1/home-content/active');
            if (res.data.success) {
                setContent(res.data.content);
            }
        } catch (error) {
            console.error('Failed to fetch content:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!content) return null;

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section
                className="relative h-[600px] flex items-center justify-center text-center"
                style={{
                    backgroundImage: content.hero.backgroundImage
                        ? `url(${content.hero.backgroundImage})`
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative z-10 max-w-4xl mx-auto px-4">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                        {content.hero.title}
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90 mb-8">
                        {content.hero.subtitle}
                    </p>
                    {content.hero.ctaLink && (
                        <Link to={content.hero.ctaLink}>
                            <Button size="lg" className="text-lg px-8 py-6">
                                {content.hero.ctaText}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    )}
                </div>
            </section>

            {/* Features Section */}
            {content.features && content.features.length > 0 && (
                <section className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="grid md:grid-cols-3 gap-8">
                            {content.features
                                .sort((a, b) => a.order - b.order)
                                .map((feature, index) => (
                                    <div
                                        key={index}
                                        className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition"
                                    >
                                        <div className="text-4xl mb-4">{feature.icon}</div>
                                        <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                                        <p className="text-gray-600">{feature.description}</p>
                                    </div>
                                ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Statistics Section */}
            {content.statistics?.enabled && content.statistics.stats?.length > 0 && (
                <section className="py-20 bg-[#F83002] text-white">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="grid md:grid-cols-4 gap-8 text-center">
                            {content.statistics.stats
                                .sort((a, b) => a.order - b.order)
                                .map((stat, index) => (
                                    <div key={index}>
                                        <div className="text-5xl font-bold mb-2">
                                            {stat.value}{stat.suffix}
                                        </div>
                                        <div className="text-xl">{stat.label}</div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials Section */}
            {content.testimonials?.enabled && content.testimonials.items?.length > 0 && (
                <section className="py-20">
                    <div className="max-w-7xl mx-auto px-4">
                        <h2 className="text-4xl font-bold text-center mb-12">
                            {content.testimonials.title}
                        </h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {content.testimonials.items
                                .sort((a, b) => a.order - b.order)
                                .slice(0, 3)
                                .map((testimonial, index) => (
                                    <div
                                        key={index}
                                        className="bg-white p-6 rounded-lg shadow-md"
                                    >
                                        <div className="flex items-center mb-4">
                                            {testimonial.avatar && (
                                                <img
                                                    src={testimonial.avatar}
                                                    alt={testimonial.name}
                                                    className="w-12 h-12 rounded-full mr-4"
                                                />
                                            )}
                                            <div>
                                                <div className="font-semibold">{testimonial.name}</div>
                                                <div className="text-sm text-gray-600">
                                                    {testimonial.role}
                                                    {testimonial.company && ` at ${testimonial.company}`}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-gray-700 italic">"{testimonial.content}"</p>
                                        <div className="mt-4 flex">
                                            {[...Array(testimonial.rating)].map((_, i) => (
                                                <span key={i} className="text-yellow-400">★</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </section>
            )}

            {/* How It Works Section */}
            {content.howItWorks?.enabled && content.howItWorks.steps?.length > 0 && (
                <section className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4">
                        <h2 className="text-4xl font-bold text-center mb-12">
                            {content.howItWorks.title}
                        </h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {content.howItWorks.steps.map((step, index) => (
                                <div key={index} className="text-center">
                                    <div className="w-16 h-16 bg-[#F83002] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                        {step.stepNumber}
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                                    <p className="text-gray-600">{step.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default DynamicHomePage;
