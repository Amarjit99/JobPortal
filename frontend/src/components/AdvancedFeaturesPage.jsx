import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './shared/Navbar';
import Footer from './shared/Footer';
import { Sparkles, MessageSquare, TrendingUp, Shield, Award, Briefcase } from 'lucide-react';

const AdvancedFeaturesPage = () => {
  const features = [
    {
      icon: Sparkles,
      title: 'AI Job Matching',
      description: 'Get personalized job recommendations powered by AI',
      link: '/ai-recommendations',
      color: 'text-[#F83002]'
    },
    {
      icon: MessageSquare,
      title: 'Real-time Messaging',
      description: 'Connect with recruiters instantly via WebSocket chat',
      link: '/messages',
      color: 'text-[#F83002]'
    },
    {
      icon: TrendingUp,
      title: 'Career Development',
      description: 'Access courses, assessments, and mentorship programs',
      link: '/career-development',
      color: 'text-[#F83002]'
    },
    {
      icon: Shield,
      title: 'Two-Factor Auth',
      description: 'Secure your account with 2FA protection',
      link: '/2fa/setup',
      color: 'text-[#F83002]'
    },
    {
      icon: Award,
      title: 'NLP Analysis',
      description: 'Smart resume parsing and keyword extraction',
      link: '/nlp-tools',
      color: 'text-[#F83002]'
    },
    {
      icon: Briefcase,
      title: 'Premium Plans',
      description: 'Unlock advanced features for recruiters',
      link: '/pricing',
      color: 'text-[#F83002]'
    }
  ];

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Advanced Features</h1>
          <p className="text-gray-600 text-lg">
            Discover our cutting-edge features designed to enhance your job search and recruitment experience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link 
              key={index}
              to={feature.link} 
              className="p-6 border rounded-lg hover:shadow-lg transition-all hover:scale-105"
            >
              <feature.icon className={`w-12 h-12 mb-4 ${feature.color}`} />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdvancedFeaturesPage;
