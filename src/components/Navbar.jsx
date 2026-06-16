import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, HelpCircle, Briefcase, FileText, LifeBuoy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

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

  const dashboardPath = user ? `/dashboard/${user.role}` : '/login';

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-md shadow-primary/20 transform group-hover:scale-105 transition-all">
                <span className="text-white font-extrabold text-sm tracking-wider">F</span>
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent group-hover:from-primary group-hover:to-blue-600 transition-all">
                FIXIVA
              </span>
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
                  className="text-sm font-bold text-slate-700 hover:text-primary transition-all px-3 py-2"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-primary hover:bg-primary-dark text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-md shadow-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
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
                {user.role !== 'admin' && (
                  <Link 
                    to={`${dashboardPath}?tab=support`} 
                    className="flex items-center gap-1.5 text-slate-600 hover:text-primary text-sm font-semibold transition-all"
                  >
                    <LifeBuoy size={16} /> Support
                  </Link>
                )}
                <Link 
                  to={user.role === 'admin' ? dashboardPath : `${dashboardPath}?tab=profile`} 
                  className="flex items-center gap-1.5 text-slate-600 hover:text-primary text-sm font-semibold transition-all"
                >
                  <Settings size={16} /> Profile
                </Link>

                <div className="h-5 w-px bg-slate-200"></div>

                <div className="flex items-center gap-3">
                  <Link 
                    to={user.role === 'admin' ? dashboardPath : `${dashboardPath}?tab=profile`} 
                    className="flex items-center gap-2 group"
                  >
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-blue-500 text-white font-bold text-xs flex items-center justify-center uppercase tracking-wider shadow-sm ring-2 ring-slate-100 group-hover:ring-primary/20 transition-all">
                      {getInitials(user.name)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 leading-tight group-hover:text-primary transition-all">
                        {user.name || 'User'}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize font-medium leading-none">
                        {user.role}
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
            className="md:hidden border-t border-slate-100 bg-white overflow-hidden"
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
                    className="block text-center bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-xl shadow-md transition-all"
                  >
                    Join Fixiva
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 text-white font-bold text-sm flex items-center justify-center uppercase tracking-wider">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 leading-tight">{user.name}</h4>
                      <p className="text-[10px] text-slate-400 capitalize font-medium">{user.role}</p>
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
                  {user.role !== 'admin' && (
                    <Link 
                      to={`${dashboardPath}?tab=support`} 
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 transition-all"
                    >
                      Support
                    </Link>
                  )}
                  <Link 
                    to={user.role === 'admin' ? dashboardPath : `${dashboardPath}?tab=profile`} 
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
