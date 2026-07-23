import { useState } from 'react';
import { useCms } from '../../context/CmsContext';
import { CheckCircle2, XCircle } from 'lucide-react';

const VerificationPanel = () => {
  const { workers, updateWorkerVerification, filterItems, paginateItems } = useCms();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const pendingWorkers = workers.filter((w) => w.status === 'Pending Verification' || w.status === 'Pending');
  const filtered = filterItems(pendingWorkers, search, ['name', 'email', 'phone', 'skills', 'city']);
  const paginated = paginateItems(filtered, page, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Worker Verification Desk</h2>
          <p className="text-sm text-slate-500">Review worker application credentials, ID proofs, and grant verification badges.</p>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search pending verification applications by name, email, or skills..."
        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium"
      />

      <div className="space-y-4">
        {paginated.data.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
            No pending worker verification requests at the moment. All service professionals verified!
          </div>
        ) : (
          paginated.data.map((worker) => (
            <div key={worker.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-base">{worker.name}</span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                    Pending Review
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">{worker.email} • {worker.phone} • {worker.city || 'Ranchi'}</p>
                <p className="text-xs text-slate-700 font-bold mt-1">Skills: {worker.skills || 'Home Repairs'}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateWorkerVerification(worker.id, 'Verified', 100)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all"
                >
                  <CheckCircle2 size={16} /> Approve & Verify
                </button>
                <button
                  onClick={() => updateWorkerVerification(worker.id, 'Suspended', 0)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition-all"
                >
                  <XCircle size={16} /> Reject Application
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {paginated.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 font-semibold">Page {paginated.currentPage} of {paginated.totalPages} ({paginated.total} pending)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Previous</button>
            <button disabled={page >= paginated.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationPanel;
