import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Settings, Briefcase, FileText, LifeBuoy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getDashboardPath } from '../lib/navbarUtils';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
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
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.22)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group select-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="160" height="40" viewBox="0 0 160 40" role="img" aria-label="Fixiva logo" className="shrink-0 transition-transform duration-300 group-hover:scale-[1.02]">
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

                {/* Wordmark (Premium Soft Geometric Design) */}
                <g id="wordmark" fill="none" strokeWidth="3.3" strokeLinecap="round" strokeLinejoin="round">
                  {/* F - Deep Blue */}
                  <path id="letter-f" d="M60 13.5 H53.6 V26.5 M53.6 19.5 H58.5" stroke="#2563EB" />
                  
                  {/* I-1 - Dark Charcoal */}
                  <path id="letter-i-1" d="M65.5 13.5 V26.5" stroke="#111827" />
                  
                  {/* X - Dark Charcoal */}
                  <path id="letter-x" d="M71.5 13.5 L79.5 26.5 M79.5 13.5 L71.5 26.5" stroke="#111827" />
                  
                  {/* I-2 - Emerald */}
                  <path id="letter-i-2" d="M85.5 13.5 V26.5" stroke="#10B981" />
                  
                  {/* V - Amber */}
                  <path id="letter-v" d="M91.5 13.5 L96.5 26.5 L101.5 13.5" stroke="#F59E0B" />
                  
                  {/* A - Dark Charcoal */}
                  <path id="letter-a" d="M107.5 26.5 L112.5 13.5 L117.5 26.5 M110.1 21 H114.9" stroke="#111827" />
                </g>
              </svg>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {!isAuthenticated ? (
              <>
                <Link 
                  to="/" 
                  className={`text-sm font-semibold transition-all hover:text-primary ${
                    isActive('/') ? 'text-primary' : 'text-slate-600'
                  }`}
                >
                  Home
                </Link>
                <Link 
                  to="/services" 
                  className={`text-sm font-semibold transition-all hover:text-primary ${
                    isActive('/services') ? 'text-primary' : 'text-slate-600'
                  }`}
                >
                  Services
                </Link>
                <Link 
                  to="/help" 
                  className={`text-sm font-semibold transition-all hover:text-primary ${
                    isActive('/help') ? 'text-primary' : 'text-slate-600'
                  }`}
                >
                  Help Center
                </Link>
                <Link 
                  to="/help?tab=about" 
                  className={`text-sm font-semibold transition-all hover:text-primary ${
                    location.search.includes('tab=about') ? 'text-primary' : 'text-slate-600'
                  }`}
                >
                  About
                </Link>
                <div className="h-4 w-px bg-slate-200"></div>
                <Link 
                  to="/login" 
                  className="text-sm font-bold text-slate-700 hover:text-primary transition-all px-3 py-2 rounded-full hover:bg-slate-50"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="join-cta"
                >
                  Join Fixiva
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to={dashboardPath} 
                  className={`flex items-center gap-1.5 text-sm font-semibold transition-all hover:text-primary ${
                    location.pathname.startsWith('/dashboard') ? 'text-primary' : 'text-slate-600'
                  }`}
                >
                  <Briefcase size={16} /> Dashboard
                </Link>
                <Link 
                  to={`${dashboardPath}?tab=bookings`} 
                  className="flex items-center gap-1.5 text-slate-600 hover:text-primary text-sm font-semibold transition-all"
                >
                  <FileText size={16} /> Bookings
                </Link>
                {normalizedUser.role !== 'admin' && (
                  <Link 
                    to={`${dashboardPath}?tab=support`} 
                    className="flex items-center gap-1.5 text-slate-600 hover:text-primary text-sm font-semibold transition-all"
                  >
                    <LifeBuoy size={16} /> Support
                  </Link>
                )}
                <Link 
                  to={normalizedUser.role === 'admin' ? dashboardPath : `${dashboardPath}?tab=profile`} 
                  className="flex items-center gap-1.5 text-slate-600 hover:text-primary text-sm font-semibold transition-all"
                >
                  <Settings size={16} /> Profile
                </Link>

                <div className="h-5 w-px bg-slate-200"></div>

                <div className="flex items-center gap-3">
                  <Link 
                    to={normalizedUser.role === 'admin' ? dashboardPath : `${dashboardPath}?tab=profile`} 
                    className="flex items-center gap-2 group"
                  >
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-blue-500 text-white font-bold text-xs flex items-center justify-center uppercase tracking-wider shadow-sm ring-2 ring-slate-100 group-hover:ring-primary/20 transition-all">
                      {getInitials(normalizedUser.name)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 leading-tight group-hover:text-primary transition-all">
                        {normalizedUser.name || 'User'}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize font-medium leading-none">
                        {normalizedUser.role || 'guest'}
                      </span>
                    </div>
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-danger hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100" 
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button 
              className="p-2 rounded-xl text-slate-600 hover:text-primary hover:bg-slate-50 transition-all" 
              onClick={() => setIsOpen(!isOpen)} 
              aria-label="Toggle Menu"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
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
                    Home
                  </Link>
                  <Link 
                    to="/services" 
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 transition-all"
                  >
                    Services
                  </Link>
                  <Link 
                    to="/help" 
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 transition-all"
                  >
                    Help Center
                  </Link>
                  <Link 
                    to="/help?tab=about" 
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 transition-all"
                  >
                    About
                  </Link>
                  <div className="h-px bg-slate-100 my-2"></div>
                  <Link 
                    to="/login" 
                    onClick={() => setIsOpen(false)}
                    className="block text-center px-4 py-2.5 rounded-xl text-base font-bold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={() => setIsOpen(false)} 
                    className="block text-center join-cta-mobile"
                  >
                    Join Fixiva
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 text-white font-bold text-sm flex items-center justify-center uppercase tracking-wider">
                      {getInitials(normalizedUser.name)}
                    </div>
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
                    Dashboard
                  </Link>
                  <Link 
                    to={`${dashboardPath}?tab=bookings`} 
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 transition-all"
                  >
                    Bookings
                  </Link>
                  {normalizedUser.role !== 'admin' && (
                    <Link 
                      to={`${dashboardPath}?tab=support`} 
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 transition-all"
                    >
                      Support
                    </Link>
                  )}
                  <Link 
                    to={normalizedUser.role === 'admin' ? dashboardPath : `${dashboardPath}?tab=profile`} 
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 transition-all"
                  >
                    Profile Settings
                  </Link>
                  <div className="h-px bg-slate-100 my-2"></div>
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-center px-4 py-2.5 rounded-xl text-base font-bold text-danger hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} /> Logout
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
