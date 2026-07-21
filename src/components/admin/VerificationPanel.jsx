import { useMemo, useState } from 'react';
import { useApp } from '../../context/AuthContext';

const VerificationPanel = () => {
  const { workers, contractors, updateWorkerStatus, updateContractorStatus } = useApp();
  const [search, setSearch] = useState('');

  const pendingWorkers = useMemo(() => {
    return (workers || []).filter((worker) => worker.status === 'Pending Verification' && !worker.isContractor);
  }, [workers]);

  const pendingContractors = useMemo(() => {
    return (contractors || []).filter((contractor) => contractor.status === 'Pending Approval');
  }, [contractors]);

  const filteredWorkers = useMemo(() => {
    return pendingWorkers.filter((worker) => `${worker.name || ''} ${worker.email || ''}`.toLowerCase().includes(search.toLowerCase()));
  }, [pendingWorkers, search]);

  const filteredContractors = useMemo(() => {
    return pendingContractors.filter((contractor) => `${contractor.name || ''} ${contractor.company || ''}`.toLowerCase().includes(search.toLowerCase()));
  }, [pendingContractors, search]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Verification Center</h2>
          <p className="text-sm text-slate-500">Approve workers and contractors with a simple review workflow.</p>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or company"
        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Workers</h3>
          <div className="mt-4 space-y-3">
            {filteredWorkers.length === 0 ? (
              <p className="text-sm text-slate-500">No pending worker verification.</p>
            ) : (
              filteredWorkers.map((worker) => (
                <div key={worker.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-800">{worker.name || 'Worker'}</p>
                  <p className="mt-1 text-xs text-slate-500">{worker.email || '-'} • {worker.skills || '-'}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => updateWorkerStatus(worker.id, 'Verified')} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">Approve</button>
                    <button onClick={() => updateWorkerStatus(worker.id, 'Rejected')} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Contractors</h3>
          <div className="mt-4 space-y-3">
            {filteredContractors.length === 0 ? (
              <p className="text-sm text-slate-500">No pending contractor approval.</p>
            ) : (
              filteredContractors.map((contractor) => (
                <div key={contractor.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-800">{contractor.company || 'Contractor'}</p>
                  <p className="mt-1 text-xs text-slate-500">{contractor.name || '-'} • {contractor.phone || '-'}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => updateContractorStatus(contractor.id, 'Approved')} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">Approve</button>
                    <button onClick={() => updateContractorStatus(contractor.id, 'Rejected')} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPanel;
