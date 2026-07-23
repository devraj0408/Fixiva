import { useState } from 'react';
import { useCms } from '../../context/CmsContext';


const ContractorsPanel = () => {
  const { contractors, updateContractorStatus, filterItems, paginateItems } = useCms();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);

  const filtered = filterItems(contractors, search, ['company', 'owner_name', 'email', 'gst', 'city']).filter((c) => {
    if (statusFilter === 'All') return true;
    return (c.status || 'Approved').toLowerCase() === statusFilter.toLowerCase();
  });

  const paginated = paginateItems(filtered, page, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Contractor Partners Management</h2>
          <p className="text-sm text-slate-500">Review company credentials, GST verification, and contractor approvals.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search contractors by company name, GST, or email..."
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white"
        >
          <option value="All">All Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Pending Approval">Pending Approval</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {paginated.data.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No contractor accounts matching filter.</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="px-4 py-3">Company / Owner</th>
                <th className="px-4 py-3">GST Number</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.data.map((contractor) => (
                <tr key={contractor.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{contractor.company || 'Business Entity'}</p>
                    <p className="text-xs text-slate-500">Owner: {contractor.owner_name || contractor.name || 'Owner'}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{contractor.gst || 'Pending Submission'}</td>
                  <td className="px-4 py-3 text-slate-600">{contractor.city || 'Ranchi'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${contractor.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : contractor.status === 'Suspended' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                      {contractor.status || 'Approved'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={contractor.status || 'Approved'}
                      onChange={(e) => updateContractorStatus(contractor.id, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold"
                    >
                      <option value="Approved">Approved</option>
                      <option value="Pending Approval">Pending</option>
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
          <span className="text-xs text-slate-500 font-semibold">Page {paginated.currentPage} of {paginated.totalPages} ({paginated.total} contractors)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Previous</button>
            <button disabled={page >= paginated.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorsPanel;
