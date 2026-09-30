import { Link } from 'react-router-dom';
import { Mail, MapPin, Share2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import BrandLogo from './BrandLogo';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#0B0F19] text-slate-400 border-t border-slate-800/80">
      {/* Top Trust & Protection Bar */}
      <div className="border-b border-slate-800/60 bg-slate-950/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-300">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>🔒 100% Identity-Verified Experts</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⚡ Upfront Base Pricing & On-Site Payment Protection</span>
          </div>
          <div className="flex items-center gap-2">
            <span>💬 24/7 Operations & Help Support</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 group">
              <BrandLogo mode="dark" height={36} />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed font-semibold">
              {t('footerTagline', 'Fixiva is a modern home-service control plane connecting customers with verified professionals.')}
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="mailto:fixiva869@gmail.com" 
                className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-primary/50 hover:bg-primary hover:text-white flex items-center justify-center text-slate-400 transition-all cursor-pointer shadow-xs"
                aria-label="Contact Email"
                title="Email Support"
              >
                <Mail size={16} />
              </a>
              <a 
                href="#" 
                className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-primary/50 hover:bg-primary hover:text-white flex items-center justify-center text-slate-400 transition-all cursor-pointer shadow-xs"
                aria-label="Share"
                title="Share Fixiva"
              >
                <Share2 size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">{t('quickLinks', 'Quick Links')}</h4>
            <ul className="space-y-3.5 text-xs font-bold">
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  {t('services', 'Services')}
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-white transition-colors">
                  {t('helpCenter', 'Help Center')}
                </Link>
              </li>
              <li>
                <Link to="/help?tab=about" className="hover:text-white transition-colors">
                  {t('about', 'About')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  {t('support', 'Support')}
                </Link>
              </li>
              <li>
                <Link to="/register?role=worker" className="hover:text-white transition-colors text-[#3D8068] font-extrabold">
                  {t('joinFixiva', 'Join Fixiva')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">{t('legalPolicies', 'Legal & Policies')}</h4>
            <ul className="space-y-3.5 text-xs font-bold">
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
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">{t('contactInfo', 'Contact Information')}</h4>
            <div className="space-y-4 text-xs font-bold">
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
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-500">
          <p>&copy; {new Date().getFullYear()} Fixiva Services. {t('allRightsReserved', 'All rights reserved.')}</p>
          <p className="flex items-center gap-1.5">
            <span>Built with precision for seamless home services</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
