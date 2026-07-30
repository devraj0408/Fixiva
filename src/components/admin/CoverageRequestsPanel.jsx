import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, CheckCircle, XCircle, MapPin, Eye, Sparkles } from 'lucide-react';
import { getCoverageRequests, updateCoverageRequestStatus } from '../../services/coverageService';
import { useToast } from '../../context/ToastContext';

const CoverageRequestsPanel = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [selectedDetailRequest, setSelectedDetailRequest] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const res = await getCoverageRequests();
    if (res.data) {
      setRequests(res.data);
    } else {
      showToast('Failed to load coverage requests', 'error');
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchRequests();
    });
  }, [fetchRequests]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchSearch =
        (r.district || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.locality || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.phone || '').includes(search) ||
        (r.service_name || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requests, search, statusFilter]);

  const handleAction = async (id, status) => {
    const res = await updateCoverageRequestStatus(id, status);
    if (res.data || !res.error) {
      showToast(`Request set to ${status}. District coverage updated!`, 'success');
      fetchRequests();
    } else {
      showToast(res.error || 'Failed to update request status', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">Marketplace Expansion</span>
          <h2 className="text-2xl font-black text-slate-900">Coverage Requests Workflow</h2>
          <p className="text-xs text-slate-500">Review customer expansion requests and approve new district coverage areas.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 w-full sm:w-80">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search service, locality, or phone..."
            className="w-full bg-transparent border-0 outline-none text-xs font-semibold text-slate-800 placeholder-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">Filter Status:</span>
          <select
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-primary bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Requests</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-500">Loading coverage requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-slate-500">No coverage requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Requested Service</th>
                  <th className="py-3.5 px-4">State, District & Locality</th>
                  <th className="py-3.5 px-4">Customer Info</th>
                  <th className="py-3.5 px-4 text-center">Requests Count</th>
                  <th className="py-3.5 px-4 text-center">Date</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredRequests.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Sparkles size={14} />
                        </div>
                        <span className="font-extrabold text-slate-900">{r.service_name || 'Home Services'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-primary shrink-0" />
                        <div>
                          <span className="font-extrabold text-slate-900 block">{r.locality}, {r.district}</span>
                          <span className="text-[11px] text-slate-400">{r.state} {r.pincode ? `• ${r.pincode}` : ''}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{r.customer_name || 'Customer'}</span>
                      <span className="text-[11px] text-slate-500">{r.phone}</span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-extrabold text-[11px]">
                        {r.request_count || 1} Request(s)
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center text-slate-500 text-[11px]">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        r.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        r.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {r.status || 'Pending'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleAction(r.id, 'Approved')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition-all flex items-center gap-1"
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                            <button
                              onClick={() => handleAction(r.id, 'Rejected')}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] transition-all flex items-center gap-1"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedDetailRequest(r)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-primary text-slate-600 hover:text-primary transition-all"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedDetailRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Coverage Request Details</h3>
              <button onClick={() => setSelectedDetailRequest(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex justify-between"><span className="text-slate-500 font-bold">Service</span><span className="font-extrabold text-slate-900">{selectedDetailRequest.service_name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-bold">State</span><span className="font-bold text-slate-900">{selectedDetailRequest.state}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-bold">District</span><span className="font-bold text-slate-900">{selectedDetailRequest.district}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-bold">Locality</span><span className="font-bold text-slate-900">{selectedDetailRequest.locality}</span></div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex justify-between"><span className="text-slate-500 font-bold">Customer Name</span><span className="font-bold text-slate-900">{selectedDetailRequest.customer_name || 'Customer'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-bold">Mobile Phone</span><span className="font-bold text-slate-900">{selectedDetailRequest.phone}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-bold">Total Request Count</span><span className="font-bold text-indigo-600">{selectedDetailRequest.request_count || 1}</span></div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setSelectedDetailRequest(null)} className="btn-primary text-xs px-5 py-2 rounded-xl font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverageRequestsPanel;
