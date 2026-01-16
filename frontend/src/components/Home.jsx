import React, { useEffect, useState } from 'react'
import Navbar from './shared/Navbar'
import HeroSection from './HeroSection'
import CategoryCarousel from './CategoryCarousel'
import LatestJobs from './LatestJobs'
import FeaturedJobs from './FeaturedJobs'
import BannerCarousel from './BannerCarousel'
import Footer from './shared/Footer'
import useGetAllJobs from '@/hooks/useGetAllJobs'
import { useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from './ui/button'
import { Sparkles, MessageSquare, TrendingUp, Shield, Award, Briefcase } from 'lucide-react'

const Home = () => {
  useGetAllJobs();
  const { user } = useSelector(store => store.auth);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate("/admin/dashboard");
    } else if (user?.role === 'recruiter') {
      navigate("/admin/companies");
    }
  }, [user, navigate]);

  return (
    <div>
      <Navbar />
      <BannerCarousel />
      <HeroSection />
      <CategoryCarousel />
      <FeaturedJobs />
      <LatestJobs />
      
      {/* Phase 5 Features Showcase */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Advanced Features</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link to="/ai-recommendations" className="p-6 border rounded-lg hover:shadow-lg transition">
            <Sparkles className="w-12 h-12 mb-4 text-[#F83002]" />
            <h3 className="text-xl font-semibold mb-2">AI Job Matching</h3>
            <p className="text-gray-600">Get personalized job recommendations powered by AI</p>
          </Link>
          
          <Link to="/messages" className="p-6 border rounded-lg hover:shadow-lg transition">
            <MessageSquare className="w-12 h-12 mb-4 text-[#F83002]" />
            <h3 className="text-xl font-semibold mb-2">Real-time Messaging</h3>
            <p className="text-gray-600">Connect with recruiters instantly via WebSocket chat</p>
          </Link>
          
          <Link to="/career-development" className="p-6 border rounded-lg hover:shadow-lg transition">
            <TrendingUp className="w-12 h-12 mb-4 text-[#F83002]" />
            <h3 className="text-xl font-semibold mb-2">Career Development</h3>
            <p className="text-gray-600">Access courses, assessments, and mentorship programs</p>
          </Link>
          
          <Link to="/2fa/setup" className="p-6 border rounded-lg hover:shadow-lg transition">
            <Shield className="w-12 h-12 mb-4 text-[#F83002]" />
            <h3 className="text-xl font-semibold mb-2">Two-Factor Auth</h3>
            <p className="text-gray-600">Secure your account with 2FA protection</p>
          </Link>
          
          <Link to="/nlp-tools" className="p-6 border rounded-lg hover:shadow-lg transition">
            <Award className="w-12 h-12 mb-4 text-[#F83002]" />
            <h3 className="text-xl font-semibold mb-2">NLP Analysis</h3>
            <p className="text-gray-600">Smart resume parsing and keyword extraction</p>
          </Link>
          
          <Link to="/pricing" className="p-6 border rounded-lg hover:shadow-lg transition">
            <Briefcase className="w-12 h-12 mb-4 text-[#F83002]" />
            <h3 className="text-xl font-semibold mb-2">Premium Plans</h3>
            <p className="text-gray-600">Unlock advanced features for recruiters</p>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Home