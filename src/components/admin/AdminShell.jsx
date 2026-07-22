import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  FileText,
  MapPin,
  MessageCircle,
  Settings,
  ShieldCheck,
  Users,
  LogOut,
  IndianRupee,
  Tag,
  Ticket,
  Bell,
  TrendingUp,
  Layers,
  Map,
  Image,
  HelpCircle,
  Star,
  Building,
} from 'lucide-react';

const navItems = [
  { id: 'overview', label: 'Dashboard', icon: BarChart3 },
  { id: 'services', label: 'Services Catalog', icon: Briefcase },
  { id: 'categories', label: 'Categories', icon: Layers },
  { id: 'coverage', label: 'Cities & Coverage', icon: MapPin },
  { id: 'areas', label: 'Area Localities', icon: Map },
  { id: 'pricing', label: 'Pricing Rules', icon: Tag },
  { id: 'banners', label: 'Banners', icon: Image },
  { id: 'coupons', label: 'Coupons', icon: Ticket },
  { id: 'offers', label: 'Promotional Offers', icon: Tag },
  { id: 'notifications', label: 'Broadcast Alerts', icon: Bell },
  { id: 'faqs', label: 'Help FAQs', icon: HelpCircle },
  { id: 'users', label: 'Customer Accounts', icon: Users },
  { id: 'workers', label: 'Worker Specialists', icon: Briefcase },
  { id: 'verification', label: 'Worker Verification', icon: ShieldCheck },
  { id: 'contractors', label: 'Contractors', icon: Building },
  { id: 'reviews', label: 'Reviews Moderation', icon: Star },
  { id: 'bookings', label: 'Bookings', icon: FileText },
  { id: 'payments', label: 'Payments & Refunds', icon: IndianRupee },
  { id: 'revenue', label: 'Revenue', icon: IndianRupee },
  { id: 'tickets', label: 'Support', icon: MessageCircle },
  { id: 'reports', label: 'Reports', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const AdminShell = ({ user, activeTab, onTabChange, onLogout, children }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-3 space-y-4">
          <div className="rounded-3xl bg-slate-900 p-5 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sm font-black uppercase">
                {(user?.name || 'A').charAt(0)}
              </div>
              <div>
                <p className="text-sm font-black">{user?.name || 'Operations Desk'}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  Admin Panel
                </p>
              </div>
            </div>
          </div>

          <nav className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => onTabChange(id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-xs font-bold transition-all ${
                    isActive ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          <button
            onClick={() => {
              onLogout();
              navigate('/login');
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-600 shadow-sm hover:bg-red-50 hover:text-danger hover:border-red-100 transition-all"
          >
            <LogOut size={16} /> Logout
          </button>
        </aside>

        <main className="lg:col-span-9 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[600px]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
