// src/data/specialistData.js

export const AJMAL_WORKER_UUID = 'b8121965-7479-4928-8976-000000000001';
export const AJBRO_WORKER_UUID = '74799187-1900-4000-8000-000000000002';

export const VERIFIED_SPECIALISTS = [
  {
    id: AJMAL_WORKER_UUID,
    name: 'Ajmal',
    role: 'worker',
    skills: 'Plumber',
    city: 'North 24 Parganas',
    district: 'North 24 Parganas',
    state: 'West Bengal',
    phone: '7479928976',
    email: 'b81219657@gmail.com',
    status: 'Active',
    account_status: 'Active',
    rating: '4.8',
    trust_score: 40,
    experience: '3+ years experience',
    starting_price: 299,
    visit_charge: 199,
  },
  {
    id: AJBRO_WORKER_UUID,
    name: 'Ajbro',
    role: 'worker',
    skills: 'Plumber',
    city: "Other / Can't find your location?",
    district: "Other / Can't find your location?",
    state: 'West Bengal',
    phone: '7479918719',
    email: 'ayushcoderbaba@gmail.com',
    status: 'Active',
    account_status: 'Active',
    rating: '4.5',
    trust_score: 30,
    experience: '2+ years experience',
    starting_price: 249,
    visit_charge: 149,
  }
];

export const isAjmalSpecialist = (workerOrUser = {}) => {
  if (!workerOrUser) return false;
  const id = String(workerOrUser.id || workerOrUser.worker_id || workerOrUser.profile_id || '').trim();
  const email = String(workerOrUser.email || workerOrUser.worker_email || '').toLowerCase().trim();
  const phone = String(workerOrUser.phone || workerOrUser.whatsapp || workerOrUser.worker_phone || '').replace(/\D/g, '').slice(-10);
  const name = String(workerOrUser.name || workerOrUser.worker_name || workerOrUser.assigned_worker_name || '').toLowerCase().trim();

  if (id === AJMAL_WORKER_UUID || id === 'w-ajmal-north-24-pgs' || id === 'local_3') return true;
  if (email && (email === 'b81219657@gmail.com' || email.includes('b81219657'))) return true;
  if (phone && phone === '7479928976') return true;
  if (name && (name === 'ajmal' || name === 'ajmul' || name.startsWith('ajm'))) return true;
  return false;
};

export const resolveCanonicalWorkerId = (idOrWorker) => {
  if (!idOrWorker) return null;
  if (typeof idOrWorker === 'string') {
    const clean = idOrWorker.trim();
    if (clean === 'local_3' || clean === 'w-ajmal-north-24-pgs' || clean === AJMAL_WORKER_UUID || clean.toLowerCase().includes('ajm')) {
      return AJMAL_WORKER_UUID;
    }
    if (clean === 'w-ajbro-plumber' || clean === AJBRO_WORKER_UUID || clean.toLowerCase().includes('ajbro')) {
      return AJBRO_WORKER_UUID;
    }
    return clean;
  }
  if (isAjmalSpecialist(idOrWorker)) {
    return AJMAL_WORKER_UUID;
  }
  const cleanId = String(idOrWorker.id || idOrWorker.worker_id || '').trim();
  if (cleanId === 'w-ajbro-plumber' || cleanId === AJBRO_WORKER_UUID) {
    return AJBRO_WORKER_UUID;
  }
  return cleanId || null;
};
