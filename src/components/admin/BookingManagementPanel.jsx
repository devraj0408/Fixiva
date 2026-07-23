import { useState } from 'react';
import { useCms } from '../../context/CmsContext';

const BookingManagementPanel = () => {
  const {
    bookings,
    workers,
    updateBookingStatus,
    assignWorkerToBooking,
    filterItems,
    paginateItems,
  } = useCms();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);

  const filtered = filterItems(bookings, search, ['id', 'customer_name', 'service_name', 'worker_name', 'city']).filter((b) => {
    if (statusFilter === 'All') return true;
    return (b.status || 'New Request').toLowerCase() === statusFilter.toLowerCase();
  });

  const paginated = paginateItems(filtered, page, 8);
  const verifiedWorkers = workers.filter((w) => w.status === 'Verified' || w.status === 'Live');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Booking Operations & Dispatch Desk</h2>
          <p className="text-sm text-slate-500">Monitor live customer service bookings, assign specialists, and update order lifecycles.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by Booking ID, Customer, Specialist, or City..."
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white"
        >
          <option value="All">All Statuses</option>
          <option value="New Request">New Request / Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Refunded">Refunded</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {paginated.data.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No booking requests matching filter.</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="px-4 py-3">Booking Details</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Assigned Specialist</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.data.map((booking) => (
                <tr key={booking.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-extrabold text-slate-900">#{booking.id.slice(0, 10)}</p>
                    <p className="text-xs text-slate-500">{booking.service_name || 'Home Service'} • {booking.city || 'Ranchi'}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p className="font-bold text-slate-800">{booking.customer_name || 'Customer'}</p>
                    <p className="text-slate-500">{booking.customer_phone || '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {booking.worker_name ? (
                      <p className="font-bold text-slate-800">{booking.worker_name}</p>
                    ) : (
                      <select
                        onChange={(e) => {
                          const w = verifiedWorkers.find((item) => String(item.id) === String(e.target.value));
                          if (w) assignWorkerToBooking(booking.id, w);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-primary"
                      >
                        <option value="">Assign Specialist</option>
                        {verifiedWorkers.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({w.city || 'Ranchi'})
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 font-black text-slate-900">₹{booking.total_price || booking.price || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${booking.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : booking.status === 'Cancelled' ? 'bg-red-50 text-red-700' : booking.status === 'Assigned' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                      {booking.status || 'New Request'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={booking.status || 'New Request'}
                      onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold"
                    >
                      <option value="New Request">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
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
          <span className="text-xs text-slate-500 font-semibold">Page {paginated.currentPage} of {paginated.totalPages} ({paginated.total} bookings)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Previous</button>
            <button disabled={page >= paginated.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagementPanel;
