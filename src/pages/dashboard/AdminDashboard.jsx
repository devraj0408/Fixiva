import React, { useMemo, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, CheckCircle, Clock, FileText, MessageCircle, ShieldCheck, Users } from 'lucide-react';
import { useApp } from '../../context/AuthContext';
import { useCms } from '../../context/CmsContext';
import AdminShell from '../../components/admin/AdminShell';

const DashboardOverview = React.lazy(() => import('../../components/admin/DashboardOverview'));
const BookingManagementPanel = React.lazy(() => import('../../components/admin/BookingManagementPanel'));
const UserManagementPanel = React.lazy(() => import('../../components/admin/UserManagementPanel'));
const ServicesPanel = React.lazy(() => import('../../components/admin/ServicesPanel'));
const CategoriesPanel = React.lazy(() => import('../../components/admin/CategoriesPanel'));
const AreasPanel = React.lazy(() => import('../../components/admin/AreasPanel'));
const CoveragePanel = React.lazy(() => import('../../components/admin/CoveragePanel'));
const CoverageRequestsPanel = React.lazy(() => import('../../components/admin/CoverageRequestsPanel'));
const PricingPanel = React.lazy(() => import('../../components/admin/PricingPanel'));
const BannersPanel = React.lazy(() => import('../../components/admin/BannersPanel'));
const CouponsPanel = React.lazy(() => import('../../components/admin/CouponsPanel'));
const OffersPanel = React.lazy(() => import('../../components/admin/OffersPanel'));
const NotificationsPanel = React.lazy(() => import('../../components/admin/NotificationsPanel'));
const FaqsPanel = React.lazy(() => import('../../components/admin/FaqsPanel'));
const WorkersPanel = React.lazy(() => import('../../components/admin/WorkersPanel'));
const ContractorsPanel = React.lazy(() => import('../../components/admin/ContractorsPanel'));
const ReviewsPanel = React.lazy(() => import('../../components/admin/ReviewsPanel'));
const PaymentsPanel = React.lazy(() => import('../../components/admin/PaymentsPanel'));
const RevenuePanel = React.lazy(() => import('../../components/admin/RevenuePanel'));
const TicketsPanel = React.lazy(() => import('../../components/admin/TicketsPanel'));
const ReportsPanel = React.lazy(() => import('../../components/admin/ReportsPanel'));
const SettingsPanel = React.lazy(() => import('../../components/admin/SettingsPanel'));

import { useLanguage } from '../../context/LanguageContext';

const PanelLoader = () => {
  const { t } = useLanguage();
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary"></div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('loadingModule', 'Loading Module...')}</p>
    </div>
  );
};

const AdminDashboard = () => {
  const { t } = useLanguage();
  const {
    user,
    bookings,
    workers,
    contractors,
    tickets,
    profiles,
    logout,
  } = useApp();

  const { customers: cmsCustomers = [] } = useCms();

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  const activeTab = tabParam || 'overview';

  const stats = useMemo(() => {
    const profileCustomersCount = (profiles || []).filter((person) => {
      const r = String(person.role || '').trim().toLowerCase();
      return r === 'customer' || r === 'user' || r === 'client' || (!r && person.email);
    }).length;

    const customersCount = Math.max(profileCustomersCount, (cmsCustomers || []).length);
    const workersCount = (workers || []).filter((worker) => !worker.isContractor).length;
    const contractorsCount = (contractors || []).length;
    const pendingBookings = (bookings || []).filter((booking) => booking.status === 'New Request').length;
    const completedBookings = (bookings || []).filter((booking) => booking.status === 'Completed').length;

    return [
      { label: t('customers', 'Customers'), value: customersCount, icon: Users, tone: 'bg-sky-100 text-sky-700' },
      { label: t('workers', 'Workers'), value: workersCount, icon: Briefcase, tone: 'bg-amber-100 text-amber-700' },
      { label: t('bookings', 'Bookings'), value: (bookings || []).length, icon: FileText, tone: 'bg-slate-100 text-slate-700' },
      { label: t('active', 'Active'), value: pendingBookings, icon: Clock, tone: 'bg-blue-100 text-blue-700' },
      { label: t('statusCompleted', 'Completed'), value: completedBookings, icon: CheckCircle, tone: 'bg-emerald-100 text-emerald-700' },
      { label: t('support', 'Support'), value: (tickets || []).length, icon: MessageCircle, tone: 'bg-violet-100 text-violet-700' },
    ];
  }, [bookings, cmsCustomers, profiles, tickets, workers, t]);

  const recentActivity = useMemo(() => {
    return [...(bookings || [])]
      .sort((a, b) => new Date(b.created_at || b.booking_date || b.preferred_date || 0) - new Date(a.created_at || a.booking_date || a.preferred_date || 0))
      .slice(0, 5);
  }, [bookings]);

  const handleTabChange = (nextTab) => {
    navigate(`${location.pathname}?tab=${nextTab}`);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'bookings':
        return <BookingManagementPanel />;
      case 'users':
        return <UserManagementPanel />;
      case 'workers':
        return <WorkersPanel />;
      case 'contractors':
        return <DashboardOverview stats={stats} recentActivity={recentActivity} />;
      case 'services':
      case 'coverage':
      case 'areas':
        return <ServicesPanel />;
      case 'categories':
        return <CategoriesPanel />;
      case 'coverage-requests':
        return <CoverageRequestsPanel />;
      case 'pricing':
        return <PricingPanel />;
      case 'banners':
        return <BannersPanel />;
      case 'coupons':
        return <CouponsPanel />;
      case 'offers':
        return <OffersPanel />;
      case 'notifications':
        return <NotificationsPanel />;
      case 'faqs':
        return <FaqsPanel />;
      case 'reviews':
        return <ReviewsPanel />;
      case 'payments':
        return <PaymentsPanel />;
      case 'revenue':
        return <RevenuePanel />;
      case 'tickets':
        return <TicketsPanel />;
      case 'reports':
        return <ReportsPanel />;
      case 'settings':
        return <SettingsPanel />;
      case 'overview':
      default:
        return <DashboardOverview stats={stats} recentActivity={recentActivity} />;
    }
  };

  return (
    <AdminShell user={user} activeTab={activeTab} onTabChange={handleTabChange} onLogout={logout}>
      <Suspense fallback={<PanelLoader />}>
        {renderContent()}
      </Suspense>
    </AdminShell>
  );
};

export default AdminDashboard;
