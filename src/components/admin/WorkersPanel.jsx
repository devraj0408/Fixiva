import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { Briefcase, ShieldCheck, Star } from 'lucide-react';

const WorkersPanel = () => {
  const { workers, updateWorkerVerification, filterItems, paginateItems } = useCms();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);

  const filtered = filterItems(workers, search, ['name', 'email', 'phone', 'city', 'skills']).filter((w) => {
    if (statusFilter === 'All') return true;
    return (w.status || 'Verified').toLowerCase() === statusFilter.toLowerCase();
  });

  const paginated = paginateItems(filtered, page, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Workers & Service Specialists</h2>
          <p className="text-sm text-slate-500">Manage onboarded worker profiles, trust scores, and operational cities.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search workers by name, email, skills, or city..."
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white"
        >
          <option value="All">All Statuses</option>
          <option value="Verified">Verified</option>
          <option value="Pending Verification">Pending Verification</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {paginated.data.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No worker profiles matching filter.</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="px-4 py-3">Worker Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Trust Score</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.data.map((worker) => (
                <tr key={worker.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{worker.name}</p>
                    <p className="text-xs text-slate-500">{worker.skills || 'General Service'}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <p>{worker.email || '-'}</p>
                    <p>{worker.phone || '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-semibold">{worker.city || 'Ranchi'}</td>
                  <td className="px-4 py-3 font-extrabold text-amber-600">
                    ★ {worker.trustScore ?? 100} / 100
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${worker.status === 'Verified' ? 'bg-emerald-50 text-emerald-700' : worker.status === 'Suspended' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                      {worker.status || 'Verified'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={worker.status || 'Verified'}
                      onChange={(e) => updateWorkerVerification(worker.id, e.target.value, worker.trustScore)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold"
                    >
                      <option value="Verified">Verified</option>
                      <option value="Pending Verification">Pending</option>
                      <option value="Suspended">Suspended</option>
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
          <span className="text-xs text-slate-500 font-semibold">Page {paginated.currentPage} of {paginated.totalPages} ({paginated.total} workers)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Previous</button>
            <button disabled={page >= paginated.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkersPanel;
