import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, CheckCircle, Clock, FileText, MessageCircle, ShieldCheck, Users } from 'lucide-react';
import { useApp } from '../../context/AuthContext';
import AdminShell from '../../components/admin/AdminShell';
import DashboardOverview from '../../components/admin/DashboardOverview';
import BookingManagementPanel from '../../components/admin/BookingManagementPanel';
import UserManagementPanel from '../../components/admin/UserManagementPanel';
import VerificationPanel from '../../components/admin/VerificationPanel';
import ServicesPanel from '../../components/admin/ServicesPanel';
import CoveragePanel from '../../components/admin/CoveragePanel';
import TicketsPanel from '../../components/admin/TicketsPanel';
import RevenuePanel from '../../components/admin/RevenuePanel';
import SettingsPanel from '../../components/admin/SettingsPanel';

const AdminDashboard = () => {
  const {
    user,
    bookings,
    workers,
    contractors,
    tickets,
    profiles,
    logout,
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  const activeTab = tabParam || 'overview';

  const stats = useMemo(() => {
    const customers = (profiles || []).filter((person) => person.role === 'customer').length;
    const workersCount = (workers || []).filter((worker) => !worker.isContractor).length;
    const contractorsCount = (contractors || []).length;
    const pendingBookings = (bookings || []).filter((booking) => booking.status === 'New Request').length;
    const completedBookings = (bookings || []).filter((booking) => booking.status === 'Completed').length;
    const pendingWorkerVerification = (workers || []).filter((worker) => worker.status === 'Pending Verification' && !worker.isContractor).length;

    return [
      { label: 'Customers', value: customers, icon: Users, tone: 'bg-sky-100 text-sky-700' },
      { label: 'Workers', value: workersCount, icon: Briefcase, tone: 'bg-amber-100 text-amber-700' },
      { label: 'Contractors', value: contractorsCount, icon: ShieldCheck, tone: 'bg-emerald-100 text-emerald-700' },
      { label: 'Bookings', value: (bookings || []).length, icon: FileText, tone: 'bg-slate-100 text-slate-700' },
      { label: 'Active', value: pendingBookings, icon: Clock, tone: 'bg-blue-100 text-blue-700' },
      { label: 'Completed', value: completedBookings, icon: CheckCircle, tone: 'bg-emerald-100 text-emerald-700' },
      { label: 'Pending Verification', value: pendingWorkerVerification, icon: ShieldCheck, tone: 'bg-orange-100 text-orange-700' },
      { label: 'Support', value: (tickets || []).length, icon: MessageCircle, tone: 'bg-violet-100 text-violet-700' },
    ];
  }, [bookings, contractors, profiles, tickets, workers]);

  const recentActivity = useMemo(() => {
    return [...(bookings || [])]
      .sort((a, b) => new Date(b.booking_date || b.preferred_date || 0) - new Date(a.booking_date || a.preferred_date || 0))
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
      case 'verification':
        return <VerificationPanel />;
      case 'services':
        return <ServicesPanel />;
      case 'coverage':
        return <CoveragePanel />;
      case 'tickets':
        return <TicketsPanel />;
      case 'revenue':
        return <RevenuePanel />;
      case 'settings':
        return <SettingsPanel />;
      case 'overview':
      default:
        return <DashboardOverview stats={stats} recentActivity={recentActivity} />;
    }
  };

  return (
    <AdminShell user={user} activeTab={activeTab} onTabChange={handleTabChange} onLogout={logout}>
      {renderContent()}
    </AdminShell>
  );
};

export default AdminDashboard;
