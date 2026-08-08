import { Link } from 'react-router-dom';
import { Mail, MapPin, Share2 } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 group">
              <svg xmlns="http://www.w3.org/2000/svg" width="144" height="36" viewBox="0 0 160 40" className="shrink-0 group">
                {/* Icon Mark Background */}
                <rect x="0" y="0" width="40" height="40" rx="10" fill="#F8FAFC" />
                
                {/* Screwdriver Chimney */}
                <rect x="24.5" y="6" width="3.5" height="5.5" rx="0.8" fill="#F59E0B" />
                <rect x="25.5" y="11.5" width="1.5" height="4.5" fill="#F59E0B" />

                {/* Amber Shield-Roof */}
                <polygon points="8,19 20,9 32,19 29,19 20,12.5 11,19" fill="#F59E0B" />

                {/* Blue House-Shield Body */}
                <path d="M 11 19 L 29 19 L 29 27 C 29 32.5 20 35 20 35 C 20 35 11 32.5 11 27 Z" fill="#2563EB" />

                {/* Connected Service Windows */}
                <line x1="15" y1="21.5" x2="25" y2="21.5" stroke="#FFFFFF" strokeWidth="1" />
                <circle cx="15" cy="21.5" r="1.5" fill="#FFFFFF" />
                <circle cx="20" cy="21.5" r="1.5" fill="#FFFFFF" />
                <circle cx="25" cy="21.5" r="1.5" fill="#FFFFFF" />

                {/* White Door */}
                <rect x="15" y="24" width="10" height="9.5" rx="1" fill="#FFFFFF" />

                {/* Success Green Door Checkmark */}
                <path d="M17.5 28.5 L19.5 30.5 L22.5 26" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                {/* Foundation Beam */}
                <rect x="12" y="32.5" width="16" height="1.2" rx="0.6" fill="#FFFFFF" opacity="0.3" />

                {/* Wordmark (Premium Soft Geometric Design for Dark Background) */}
                <g id="wordmark" fill="none" strokeWidth="3.3" strokeLinecap="round" strokeLinejoin="round">
                  {/* F - Deep Blue */}
                  <path id="letter-f" d="M60 13.5 H53.6 V26.5 M53.6 19.5 H58.5" stroke="#2563EB" />
                  
                  {/* I-1 - White with Hover Transition */}
                  <path id="letter-i-1" d="M65.5 13.5 V26.5" className="stroke-white group-hover:stroke-primary transition-all duration-300" />
                  
                  {/* X - White with Hover Transition */}
                  <path id="letter-x" d="M71.5 13.5 L79.5 26.5 M79.5 13.5 L71.5 26.5" className="stroke-white group-hover:stroke-primary transition-all duration-300" />
                  
                  {/* I-2 - Emerald */}
                  <path id="letter-i-2" d="M85.5 13.5 V26.5" stroke="#10B981" />
                  
                  {/* V - Amber */}
                  <path id="letter-v" d="M91.5 13.5 L96.5 26.5 L101.5 13.5" stroke="#F59E0B" />
                  
                  {/* A - White with Hover Transition */}
                  <path id="letter-a" d="M107.5 26.5 L112.5 13.5 L117.5 26.5 M110.1 21 H114.9" className="stroke-white group-hover:stroke-primary transition-all duration-300" />
                </g>
              </svg>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              One App. Every Solution. <br/>Everything Your Home Needs.
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="#" 
                className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-primary hover:text-white flex items-center justify-center text-slate-400 transition-all"
                aria-label="Social Link"
              >
                <Share2 size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Quick Links</h4>
            <ul className="space-y-3.5 text-sm font-medium">
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  All Services
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/help?tab=about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/register?role=worker" className="hover:text-white transition-colors text-primary font-bold">
                  Become a Partner
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Legal Info</h4>
            <ul className="space-y-3.5 text-sm font-medium">
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/refund" className="hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/cancellation" className="hover:text-white transition-colors">
                  Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-6">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Contact Us</h4>
            <div className="space-y-4 text-sm font-medium">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-primary shrink-0" />
                <a href="mailto:fixiva869@gmail.com" className="hover:text-white transition-colors break-all">
                  fixiva869@gmail.com
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                <span className="text-slate-400">Deoghar, Jharkhand, India</span>
              </div>
            </div>
            <div className="inline-block px-3 py-1.5 bg-slate-800 border border-slate-700/50 rounded-lg text-[10px] font-bold text-primary tracking-wider uppercase">
              Digital Payments Coming Soon
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium">
          <p>&copy; {new Date().getFullYear()} Fixiva Services. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-slate-500">Tagline: Everything Your Home Needs.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
