import { useMemo, useState } from 'react';
import { useApp } from '../../context/AuthContext';

const BookingManagementPanel = () => {
  const { bookings, workers, updateBookingStatus, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredBookings = useMemo(() => {
    return (bookings || []).filter((booking) => {
      const matchesSearch = [booking.customer_name, booking.service_name, booking.city]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || booking.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  const changeStatus = async (id, nextStatus) => {
    await updateBookingStatus(id, nextStatus);
    showToast('Booking status updated.', 'success');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Booking Management</h2>
          <p className="text-sm text-slate-500">Track bookings, update status, and assign workers quickly.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer, service, city"
          className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
        >
          <option value="All">All statuses</option>
          <option value="New Request">New Request</option>
          <option value="Assigned">Assigned</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        {filteredBookings.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No bookings match this view.</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{booking.customer_name || 'Customer'}</p>
                    <p className="text-xs text-slate-500">{booking.city || '-'}</p>
                  </td>
                  <td className="px-4 py-3">{booking.service_name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">{booking.status}</span>
                  </td>
                  <td className="px-4 py-3">{booking.worker_name || 'Unassigned'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={booking.status}
                      onChange={(e) => changeStatus(booking.id, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                    >
                      <option value="New Request">New Request</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BookingManagementPanel;
