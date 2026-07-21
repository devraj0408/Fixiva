import { useMemo } from 'react';
import { useApp } from '../../context/AuthContext';

const RevenuePanel = () => {
  const { bookings } = useApp();

  const summary = useMemo(() => {
    const activeBookings = (bookings || []).filter((booking) => booking.status !== 'Cancelled');
    const revenue = activeBookings.reduce((sum, booking) => sum + Number(booking.price || 0) + Number(booking.platform_fee || 0), 0);
    const commission = activeBookings.reduce((sum, booking) => sum + Number(booking.platform_fee || 0), 0);
    return { revenue, commission, bookings: activeBookings.length };
  }, [bookings]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Revenue Overview</h2>
          <p className="text-sm text-slate-500">A simple financial snapshot for the platform.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bookings</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{summary.bookings}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Gross Revenue</p>
          <p className="mt-2 text-2xl font-black text-slate-900">₹{summary.revenue}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Platform Commission</p>
          <p className="mt-2 text-2xl font-black text-slate-900">₹{summary.commission}</p>
        </div>
      </div>
    </div>
  );
};

export default RevenuePanel;
