import {
  CheckCircle2,
  ClipboardCheck,
  Navigation,
  UserCheck,
  Wrench
} from 'lucide-react';

// 5 Direct Customer-Centric Stages (No contractor middleman)
export const STAGES = [
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

export const getActiveStageIndex = (status) => {
  if (!status) return 0;
  const normalized = String(status).trim().toLowerCase();

  if (normalized.includes('cancel') || normalized.includes('reject')) {
    return -1;
  }

  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (STAGES[i].statuses.some((stageStatus) => stageStatus.toLowerCase() === normalized)) {
      return i;
    }
  }
  return 0;
};