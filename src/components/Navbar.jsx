import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Settings, Briefcase, FileText, LifeBuoy, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getDashboardPath } from '../lib/navbarUtils';
import LanguageSelector from './LanguageSelector';
import BrandLogo from './BrandLogo';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setIsOpen(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const normalizedUser = user || {};
  const dashboardPath = getDashboardPath(normalizedUser);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.22)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group select-none">
              <BrandLogo mode={isDark ? 'dark' : 'light'} height={38} />
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {!isAuthenticated ? (
              <>
                <Link 
                  to="/" 
                  className={`text-xs lg:text-sm font-extrabold px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                    isActive('/') 
                      ? 'text-[#2F6B5F] dark:text-emerald-400 bg-[#2F6B5F]/10 dark:bg-emerald-400/15 border border-[#2F6B5F]/20 dark:border-emerald-400/30 shadow-2xs' 
                      : 'text-slate-700 dark:text-slate-100 hover:text-[#2F6B5F] dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t('home', 'Home')}
                </Link>
                <Link 
                  to="/services" 
                  className={`text-xs lg:text-sm font-extrabold px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                    isActive('/services') 
                      ? 'text-[#2F6B5F] dark:text-emerald-400 bg-[#2F6B5F]/10 dark:bg-emerald-400/15 border border-[#2F6B5F]/20 dark:border-emerald-400/30 shadow-2xs' 
                      : 'text-slate-700 dark:text-slate-100 hover:text-[#2F6B5F] dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t('services', 'Services')}
                </Link>
                <Link 
                  to="/help" 
                  className={`text-xs lg:text-sm font-extrabold px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                    isActive('/help') 
                      ? 'text-[#2F6B5F] dark:text-emerald-400 bg-[#2F6B5F]/10 dark:bg-emerald-400/15 border border-[#2F6B5F]/20 dark:border-emerald-400/30 shadow-2xs' 
                      : 'text-slate-700 dark:text-slate-100 hover:text-[#2F6B5F] dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t('helpCenter', 'Help Center')}
                </Link>
                <Link 
                  to="/help?tab=about" 
                  className={`text-xs lg:text-sm font-extrabold px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                    location.search.includes('tab=about') 
                      ? 'text-[#2F6B5F] dark:text-emerald-400 bg-[#2F6B5F]/10 dark:bg-emerald-400/15 border border-[#2F6B5F]/20 dark:border-emerald-400/30 shadow-2xs' 
                      : 'text-slate-700 dark:text-slate-100 hover:text-[#2F6B5F] dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t('about', 'About')}
                </Link>
                
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                {/* Language Selector */}
                <LanguageSelector />

                {/* Theme Toggle Button */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  aria-label="Toggle Theme"
                >
                  {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-700" />}
                </button>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                <Link 
                  to="/login" 
                  className="text-xs lg:text-sm font-black text-slate-800 dark:text-white hover:text-[#2F6B5F] dark:hover:text-emerald-400 transition-all px-4 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t('login', 'Login')}
                </Link>
                <Link 
                  to="/register" 
                  className="join-cta text-xs lg:text-sm"
                >
                  {t('joinFixiva', 'Join Fixiva')}
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to={dashboardPath} 
                  className={`flex items-center gap-1.5 text-xs lg:text-sm font-extrabold px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                    location.pathname.startsWith('/dashboard') 
                      ? 'text-[#2F6B5F] dark:text-emerald-400 bg-[#2F6B5F]/10 dark:bg-emerald-400/15 border border-[#2F6B5F]/20 dark:border-emerald-400/30 shadow-2xs' 
                      : 'text-slate-700 dark:text-slate-100 hover:text-[#2F6B5F] dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Briefcase size={16} /> {t('dashboard', 'Dashboard')}
                </Link>
                <Link 
                  to={`${dashboardPath}?tab=bookings`} 
                  className="flex items-center gap-1.5 text-slate-700 dark:text-slate-100 hover:text-[#2F6B5F] dark:hover:text-emerald-400 text-xs lg:text-sm font-extrabold px-3.5 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <FileText size={16} /> {t('bookings', 'Bookings')}
                </Link>
                {normalizedUser.role !== 'admin' && (
                  <Link 
                    to={`${dashboardPath}?tab=support`} 
                    className="flex items-center gap-1.5 text-slate-700 dark:text-slate-100 hover:text-[#2F6B5F] dark:hover:text-emerald-400 text-xs lg:text-sm font-extrabold px-3.5 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <LifeBuoy size={16} /> {t('support', 'Support')}
                  </Link>
                )}
                <Link 
                  to={normalizedUser.role === 'admin' ? dashboardPath : `${dashboardPath}?tab=profile`} 
                  className="flex items-center gap-1.5 text-slate-700 dark:text-slate-100 hover:text-[#2F6B5F] dark:hover:text-emerald-400 text-xs lg:text-sm font-extrabold px-3.5 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <Settings size={16} /> {t('profile', 'Profile')}
                </Link>

                <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                {/* Language Selector */}
                <LanguageSelector />

                {/* Theme Toggle Button */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  aria-label="Toggle Theme"
                >
                  {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-700" />}
                </button>

                <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                <div className="flex items-center gap-3">
                  <Link 
                    to={normalizedUser.role === 'admin' ? dashboardPath : `${dashboardPath}?tab=profile`} 
                    className="flex items-center gap-2 group p-1 pr-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    {normalizedUser.profile_photo_url ? (
                      <img
                        src={normalizedUser.profile_photo_url}
                        alt={normalizedUser.name}
                        className="h-8 w-8 rounded-full object-cover shadow-2xs ring-2 ring-primary/20 group-hover:ring-primary transition-all"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-[#2F6B5F] text-white font-extrabold text-xs flex items-center justify-center uppercase tracking-wider shadow-2xs ring-2 ring-primary/20 group-hover:ring-primary transition-all">
                        {getInitials(normalizedUser.name)}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-primary transition-all">
                        {normalizedUser.name || 'User'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 capitalize font-medium leading-none">
                        {normalizedUser.role || 'guest'}
                      </span>
                    </div>
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-danger hover:bg-red-50 dark:hover:bg-red-950/40 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-900/40" 
                    title={t('logout', 'Logout')}
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button 
              className="p-1.5 px-2 rounded-xl text-slate-600 hover:text-primary hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-0.5 select-none" 
              onClick={() => setIsOpen(!isOpen)} 
              aria-label="Toggle Menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
              <span className="text-[10px] font-extrabold tracking-wider uppercase leading-none">{t('menu', 'Menu')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {!isAuthenticated ? (
                <>
                  <Link 
                    to="/" 
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 transition-all"
                  >
                    {t('home', 'Home')}
                  </Link>
                  <Link 
                    to="/services" 
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 transition-all"
                  >
                    {t('services', 'Services')}
                  </Link>
                  <Link 
                    to="/help" 
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 transition-all"
                  >
                    {t('helpCenter', 'Help Center')}
                  </Link>
                  <Link 
                    to="/help?tab=about" 
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 transition-all"
                  >
                    {t('about', 'About')}
                  </Link>
                  
                  {/* Language Selector inside Mobile Menu */}
                  <LanguageSelector isMobile={true} />

                  {/* Dark Mode Toggle inside Mobile Menu */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer select-none"
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    aria-label="Toggle Theme"
                  >
                    <div className="flex items-center gap-2">
                      {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600 dark:text-slate-300" />}
                      <span>{isDark ? t('lightMode', 'Light Mode') : t('darkMode', 'Dark Mode')}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                      {isDark ? t('dark', 'Dark') : t('light', 'Light')}
                    </span>
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                  <Link 
                    to="/login" 
                    onClick={() => setIsOpen(false)}
                    className="block text-center px-4 py-2.5 rounded-xl text-base font-bold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    {t('login', 'Login')}
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={() => setIsOpen(false)} 
                    className="block text-center join-cta-mobile"
                  >
                    {t('joinFixiva', 'Join Fixiva')}
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-4">
                    {normalizedUser.profile_photo_url ? (
                      <img
                        src={normalizedUser.profile_photo_url}
                        alt={normalizedUser.name}
                        className="h-10 w-10 rounded-full object-cover shadow-sm ring-2 ring-slate-200"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-[#2F6B5F] text-white font-bold text-sm flex items-center justify-center uppercase tracking-wider">
                        {getInitials(normalizedUser.name)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 leading-tight">{normalizedUser.name || 'User'}</h4>
                      <p className="text-[10px] text-slate-400 capitalize font-medium">{normalizedUser.role || 'guest'}</p>
                    </div>
                  </div>
                  <Link 
                    to={dashboardPath} 
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 transition-all"
                  >
                    {t('dashboard', 'Dashboard')}
                  </Link>
                  <Link 
                    to={`${dashboardPath}?tab=bookings`} 
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 transition-all"
                  >
                    {t('bookings', 'Bookings')}
                  </Link>
                  {normalizedUser.role !== 'admin' && (
                    <Link 
                      to={`${dashboardPath}?tab=support`} 
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 transition-all"
                    >
                      {t('support', 'Support')}
                    </Link>
                  )}
                  <Link 
                    to={normalizedUser.role === 'admin' ? dashboardPath : `${dashboardPath}?tab=profile`} 
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 transition-all"
                  >
                    {t('profile', 'Profile')}
                  </Link>

                  {/* Language Selector inside Mobile Menu */}
                  <LanguageSelector isMobile={true} />

                  {/* Dark Mode Toggle inside Mobile Menu */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer select-none"
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    aria-label="Toggle Theme"
                  >
                    <div className="flex items-center gap-2">
                      {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600 dark:text-slate-300" />}
                      <span>{isDark ? t('lightMode', 'Light Mode') : t('darkMode', 'Dark Mode')}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                      {isDark ? t('dark', 'Dark') : t('light', 'Light')}
                    </span>
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-center px-4 py-2.5 rounded-xl text-base font-bold text-danger hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} /> {t('logout', 'Logout')}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

