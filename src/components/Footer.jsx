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
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-md shadow-primary/20">
                <span className="text-white font-extrabold text-sm tracking-wider">F</span>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-primary transition-all">
                FIXIVA
              </span>
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
                <a href="mailto:sinhadev739@gmail.com" className="hover:text-white transition-colors break-all">
                  sinhadev739@gmail.com
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
