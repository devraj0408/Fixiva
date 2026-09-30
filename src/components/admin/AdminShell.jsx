import { useNavigate } from 'react-router-dom';
import { scrollToFeatureContent } from '../ScrollToTop';
import { useLanguage } from '../../context/LanguageContext';
import {
  BarChart3,
  Briefcase,
  FileText,
  MessageCircle,
  Settings,
  Users,
  LogOut,
  IndianRupee,
  Tag,
  Ticket,
  Bell,
  TrendingUp,
  Layers,
  Image,
  HelpCircle,
  Star,
} from 'lucide-react';

const navItems = [
  { id: 'overview', key: 'overview', label: 'Dashboard', icon: BarChart3 },
  { id: 'services', key: 'servicesManagement', label: 'Services Catalog', icon: Briefcase },
  { id: 'categories', key: 'categories', label: 'Categories', icon: Layers },
  { id: 'coverage-requests', key: 'coverageRequests', label: 'Coverage Requests', icon: TrendingUp },
  { id: 'pricing', key: 'transparentTariffs', label: 'Pricing Rules', icon: Tag },
  { id: 'banners', key: 'banners', label: 'Banners', icon: Image },
  { id: 'coupons', key: 'coupons', label: 'Coupons', icon: Ticket },
  { id: 'offers', key: 'offers', label: 'Promotional Offers', icon: Tag },
  { id: 'notifications', key: 'notificationsAlerts', label: 'Broadcast Alerts', icon: Bell },
  { id: 'faqs', key: 'faqs', label: 'Help FAQs', icon: HelpCircle },
  { id: 'users', key: 'customerAccounts', label: 'Customer Accounts', icon: Users },
  { id: 'workers', key: 'workerSpecialists', label: 'Worker Specialists', icon: Briefcase },
  { id: 'reviews', key: 'reviewsModeration', label: 'Reviews Moderation', icon: Star },
  { id: 'bookings', key: 'bookingsManagement', label: 'Bookings', icon: FileText },
  { id: 'payments', key: 'paymentsRefunds', label: 'Payments & Refunds', icon: IndianRupee },
  { id: 'revenue', key: 'revenueAnalytics', label: 'Revenue', icon: IndianRupee },
  { id: 'tickets', key: 'supportTickets', label: 'Support', icon: MessageCircle },
  { id: 'reports', key: 'systemReports', label: 'Reports', icon: TrendingUp },
  { id: 'settings', key: 'systemSettings', label: 'Settings', icon: Settings },
];

const AdminShell = ({ user, activeTab, onTabChange, onLogout, children }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-3 space-y-4">
          <div className="rounded-3xl bg-[#171918] p-5 text-white shadow-sm">
            <div className="flex items-center gap-3">
              {user?.profile_photo_url ? (
                <img
                  src={user.profile_photo_url}
                  alt={user?.name || 'Admin'}
                  className="h-12 w-12 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sm font-black uppercase">
                  {(user?.name || 'A').charAt(0)}
                </div>
              )}
              <div>
                <p className="text-sm font-black">{user?.name || 'Operations Desk'}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  {t('adminControlPlane', 'Admin Panel')}
                </p>
              </div>
            </div>
          </div>

          <nav className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm space-y-1">
            {navItems.map(({ id, key, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    onTabChange(id);
                    scrollToFeatureContent();
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-xs font-bold transition-all ${
                    isActive ? 'bg-[#2F6B5F] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} />
                  <span>{t(key, label)}</span>
                </button>
              );
            })}
          </nav>

          <button
            onClick={() => {
              onLogout();
              navigate('/login');
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-600 shadow-sm hover:bg-red-50 hover:text-danger hover:border-red-100 transition-all cursor-pointer"
          >
            <LogOut size={16} /> {t('logout', 'Logout')}
          </button>
        </aside>

        <main id="admin-panel-content" className="lg:col-span-9 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[600px]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
