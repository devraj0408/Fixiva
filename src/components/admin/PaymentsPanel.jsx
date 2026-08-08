import { useState } from 'react';
import { useCms } from '../../context/CmsContext';


const PaymentsPanel = () => {
  const { payments, updatePaymentStatus, filterItems, paginateItems } = useCms();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);

  const filtered = filterItems(payments, search, ['transaction_id', 'booking_id', 'customer_name', 'service_name']).filter((p) => {
    if (statusFilter === 'All') return true;
    return (p.status || 'Pending').toLowerCase() === statusFilter.toLowerCase();
  });

  const paginated = paginateItems(filtered, page, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Payments & Financial Ledger</h2>
          <p className="text-sm text-slate-500">Monitor booking transactions, payment methods, and process customer refunds.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search payments by Transaction ID, Booking ID, or Customer..."
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white"
        >
          <option value="All">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
          <option value="Refunded">Refunded</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {paginated.data.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No payment transactions found matching filter.</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">Booking ID</th>
                <th className="px-4 py-3">Customer & Service</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.data.map((txn) => (
                <tr key={txn.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono font-extrabold text-slate-900">{txn.transaction_id || `TXN_${txn.id.slice(0, 8)}`}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-600">#{txn.booking_id}</td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">{txn.customer_name || 'Customer'}</p>
                    <p className="text-xs text-slate-500">{txn.service_name || 'Home Service'}</p>
                  </td>
                  <td className="px-4 py-3 font-black text-slate-900">₹{txn.amount || 0}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-600">{txn.payment_method || 'Cash on Service'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${txn.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : txn.status === 'Refunded' ? 'bg-amber-50 text-amber-700' : txn.status === 'Failed' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                      {txn.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={txn.status || 'Pending'}
                      onChange={(e) => updatePaymentStatus(txn.id, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {paginated.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 font-semibold">Page {paginated.currentPage} of {paginated.totalPages} ({paginated.total} transactions)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Previous</button>
            <button disabled={page >= paginated.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPanel;
