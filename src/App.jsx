import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
    <div style={{ width: '48px', height: '48px', border: '4px solid #EFF4FF', borderTopColor: '#0F4CFF', borderRadius: '50%' }} className="animate-spin" />
    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading Fixiva...</span>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <LoadingSkeleton />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to={`/dashboard/${user?.role || 'customer'}`} replace />;

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
                <Route path="/fixora-admin" element={<Login adminMode />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard/customer" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/worker" element={<ProtectedRoute allowedRoles={['worker']}><WorkerDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/contractor" element={<ProtectedRoute allowedRoles={['contractor']}><ContractorDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/fixora-admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
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
