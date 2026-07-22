import { useMemo, useState } from 'react';
import { useApp } from '../../context/AuthContext';

const CoveragePanel = () => {
  const { coverageRequests, updateCoverageRequestStatus } = useApp();
  const [search, setSearch] = useState('');

  const filteredRequests = useMemo(() => {
    return (coverageRequests || []).filter((request) => {
      const text = `${request.city || ''} ${request.state || ''} ${request.email || ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [coverageRequests, search]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Coverage Requests</h2>
          <p className="text-sm text-slate-500">Review city coverage requests and keep the expansion pipeline organized.</p>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search city or email"
        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No coverage requests at the moment.</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-800">{request.city || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{request.state || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{request.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">{request.status || 'Pending'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => updateCoverageRequestStatus(request.id, 'Available')} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">Mark Available</button>
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

export default CoveragePanel;
