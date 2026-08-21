import { Check } from 'lucide-react';

const STAGES = [
  { id: 'created', label: 'Booking Created', statuses: ['NEW', 'LEAD SENT', 'Pending', 'New Request'] },
  { id: 'contractor_accepted', label: 'Contractor Accepted', statuses: ['CONTRACTOR ACCEPTED', 'Confirmed'] },
  { id: 'worker_assigned', label: 'Worker Assigned', statuses: ['WORKER ASSIGNED', 'PENDING ACCEPTANCE', 'Assigned'] },
  { id: 'worker_accepted', label: 'Worker Accepted', statuses: ['ACCEPTED'] },
  { id: 'on_the_way', label: 'On The Way', statuses: ['ON THE WAY'] },
  { id: 'arrived', label: 'Arrived', statuses: ['ARRIVED'] },
  { id: 'work_started', label: 'Work Started', statuses: ['WORK IN PROGRESS', 'Work Started', 'In Progress'] },
  { id: 'completed', label: 'Completed', statuses: ['COMPLETED', 'Completed'] },
  { id: 'reviewed', label: 'Reviewed', statuses: ['REVIEWED', 'Reviewed'] }
];

const getActiveStageIndex = (status) => {
  if (!status) return 0;
  const normalized = String(status).trim();
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (STAGES[i].statuses.some((s) => s.toLowerCase() === normalized.toLowerCase())) {
      return i;
    }
  }
  return 0;
};

const BookingStatusTimeline = ({ status = 'NEW', compact = false }) => {
  const currentIndex = getActiveStageIndex(status);

  if (compact) {
    const currentStage = STAGES[currentIndex] || STAGES[0];
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-50 text-primary border border-blue-100">
        <span className="w-2 h-2 rounded-full bg-primary animate-ping shrink-0"></span>
        <span>{currentStage.label}</span>
      </div>
    );
  }

  return (
    <div className="w-full py-4 space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
        <span>Lifecycle Status</span>
        <span className="text-primary font-black uppercase tracking-wider">{STAGES[currentIndex]?.label || status}</span>
      </div>

      {/* Horizontal Progress Bar for Desktop */}
      <div className="hidden sm:flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 -z-0"></div>
        <div
          className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 transition-all duration-500 -z-0"
          style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
        ></div>

        {STAGES.map((stage, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  isDone
                    ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-200'
                    : isCurrent
                    ? 'bg-primary text-white shadow-md ring-4 ring-blue-100 scale-110'
                    : 'bg-white text-slate-400 border-2 border-slate-300'
                }`}
                title={stage.label}
              >
                {isDone ? <Check size={14} /> : idx + 1}
              </div>
              <span
                className={`text-[9px] font-bold mt-1.5 text-center max-w-[65px] leading-tight ${
                  isCurrent ? 'text-primary font-extrabold' : isDone ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Vertical Mobile Timeline */}
      <div className="sm:hidden space-y-2 border-l-2 border-blue-100 pl-4 py-1">
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          if (idx > currentIndex + 1 && idx < STAGES.length - 1) return null; // Collapse future steps on mobile
          return (
            <div key={stage.id} className="flex items-center gap-2 text-xs">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-primary text-white ring-2 ring-blue-100'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <span className={`font-bold ${isCurrent ? 'text-primary font-extrabold' : isDone ? 'text-emerald-700' : 'text-slate-400'}`}>
                {stage.label} {isCurrent && '(Current Step)'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookingStatusTimeline;
