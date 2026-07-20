import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { AppProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

const Home = React.lazy(() => import('./pages/Home'));
const Services = React.lazy(() => import('./pages/Services'));
const BookingFlow = React.lazy(() => import('./pages/BookingFlow'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'));
const CustomerDashboard = React.lazy(() => import('./pages/dashboard/CustomerDashboard'));
const WorkerDashboard = React.lazy(() => import('./pages/dashboard/WorkerDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/dashboard/AdminDashboard'));
const ContractorDashboard = React.lazy(() => import('./pages/dashboard/ContractorDashboard'));
const HelpCenter = React.lazy(() => import('./pages/HelpCenter'));
const Profile = React.lazy(() => import('./pages/Profile'));
const ContactUs = React.lazy(() => import('./pages/ContactUs'));
const TermsAndConditions = React.lazy(() => import('./pages/legal/TermsAndConditions'));
const PrivacyPolicy = React.lazy(() => import('./pages/legal/PrivacyPolicy'));
const RefundPolicy = React.lazy(() => import('./pages/legal/RefundPolicy'));

const LoadingSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 160px)', gap: '1.5rem', background: '#F8FAFC' }}>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 40 40" style={{ boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', borderRadius: '10px' }} className="animate-pulse">
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
      </svg>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ width: '16px', height: '16px', border: '2px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%' }} className="animate-spin" />
      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Loading Fixiva</span>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  console.log("[Route Guard Debug] Pathname:", location.pathname);
  console.log("[Route Guard Debug] User state:", user);
  console.log("[Route Guard Debug] IsAuthenticated:", isAuthenticated);
  console.log("[Route Guard Debug] Loading state:", loading);
  console.log("[Route Guard Debug] Allowed Roles:", allowedRoles);

  if (loading || (isAuthenticated && !user)) {
    console.log("[Route Guard Debug] Showing LoadingSkeleton...");
    return <LoadingSkeleton />;
  }
  
  if (!isAuthenticated) {
    if (location.pathname.startsWith('/fixiva-admin') || location.pathname === '/dashboard/admin') {
      return <Navigate to="/fixiva-admin" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  const userRole = String(user?.role || '').trim().toLowerCase();
  const normalizedAllowed = (allowedRoles || []).map(r => String(r).trim().toLowerCase());

  if (allowedRoles && !normalizedAllowed.includes(userRole)) {
    if (userRole === 'admin') {
      return <Navigate to="/fixiva-admin" replace />;
    }
    if (userRole === 'worker') {
      return <Navigate to="/worker-dashboard" replace />;
    }
    if (userRole === 'contractor') {
      return <Navigate to="/contractor-dashboard" replace />;
    }
    return <Navigate to="/dashboard/customer" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <ToastProvider>
        <AppProvider>
          <div className="app-container">
          <Navbar />
          <main className="content">
            <Suspense fallback={<LoadingSkeleton />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/book/:serviceId?" element={<BookingFlow />} />
                <Route path="/login" element={<Login />} />
                <Route path="/fixiva-admin" element={<Login adminMode />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard/customer" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/worker" element={<ProtectedRoute allowedRoles={['worker']}><WorkerDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/contractor" element={<ProtectedRoute allowedRoles={['contractor']}><ContractorDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/fixiva-admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/worker-dashboard" element={<ProtectedRoute allowedRoles={['worker']}><WorkerDashboard /></ProtectedRoute>} />
                <Route path="/contractor-dashboard" element={<ProtectedRoute allowedRoles={['contractor']}><ContractorDashboard /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/refund" element={<RefundPolicy />} />
                <Route path="/cancellation" element={<RefundPolicy />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
        </AppProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
