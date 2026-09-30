import { useMemo } from 'react';
import { useCms } from '../../context/CmsContext';

const RevenuePanel = () => {
  const { bookings } = useCms();

  const metrics = useMemo(() => {
    const customerPaidTotal = bookings
      .filter((b) => b.payment_status === 'PAID' || b.payment_status === 'Paid')
      .reduce((sum, b) => sum + Number(b.price || 0), 0);
    const workerEarningsTotal = customerPaidTotal;
    const fixivaRevenue = bookings.reduce((sum, b) => sum + Number(b.platform_fee || 0), 0);
    const platformFee = 0;
    const completedCount = bookings.filter((b) => b.status === 'Completed').length;
    const cancelledCount = bookings.filter((b) => b.status === 'Cancelled').length;
    const avgOrderValue = bookings.length > 0 ? Math.round(bookings.reduce((s, b) => s + Number(b.price || 0), 0) / bookings.length) : 0;

    return {
      customerPaidTotal,
      workerEarningsTotal,
      fixivaRevenue,
      platformFee,
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
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Customer Paid (Collected)</p>
          <p className="text-3xl font-black text-slate-900">₹{metrics.customerPaidTotal}</p>
          <p className="text-xs text-slate-500 font-medium">Gross Cash Collected</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-indigo-50/50 p-5 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Worker Earnings</p>
          <p className="text-3xl font-black text-slate-900">₹{metrics.workerEarningsTotal}</p>
          <p className="text-xs text-slate-500 font-medium">100% Payout to Professionals</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-sky-50/50 p-5 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-600">FIXIVA Revenue</p>
          <p className="text-3xl font-black text-slate-900">₹{metrics.fixivaRevenue}</p>
          <p className="text-xs text-slate-500 font-medium">Net Platform Commission</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-amber-50/50 p-5 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Platform Fee</p>
          <p className="text-3xl font-black text-slate-900">₹{metrics.platformFee}</p>
          <p className="text-xs text-slate-500 font-medium">Convenience Fee Charged</p>
        </div>
      </div>
    </div>
  );
};

export default RevenuePanel;
