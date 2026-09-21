import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { AppProvider, useAuth } from './context/AuthContext';
import { CmsProvider } from './context/CmsContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { getRouterBasename } from './lib/routePaths';


import ScrollToTop from './components/ScrollToTop';
import UnifiedBookingModal from './components/booking/UnifiedBookingModal';
import AIChatBotWidget from './components/support/AIChatBotWidget';
import BrandLogo from './components/BrandLogo';

import { lazyWithRetry } from './utils/lazyWithRetry';

const Home = lazyWithRetry(() => import('./pages/Home'));
const Services = lazyWithRetry(() => import('./pages/Services'));
const BookingFlow = lazyWithRetry(() => import('./pages/BookingFlow'));
const Login = lazyWithRetry(() => import('./pages/auth/Login'));
const Register = lazyWithRetry(() => import('./pages/auth/Register'));
const ForgotPassword = lazyWithRetry(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazyWithRetry(() => import('./pages/auth/ResetPassword'));
const CustomerDashboard = lazyWithRetry(() => import('./pages/dashboard/CustomerDashboard'));
const WorkerDashboard = lazyWithRetry(() => import('./pages/dashboard/WorkerDashboard'));
const AdminDashboard = lazyWithRetry(() => import('./pages/dashboard/AdminDashboard'));
const ContractorDashboard = lazyWithRetry(() => import('./pages/dashboard/ContractorDashboard'));
const HelpCenter = lazyWithRetry(() => import('./pages/HelpCenter'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const ContactUs = lazyWithRetry(() => import('./pages/ContactUs'));
const TermsAndConditions = lazyWithRetry(() => import('./pages/legal/TermsAndConditions'));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/legal/PrivacyPolicy'));
const RefundPolicy = lazyWithRetry(() => import('./pages/legal/RefundPolicy'));


const ContractorDisabled = lazyWithRetry(() => import('./pages/ContractorDisabled'));

const routerBasename = getRouterBasename();

const LoadingSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 160px)', gap: '1.5rem', background: '#FAFAF8' }}>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <BrandLogo iconOnly height={48} className="animate-pulse" />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ width: '16px', height: '16px', border: '2px solid #E7E9E6', borderTopColor: '#2F6B5F', borderRadius: '50%' }} className="animate-spin" />
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B716E', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Loading Fixiva</span>
    </div>
  </div>
);

import { isAdminRole } from './lib/adminAccess';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const userRole = String(user?.role || '').trim().toLowerCase();
  const userEmail = String(user?.email || '').trim().toLowerCase();
  const isAdmin = isAdminRole(userRole, userEmail);
  const normalizedAllowed = (allowedRoles || []).map(r => String(r).trim().toLowerCase());

  if ((loading && !user) || (isAuthenticated && !user)) {
    return <LoadingSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (userRole === 'contractor') {
    return <Navigate to="/contractor-disabled" replace />;
  }

  const isAllowed = allowedRoles
    ? (normalizedAllowed.includes(userRole) || (isAdmin && normalizedAllowed.includes('admin')))
    : true;

  if (!isAllowed) {
    if (isAdmin) {
      return <Navigate to="/dashboard/admin" replace />;
    }
    if (userRole === 'worker') {
      return <Navigate to="/worker-dashboard" replace />;
    }
    return <Navigate to="/dashboard/customer" replace />;
  }

  return children;
};

const RoleBasedDashboardRedirect = () => {
  const { user } = useAuth();
  const role = String(user?.role || '').trim().toLowerCase();
  const email = String(user?.email || '').trim().toLowerCase();
  if (isAdminRole(role, email)) return <Navigate to="/dashboard/admin" replace />;
  if (role === 'worker') return <Navigate to="/worker-dashboard" replace />;
  if (role === 'contractor') return <Navigate to="/contractor-disabled" replace />;
  return <Navigate to="/dashboard/customer" replace />;
};

function AppShell() {
  return (
    <Router basename={routerBasename}>
      <ScrollToTop />
      <div className="app-container">
        <Navbar />
        <main className="content">
          <Suspense fallback={<LoadingSkeleton />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/book/:serviceId?" element={<BookingFlow />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard/customer" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/worker" element={<ProtectedRoute allowedRoles={['worker']}><WorkerDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/contractor" element={<ContractorDisabled />} />
              <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/worker-dashboard" element={<ProtectedRoute allowedRoles={['worker']}><WorkerDashboard /></ProtectedRoute>} />
              <Route path="/contractor-dashboard" element={<ContractorDisabled />} />
              <Route path="/contractor-disabled" element={<ContractorDisabled />} />
              <Route path="/dashboard" element={<ProtectedRoute><RoleBasedDashboardRedirect /></ProtectedRoute>} />
              <Route path="/fixiva-admin/*" element={<Navigate to="/dashboard/admin" replace />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/refund" element={<RefundPolicy />} />
              <Route path="/cancellation" element={<RefundPolicy />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <UnifiedBookingModal />
        <AIChatBotWidget />
      </div>
    </Router>
  );
}

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <LanguageProvider>
          <AppProvider>
            <CmsProvider>
              <AppShell />
            </CmsProvider>
          </AppProvider>
        </LanguageProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;


