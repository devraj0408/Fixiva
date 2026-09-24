import React from 'react';
import { 
  Check, 
  ClipboardCheck, 
  UserCheck, 
  Navigation, 
  Wrench, 
  CheckCircle2, 
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

// 5 Direct Customer-Centric Stages (No contractor middleman)
const STAGES = [
  { 
    id: 'booked', 
    key: 'statusBooked', 
    label: 'Booked', 
    shortDesc: 'Request Confirmed',
    icon: ClipboardCheck,
    statuses: ['NEW', 'LEAD SENT', 'Pending', 'New Request', 'BOOKED', 'Confirmed'] 
  },
  { 
    id: 'assigned', 
    key: 'statusWorkerAssigned', 
    label: 'Assigned', 
    shortDesc: 'Specialist Assigned',
    icon: UserCheck,
    statuses: ['WORKER ASSIGNED', 'PENDING ACCEPTANCE', 'Assigned', 'ACCEPTED', 'CONTRACTOR ACCEPTED', 'Worker Accepted'] 
  },
  { 
    id: 'on_the_way', 
    key: 'statusOnTheWay', 
    label: 'On The Way', 
    shortDesc: 'En Route',
    icon: Navigation,
    statuses: ['ON THE WAY', 'Dispatched', 'En Route'] 
  },
  { 
    id: 'in_progress', 
    key: 'statusWorkStarted', 
    label: 'In Progress', 
    shortDesc: 'Service Active',
    icon: Wrench,
    statuses: ['ARRIVED', 'Arrived', 'WORK IN PROGRESS', 'Work Started', 'In Progress', 'In Service'] 
  },
  { 
    id: 'completed', 
    key: 'statusCompleted', 
    label: 'Completed', 
    shortDesc: 'Work Done',
    icon: CheckCircle2,
    statuses: ['COMPLETED', 'Completed', 'Reviewed', 'REVIEWED'] 
  }
];

const getActiveStageIndex = (status) => {
  if (!status) return 0;
  const normalized = String(status).trim().toLowerCase();
  
  if (normalized.includes('cancel') || normalized.includes('reject')) {
    return -1;
  }

  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (STAGES[i].statuses.some((s) => s.toLowerCase() === normalized)) {
      return i;
    }
  }
  return 0;
};

const getStatusDetails = (stageIndex, workerName) => {
  switch (stageIndex) {
    case 0:
      return {
        title: 'Booking Confirmed',
        desc: 'Request received! Matching with the nearest certified specialist.',
        badge: 'Matching Specialist',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200'
      };
    case 1:
      return {
        title: 'Specialist Assigned',
        desc: workerName 
          ? `${workerName} has been directly assigned & confirmed for your service.`
          : 'A verified specialist has been directly assigned to your booking.',
        badge: 'Direct Assignment',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    case 2:
      return {
        title: 'Specialist En Route',
        desc: workerName 
          ? `${workerName} is on the way to your location.`
          : 'Your specialist has departed and is traveling to your address.',
        badge: 'En Route',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      };
    case 3:
      return {
        title: 'Service In Progress',
        desc: 'Specialist has arrived and service execution is underway.',
        badge: 'Work Active',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    case 4:
      return {
        title: 'Service Completed',
        desc: 'Job finished successfully! Please review and verify the service.',
        badge: 'Completed',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300'
      };
    default:
      return {
        title: 'Booking Cancelled',
        desc: 'This booking has been cancelled or rejected.',
        badge: 'Cancelled',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200'
      };
  }
};

const BookingStatusTimeline = ({ status = 'NEW', compact = false, workerName = '', booking = null }) => {
  const { t } = useLanguage();
  const currentIndex = getActiveStageIndex(status);
  const isCancelled = currentIndex === -1;
  const effectiveWorkerName = workerName || booking?.worker_name || '';

  const getStageLabel = (stage) => {
    if (!stage) return status;
    return t(stage.key, stage.label);
  };

  if (compact) {
    if (isCancelled) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle size={12} /> Cancelled
        </span>
      );
    }
    const currentStage = STAGES[currentIndex] || STAGES[0];
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
        <span>{getStageLabel(currentStage)}</span>
      </div>
    );
  }

  const currentDetails = getStatusDetails(currentIndex, effectiveWorkerName);

  if (isCancelled) {
    return (
      <div className="w-full py-2">
        <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle size={20} />
          </div>
          <div>
            <h5 className="font-bold text-xs text-rose-900">Booking Cancelled</h5>
            <p className="text-[11px] text-rose-700 mt-0.5">This service booking is no longer active.</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate progress percentage for track fill
  const progressPercent = Math.max(0, Math.min(100, (currentIndex / (STAGES.length - 1)) * 100));

  return (
    <div className="w-full py-2 space-y-3">
      {/* Contextual Status Banner */}
      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white text-primary flex items-center justify-center shadow-xs border border-slate-200/60 shrink-0">
            {React.createElement(STAGES[currentIndex]?.icon || Clock, { size: 16 })}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h5 className="font-extrabold text-xs text-slate-900 truncate">{currentDetails.title}</h5>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${currentDetails.badgeClass}`}>
                {currentDetails.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              {currentDetails.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Connected Flow Graph */}
      <div className="px-1 py-1">
        <div className="relative flex items-center justify-between">
          {/* Background Track Line */}
          <div className="absolute top-[16px] left-4 right-4 h-1 bg-slate-200 rounded-full -translate-y-1/2 z-0" />

          {/* Active Progress Track Line */}
          <div
            className="absolute top-[16px] left-4 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full -translate-y-1/2 transition-all duration-500 z-0"
            style={{ width: `calc((100% - 32px) * ${progressPercent / 100})` }}
          />

          {/* 5 Stages Nodes */}
          {STAGES.map((stage, idx) => {
            const isDone = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isUpcoming = idx > currentIndex;
            const StageIcon = stage.icon;

            return (
              <div key={stage.id} className="relative z-10 flex flex-col items-center group">
                {/* Node Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-500 text-white shadow-xs ring-2 ring-emerald-100'
                      : isCurrent
                      ? 'bg-primary text-white shadow-md ring-4 ring-primary/20 scale-110 font-bold'
                      : 'bg-white text-slate-400 border border-slate-300'
                  }`}
                  title={`${getStageLabel(stage)}: ${stage.shortDesc}`}
                >
                  {isDone ? (
                    <Check size={15} strokeWidth={3} />
                  ) : (
                    <StageIcon size={14} strokeWidth={isCurrent ? 2.5 : 2} />
                  )}
                </div>

                {/* Node Label */}
                <div className="text-center mt-1.5 flex flex-col items-center">
                  <span
                    className={`text-[10px] leading-tight transition-colors ${
                      isCurrent
                        ? 'font-black text-primary'
                        : isDone
                        ? 'font-bold text-slate-800'
                        : 'font-medium text-slate-400'
                    }`}
                  >
                    {getStageLabel(stage)}
                  </span>
                  <span
                    className={`text-[8px] leading-tight hidden xs:block mt-0.5 ${
                      isCurrent
                        ? 'font-semibold text-primary/80'
                        : isDone
                        ? 'text-emerald-600 font-medium'
                        : 'text-slate-400'
                    }`}
                  >
                    {isCurrent ? 'Current' : isDone ? 'Done' : `Step ${idx + 1}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BookingStatusTimeline;
