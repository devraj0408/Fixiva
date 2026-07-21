import { Briefcase, CheckCircle, Clock, FileText, MessageCircle, ShieldCheck, Users } from 'lucide-react';

const iconMap = {
  Briefcase,
  CheckCircle,
  Clock,
  FileText,
  MessageCircle,
  ShieldCheck,
  Users,
};

const DashboardOverview = ({ stats, recentActivity }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Operations Overview</h2>
          <p className="text-sm text-slate-500">A simple view of platform activity and open work.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = typeof stat.icon === 'string' ? iconMap[stat.icon] || Users : stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{stat.value}</p>
                </div>
                <div className={`rounded-2xl p-2 ${stat.tone}`}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Recent Activity</h3>
          <div className="mt-4 space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500">No recent activity yet.</p>
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="text-sm font-bold text-slate-800">{item.service_name || 'Service request'}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.customer_name || 'Customer'} • {item.status}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Open Work</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-bold text-slate-800">Pending bookings</p>
              <p className="text-xs text-slate-500">Review new requests and assign workers quickly.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-bold text-slate-800">Pending verifications</p>
              <p className="text-xs text-slate-500">Approve workers and contractors without extra steps.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
