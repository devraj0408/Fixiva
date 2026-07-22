import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { Users, Shield, Lock } from 'lucide-react';

const UserManagementPanel = () => {
  const { customers, updateCustomerStatus, filterItems, paginateItems } = useCms();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);

  const filtered = filterItems(customers, search, ['name', 'email', 'phone', 'city']).filter((c) => {
    if (statusFilter === 'All') return true;
    return (c.account_status || 'active').toLowerCase() === statusFilter.toLowerCase();
  });

  const paginated = paginateItems(filtered, page, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Customer Accounts Management</h2>
          <p className="text-sm text-slate-500">Monitor registered customer profiles, contact info, and account access status.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search customers by name, email, phone, or city..."
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white"
        >
          <option value="All">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {paginated.data.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No customer accounts matching filter.</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.data.map((person) => (
                <tr key={person.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-bold text-slate-900">{person.name || 'Customer Profile'}</td>
                  <td className="px-4 py-3 text-slate-600">{person.email || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{person.phone || '-'}</td>
                  <td className="px-4 py-3 text-slate-700 font-semibold">{person.city || 'Ranchi'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase ${person.account_status === 'suspended' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {person.account_status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => updateCustomerStatus(person.id, person.account_status === 'suspended' ? 'active' : 'suspended')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${person.account_status === 'suspended' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                    >
                      {person.account_status === 'suspended' ? 'Activate Account' : 'Suspend Account'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {paginated.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 font-semibold">Page {paginated.currentPage} of {paginated.totalPages} ({paginated.total} accounts)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Previous</button>
            <button disabled={page >= paginated.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPanel;
