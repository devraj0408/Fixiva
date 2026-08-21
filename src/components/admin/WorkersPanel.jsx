import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { useApp } from '../../context/AuthContext';
import { Info, X, ShieldCheck, CheckCircle2, AlertTriangle, Award, Star } from 'lucide-react';
import { calculateWorkerTrustScore } from '../../services/trustScoreService';

const WorkersPanel = () => {
  const { workers, bookings, reviews, tickets, filterItems, paginateItems } = useCms();
  const { updateWorkerStatus } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedWorkerDetails, setSelectedWorkerDetails] = useState(null);

  const filtered = filterItems(workers, search, ['name', 'email', 'phone', 'city', 'skills']).filter((w) => {
    if (statusFilter === 'All') return true;
    return (w.status || 'Active').toLowerCase() === statusFilter.toLowerCase();
  });

  const paginated = paginateItems(filtered, page, 8);

  const getTierBadge = (score) => {
    if (score >= 90) return { label: 'Excellent', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (score >= 75) return { label: 'Very Good', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (score >= 60) return { label: 'Good', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
    if (score >= 40) return { label: 'Average', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Needs Improvement', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Workers & Service Specialists</h2>
          <p className="text-sm text-slate-500">Manage onboarded worker profiles, dynamic trust scores, and operational performance.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search workers by name, email, skills, or city..."
          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium focus:outline-none focus:border-primary"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
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
              {paginated.data.map((worker) => {
                const details = worker.trustScoreDetails || calculateWorkerTrustScore(worker, bookings, reviews, tickets);
                const score = details.score ?? worker.trustScore ?? 50;
                const tier = getTierBadge(score);

                return (
                  <tr key={worker.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{worker.name}</p>
                      <p className="text-xs text-slate-500">{worker.skills || 'General Service'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <p>{worker.email || '-'}</p>
                      <p>{worker.phone || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-semibold">{worker.city || 'Ranchi'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedWorkerDetails({ worker, details })}
                        className="group flex items-center gap-2 rounded-xl px-2.5 py-1 hover:bg-slate-100 transition-all text-left cursor-pointer"
                        title="Click to view detailed Trust Score breakdown"
                      >
                        <span className="font-black text-amber-600">★ {score} / 100</span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${tier.bg}`}>
                          {tier.label}
                        </span>
                        <Info size={13} className="text-slate-400 group-hover:text-primary transition-colors" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${worker.status === 'Suspended' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {worker.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => setSelectedWorkerDetails({ worker, details })}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold hover:bg-slate-100 transition-colors"
                      >
                        Score Info
                      </button>
                      <select
                        value={worker.status || 'Active'}
                        onChange={(e) => updateWorkerStatus(worker.id, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold cursor-pointer"
                      >
                        <option value="Active">Active</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {paginated.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 font-semibold">Page {paginated.currentPage} of {paginated.totalPages} ({paginated.total} workers)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50 hover:bg-slate-50">Previous</button>
            <button disabled={page >= paginated.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50 hover:bg-slate-50">Next</button>
          </div>
        </div>
      )}

      {/* Trust Score Breakdown Modal */}
      {selectedWorkerDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-primary" size={20} />
                  <h3 className="text-lg font-black text-slate-900">Worker Trust Score Breakdown</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{selectedWorkerDetails.worker.name} ({selectedWorkerDetails.worker.email || 'No email'})</p>
              </div>
              <button
                onClick={() => setSelectedWorkerDetails(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Score Banner */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 flex items-center justify-between shadow-md">
              <div>
                <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Canonical Score</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-amber-400">★ {selectedWorkerDetails.details.score}</span>
                  <span className="text-sm text-slate-300 font-semibold">/ 100</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Rating: {selectedWorkerDetails.details.avgRating} ★ ({selectedWorkerDetails.details.reviewCount} reviews) • {selectedWorkerDetails.details.completedJobsCount} jobs completed</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${selectedWorkerDetails.details.badgeBg}`}>
                  {selectedWorkerDetails.details.tier}
                </span>
              </div>
            </div>

            {/* Positive Component Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" /> Positive Factors (Max 100)
              </h4>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 text-xs font-medium text-slate-700 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span>Profile Verification</span>
                  <span className="font-extrabold text-slate-900">{selectedWorkerDetails.details.breakdown.profileVerif} / 20</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(selectedWorkerDetails.details.breakdown.profileVerif / 20) * 100}%` }}></div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span>Contact Verification</span>
                  <span className="font-extrabold text-slate-900">{selectedWorkerDetails.details.breakdown.contactVerif} / 10</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(selectedWorkerDetails.details.breakdown.contactVerif / 10) * 100}%` }}></div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span>Completed Jobs History</span>
                  <span className="font-extrabold text-slate-900">{selectedWorkerDetails.details.breakdown.completedJobs} / 20</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(selectedWorkerDetails.details.breakdown.completedJobs / 20) * 100}%` }}></div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span>Customer Rating Score</span>
                  <span className="font-extrabold text-slate-900">{selectedWorkerDetails.details.breakdown.customerRating} / 20</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(selectedWorkerDetails.details.breakdown.customerRating / 20) * 100}%` }}></div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span>On-Time Completion</span>
                  <span className="font-extrabold text-slate-900">{selectedWorkerDetails.details.breakdown.onTime} / 10</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full" style={{ width: `${(selectedWorkerDetails.details.breakdown.onTime / 10) * 100}%` }}></div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span>Reliability & Acceptance</span>
                  <span className="font-extrabold text-slate-900">{selectedWorkerDetails.details.breakdown.reliability} / 10</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(selectedWorkerDetails.details.breakdown.reliability / 10) * 100}%` }}></div>
                </div>

                {selectedWorkerDetails.details.breakdown.bonus > 0 && (
                  <div className="flex items-center justify-between pt-1 text-emerald-700 font-bold">
                    <span className="flex items-center gap-1"><Award size={13} /> Performance Bonus</span>
                    <span>+{selectedWorkerDetails.details.breakdown.bonus} pts</span>
                  </div>
                )}
              </div>
            </div>

            {/* Deductions Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-500" /> Negative Deductions
              </h4>

              {selectedWorkerDetails.details.deductions.length === 0 ? (
                <div className="bg-emerald-50/60 rounded-2xl p-3 text-xs text-emerald-700 font-semibold border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 size={15} /> No penalty deductions recorded for this worker profile.
                </div>
              ) : (
                <div className="bg-rose-50/60 rounded-2xl p-3.5 space-y-2 text-xs border border-rose-100">
                  {selectedWorkerDetails.details.deductions.map((ded, idx) => (
                    <div key={idx} className="flex items-center justify-between font-bold text-rose-700">
                      <span>• {ded.type} ({ded.count} {ded.count === 1 ? 'event' : 'events'})</span>
                      <span>-{ded.points} pts</span>
                    </div>
                  ))}
                  <div className="border-t border-rose-200 pt-2 flex items-center justify-between font-black text-rose-900">
                    <span>Total Deductions</span>
                    <span>-{selectedWorkerDetails.details.netDeductions} pts</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-center">
              <button
                onClick={() => setSelectedWorkerDetails(null)}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkersPanel;
