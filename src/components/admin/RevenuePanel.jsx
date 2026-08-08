import { useMemo } from 'react';
import { useCms } from '../../context/CmsContext';

const RevenuePanel = () => {
  const { bookings } = useCms();

  const metrics = useMemo(() => {
    const totalVolume = bookings.reduce((sum, b) => sum + Number(b.total_price || b.price || 0), 0);
    const platformEarnings = bookings.reduce((sum, b) => sum + Number(b.platform_fee || 49), 0);
    const completedCount = bookings.filter((b) => b.status === 'Completed').length;
    const cancelledCount = bookings.filter((b) => b.status === 'Cancelled').length;
    const avgOrderValue = bookings.length > 0 ? Math.round(totalVolume / bookings.length) : 0;

    return {
      totalVolume,
      platformEarnings,
      completedCount,
      cancelledCount,
      avgOrderValue,
    };
  }, [bookings]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Revenue & Platform Earnings Analytics</h2>
          <p className="text-sm text-slate-500">Live operational financial volume generated from production bookings.</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-emerald-50/50 p-5 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Total Booking Volume</p>
          <p className="text-3xl font-black text-slate-900">₹{metrics.totalVolume}</p>
          <p className="text-xs text-slate-500 font-medium">Gross Customer Payouts</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-sky-50/50 p-5 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-600">Platform Commission Earnings</p>
          <p className="text-3xl font-black text-slate-900">₹{metrics.platformEarnings}</p>
          <p className="text-xs text-slate-500 font-medium">Net Convenience Revenue</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-amber-50/50 p-5 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Average Order Value</p>
          <p className="text-3xl font-black text-slate-900">₹{metrics.avgOrderValue}</p>
          <p className="text-xs text-slate-500 font-medium">Per Service Booking</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Order Completion Rate</p>
          <p className="text-3xl font-black text-slate-900">
            {bookings.length > 0 ? Math.round((metrics.completedCount / bookings.length) * 100) : 100}%
          </p>
          <p className="text-xs text-slate-500 font-medium">{metrics.completedCount} Completed / {metrics.cancelledCount} Cancelled</p>
        </div>
      </div>
    </div>
  );
};

export default RevenuePanel;
