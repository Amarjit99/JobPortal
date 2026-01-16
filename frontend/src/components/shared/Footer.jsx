import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin, Smartphone } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* 1. BRAND & SOCIAL CONNECT */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <h2 className="text-2xl font-bold text-white">Job<span className="text-[#F83002]">Portal</span></h2>
            </Link>
            <p className="text-sm mb-4">Your trusted partner in career success</p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#F83002] transition" aria-label="Facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#F83002] transition" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#F83002] transition" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#F83002] transition" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* 2. COMPANY INFORMATION LINKS */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-[#F83002] transition">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-[#F83002] transition">Careers</Link></li>
              <li><Link to="/admin/companies" className="hover:text-[#F83002] transition">Employer Home</Link></li>
              <li><Link to="/sitemap" className="hover:text-[#F83002] transition">Sitemap</Link></li>
              <li><Link to="/credits" className="hover:text-[#F83002] transition">Credits</Link></li>
            </ul>
          </div>

          {/* 3. HELP & SUPPORT + 7. TRUST & SECURITY */}
          <div>
            <h3 className="text-white font-semibold mb-4">Help & Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/faq" className="hover:text-[#F83002] transition">Help Center (FAQs)</Link></li>
              <li><Link to="/contact" className="hover:text-[#F83002] transition">Contact Support</Link></li>
              <li><Link to="/grievance" className="hover:text-[#F83002] transition">Grievance Redressal</Link></li>
              <li><Link to="/report-fraud" className="hover:text-[#F83002] transition">Report Fraud Job</Link></li>
              <li><Link to="/trust-safety" className="hover:text-[#F83002] transition">Trust & Safety</Link></li>
            </ul>
          </div>

          {/* 4. LEGAL & POLICY + 6. USER ROLE SHORTCUTS */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-[#F83002] transition">Job Seeker Login</Link></li>
              <li><Link to="/admin/jobs/create" className="hover:text-[#F83002] transition">Post a Job</Link></li>
              <li><Link to="/browse" className="hover:text-[#F83002] transition">Browse Jobs</Link></li>
              <li><Link to="/admin/companies" className="hover:text-[#F83002] transition">Browse Companies</Link></li>
              <li><Link to="/privacy-center" className="hover:text-[#F83002] transition">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-[#F83002] transition">Terms & Conditions</Link></li>
              <li><Link to="/fraud-alert" className="hover:text-[#F83002] transition">Fraud Alert</Link></li>
            </ul>
          </div>

          {/* 5. MOBILE APP PROMOTION + 8. SEO FEATURES */}
          <div>
            <h3 className="text-white font-semibold mb-4">Apply on the Go</h3>
            <p className="text-sm mb-3">Download our mobile app</p>
            <div className="flex gap-3 mb-6 items-center">
              <a href="https://play.google.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition">
                <img 
                  src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                  alt="Get it on Google Play" 
                  className="h-[55px] w-auto"
                />
              </a>
              
              <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition">
                <img 
                  src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" 
                  alt="Download on the App Store" 
                  className="h-[45px] w-auto"
                />
              </a>
            </div>
            
            <h3 className="text-white font-semibold mb-3 mt-6">Popular Searches</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/jobs?location=mumbai" className="hover:text-[#F83002] transition">Jobs in Mumbai</Link></li>
              <li><Link to="/jobs?location=bangalore" className="hover:text-[#F83002] transition">Jobs in Bangalore</Link></li>
              <li><Link to="/jobs?skill=react" className="hover:text-[#F83002] transition">React Developer Jobs</Link></li>
              <li><Link to="/jobs?skill=python" className="hover:text-[#F83002] transition">Python Jobs</Link></li>
            </ul>
          </div>
        </div>

        {/* 9. COPYRIGHT & LEGAL NOTICE */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm">
            <div className="mb-4 md:mb-0">
              <p>© {currentYear} JobPortal. All rights reserved.</p>
              <p className="text-xs text-gray-500 mt-1">Registered Company • CIN: U12345AB6789CDE012345</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-xs">
                <span className="bg-green-600 text-white px-2 py-1 rounded">Verified Secure</span>
                <span className="text-gray-500">SSL Encrypted</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>This site is protected by security measures and fraud detection systems.</p>
            <p className="mt-1">
              <Link to="/fraud-alert" className="hover:text-[#F83002]">Report suspicious activity</Link> | 
              <Link to="/trust-safety" className="hover:text-[#F83002] ml-1">Trust & Safety Guidelines</Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;