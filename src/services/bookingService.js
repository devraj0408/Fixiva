import { supabase } from '../lib/supabaseClient';
import { logAdminAction } from './auditService';
import { calculateDistanceInKm } from './locationService';
import { isDistrictActive } from './coverageService';
import { BUSINESS_CONFIG } from '../config/businessConfig';

/**
 * Unified Booking & Locality Matching Engine
 * Inspired by Rapido & Urban Company
 */

// ==========================================
// LOCALITY MATCHING ENGINE
// ==========================================

// Comprehensive Trade Synonyms & Keyword Mapping
const TRADE_SYNONYMS = {
  plumber: ['plumber', 'plumbing', 'pipe', 'leak', 'tap', 'drain', 'basin', 'bathroom', 'sanitary', 'water motor'],
  plumbing: ['plumber', 'plumbing', 'pipe', 'leak', 'tap', 'drain', 'basin', 'bathroom', 'sanitary', 'water motor'],
  electrician: ['electrician', 'electrical', 'wiring', 'switch', 'light', 'fan', 'power', 'fuse', 'inverter', 'short circuit'],
  electrical: ['electrician', 'electrical', 'wiring', 'switch', 'light', 'fan', 'power', 'fuse', 'inverter', 'short circuit'],
  carpenter: ['carpenter', 'carpentry', 'furniture', 'wood', 'door', 'lock', 'table', 'chair', 'bed', 'cabinet'],
  carpentry: ['carpenter', 'carpentry', 'furniture', 'wood', 'door', 'lock', 'table', 'chair', 'bed', 'cabinet'],
  cleaner: ['cleaner', 'cleaning', 'deep clean', 'maid', 'housekeep', 'wash', 'sanitization', 'bathroom cleaning', 'kitchen cleaning'],
  cleaning: ['cleaner', 'cleaning', 'deep clean', 'maid', 'housekeep', 'wash', 'sanitization', 'bathroom cleaning', 'kitchen cleaning'],
  painter: ['painter', 'painting', 'wall paint', 'color', 'whitewash', 'texture', 'waterproofing'],
  painting: ['painter', 'painting', 'wall paint', 'color', 'whitewash', 'texture', 'waterproofing'],
  ac: ['ac', 'air conditioner', 'ac repair', 'ac service', 'cooling', 'hvac', 'ac installation', 'gas refill'],
  appliance: ['appliance', 'washing machine', 'refrigerator', 'fridge', 'microwave', 'tv', 'repair', 'oven', 'geyser', 'water heater'],
  pest: ['pest', 'pest control', 'termite', 'cockroach', 'bedbug', 'insect', 'rodent', 'mosquito']
};

export const findAvailableProfessionals = async ({
  serviceId = null,
  serviceName = '',
  category = '',
  state = '',
  district = '',
  locality = '',
  userLat = null,
  userLng = null,
  customWorkers = null
}) => {
  if (!district) {
    return { districtActive: true, professionals: [], message: 'Please select a district.' };
  }

  // 1. Resolve Service Name and Category if serviceId is UUID/ID
  let resolvedServiceName = serviceName || '';
  let resolvedCategory = category || '';

  if (supabase && serviceId && (!resolvedServiceName || resolvedServiceName.toLowerCase() === serviceId.toLowerCase())) {
    try {
      const { data: sData } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .maybeSingle();

      if (sData) {
        resolvedServiceName = sData.name || '';
        resolvedCategory = sData.category || sData.category_id || '';
      }
    } catch (e) {
      void e;
    }
  }

  // Check District Status for specific service
  const initialDistrictActive = await isDistrictActive(state, district, serviceId);

  try {
    // 2. Fetch Active Workers, Contractors & Profiles from Supabase
    let rawWorkers = [];
    let rawContractors = [];
    let rawProfiles = [];

    if (supabase) {
      try {
        const [{ data: wData }, { data: cData }, { data: pData }, { data: skillsData }] = await Promise.all([
          supabase.from('workers').select('*'),
          supabase.from('contractors').select('*'),
          supabase.from('profiles').select('*').in('role', ['worker', 'contractor']),
          supabase.from('worker_skills').select('*').eq('active', true).catch(() => ({ data: [] }))
        ]);
        rawWorkers = wData || [];
        rawContractors = cData || [];
        rawProfiles = pData || [];
        if (skillsData && skillsData.length > 0) {
          skillsData.forEach(s => {
            if (s.worker_id) {
              const existing = rawWorkers.find(w => w.id === s.worker_id);
              if (existing) {
                existing.skills = existing.skills ? `${existing.skills}, ${s.skill_name || s.category}` : (s.skill_name || s.category);
              }
            }
          });
        }
      } catch (e) {
        console.warn('findAvailableProfessionals DB query RLS fallback:', e);
      }
    }

    const workerMap = new Map();

    // Ingest customWorkers passed from App Context
    if (Array.isArray(customWorkers) && customWorkers.length > 0) {
      customWorkers.forEach(w => {
        if (w && w.id) {
          workerMap.set(w.id, {
            ...w,
            name: w.name || 'Verified Specialist',
            district: w.district || w.city || '',
            city: w.city || w.district || '',
            skills: w.skills || '',
            status: w.status || 'Active',
            source: 'custom_workers'
          });
        }
      });
    }

    // Ingest workers from Supabase workers table
    rawWorkers.forEach(w => {
      const existing = workerMap.get(w.id) || {};
      workerMap.set(w.id, {
        ...existing,
        ...w,
        name: existing.name || w.name || 'Verified Specialist',
        district: existing.district || w.district || w.city || '',
        city: existing.city || w.city || w.district || '',
        skills: existing.skills || w.skills || '',
        status: existing.status || w.status || 'Active',
        source: 'worker_table'
      });
    });

    // Ingest profiles from Supabase profiles table
    rawProfiles.filter(p => p.role === 'worker').forEach(p => {
      const existing = workerMap.get(p.id) || { id: p.id };
      workerMap.set(p.id, {
        ...existing,
        id: p.id,
        name: p.name || existing.name || 'Verified Specialist',
        phone: p.phone || existing.phone,
        email: p.email || existing.email,
        district: existing.district || p.district || p.city || '',
        city: existing.city || p.city || '',
        state: existing.state || p.state || '',
        status: existing.status || p.account_status || 'Active',
        account_status: p.account_status || existing.status || 'Active',
        profile_photo_url: p.profile_photo_url || p.avatar_url || existing.profile_photo_url,
        skills: existing.skills || p.skills || '',
      });
    });

    // Scan localStorage for registered worker profiles (ensures locally registered workers are never lost)
    if (typeof localStorage !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('fixiva_user_') || key.startsWith('fixiva_worker_') || key.startsWith('fixiva_profile_'))) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && (parsed.role === 'worker' || parsed.skills || parsed.isWorker)) {
                const id = parsed.id || parsed.profile_id || `local_${i}`;
                const existing = workerMap.get(id) || {};
                workerMap.set(id, {
                  ...existing,
                  ...parsed,
                  id,
                  name: parsed.name || existing.name || 'Verified Specialist',
                  district: parsed.district || parsed.city || existing.district || '',
                  city: parsed.city || parsed.district || existing.city || '',
                  skills: parsed.skills || existing.skills || '',
                  status: parsed.status || parsed.account_status || existing.status || 'Active',
                  phone: parsed.phone || existing.phone || '',
                  whatsapp: parsed.whatsapp || existing.whatsapp || '',
                  source: 'local_storage'
                });
              }
            }
          }
        }
      } catch (e) {
        void e;
      }
    }

    // Default directory of verified specialists (ensures onboarded specialists like Ajmal are always active and discoverable)
    const VERIFIED_SPECIALIST_DIRECTORY = [
      {
        id: 'w-ajmal-north-24-pgs',
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
        id: 'w-ajbro-plumber',
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

    VERIFIED_SPECIALIST_DIRECTORY.forEach(dw => {
      const alreadyExists = Array.from(workerMap.values()).some(
        w => (w.email && dw.email && w.email.toLowerCase() === dw.email.toLowerCase()) || w.id === dw.id
      );
      if (!alreadyExists) {
        workerMap.set(dw.id, { ...dw, source: 'verified_directory' });
      }
    });

    const isAccountActive = (statusStr) => {
      if (!statusStr) return true;
      const lower = String(statusStr).trim().toLowerCase();
      return lower === 'active' || lower === 'approved' || lower === 'true' || lower === '1';
    };

    const normalizeLoc = (str) => {
      if (!str) return '';
      return String(str)
        .toLowerCase()
        .replace(/\s+district$/i, '')
        .replace(/[\-_\.]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const isLocationMatch = (itemDist, itemCity, reqDist) => {
      if (!reqDist) return true;
      const r = normalizeLoc(reqDist);
      const d = normalizeLoc(itemDist);
      const c = normalizeLoc(itemCity);

      if (!r) return true;
      if (d === r || c === r) return true;
      if (d && (d.includes(r) || r.includes(d))) return true;
      if (c && (c.includes(r) || r.includes(c))) return true;

      // Handle common West Bengal / Indian district aliases (North 24 Parganas, South 24 Parganas, etc.)
      const isNorth24 = (s) => s.includes('24') && (s.includes('north') || s.includes('pgs') || s.includes('pargana'));
      const isSouth24 = (s) => s.includes('24') && (s.includes('south') || s.includes('pgs') || s.includes('pargana'));

      if (isNorth24(r) && (isNorth24(d) || isNorth24(c))) return true;
      if (isSouth24(r) && (isSouth24(d) || isSouth24(c))) return true;

      return false;
    };

    const isSkillMatch = (itemSkills, reqId, reqName, reqCat) => {
      if (!itemSkills) return true;
      const wSkills = String(itemSkills).toLowerCase().trim();
      if (!reqId && !reqName && !reqCat) return true;
      if (wSkills === 'all' || wSkills.includes('general') || wSkills.includes('specialist')) return true;

      const targets = [
        String(reqId || '').toLowerCase().trim(),
        String(reqName || '').toLowerCase().trim(),
        String(reqCat || '').toLowerCase().trim()
      ].filter(t => t.length > 0);

      // Direct match
      for (const t of targets) {
        if (wSkills.includes(t) || t.includes(wSkills)) return true;
      }

      // Semantic trade synonyms match
      for (const t of targets) {
        for (const [trade, synonyms] of Object.entries(TRADE_SYNONYMS)) {
          const targetMatchesTrade = t.includes(trade) || synonyms.some(syn => t.includes(syn));
          if (targetMatchesTrade) {
            const workerMatchesTrade = wSkills.includes(trade) || synonyms.some(syn => wSkills.includes(syn));
            if (workerMatchesTrade) return true;
          }
        }
      }

      return false;
    };

    const isValidCoordinate = (lat, lng) => {
      if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
      const numLat = Number(lat);
      const numLng = Number(lng);
      return !isNaN(numLat) && !isNaN(numLng) && numLat >= -90 && numLat <= 90 && numLng >= -180 && numLng <= 180 && (numLat !== 0 || numLng !== 0);
    };

    const hasUserCoords = isValidCoordinate(userLat, userLng);

    // Filter active registered workers
    const formattedWorkers = Array.from(workerMap.values())
      .filter(w => 
        isAccountActive(w.status || w.account_status) && 
        isLocationMatch(w.district, w.city, district) && 
        isSkillMatch(w.skills, serviceId, resolvedServiceName, resolvedCategory)
      )
      .map(w => {
        let distKm = null;
        let etaText = null;
        if (hasUserCoords && isValidCoordinate(w.location_latitude, w.location_longitude)) {
          distKm = Number(calculateDistanceInKm(Number(userLat), Number(userLng), Number(w.location_latitude), Number(w.location_longitude)).toFixed(1));
          etaText = `${Math.max(5, Math.round(distKm * 3))} mins`;
        }

        return {
          id: w.id,
          type: 'worker',
          name: w.name || 'Verified Specialist',
          role: 'Professional Worker',
          rating: w.rating ? Number(w.rating).toFixed(1) : (w.trust_score ? (w.trust_score / 20).toFixed(1) : '4.8'),
          completed_jobs: Number(w.completed_jobs || 0),
          experience: w.experience || '3+ years experience',
          starting_price: Number(w.starting_price || w.visit_charge || 0),
          distance_km: distKm,
          eta_text: etaText,
          status: 'Available',
          profile_photo_url: w.profile_photo_url || null,
          skills: w.skills || resolvedServiceName || 'Specialist',
          whatsapp: w.whatsapp || w.phone || ''
        };
      });

    let allMatched = [...formattedWorkers];

    allMatched.sort((a, b) => {
      if (a.distance_km !== null && b.distance_km !== null) {
        return a.distance_km - b.distance_km;
      }
      if (a.distance_km !== null) return -1;
      if (b.distance_km !== null) return 1;
      if (b.rating !== a.rating) {
        return Number(b.rating) - Number(a.rating);
      }
      return b.completed_jobs - a.completed_jobs;
    });

    // If active workers exist in this district, coverage is active regardless of fallback heuristics
    const hasPros = allMatched.length > 0;
    const districtActive = hasPros ? true : initialDistrictActive;

    if (!districtActive && !hasPros) {
      return {
        districtActive: false,
        professionals: [],
        message: 'Fixiva is currently unavailable in your district.'
      };
    }

    return {
      districtActive: true,
      professionals: allMatched,
      message: `${allMatched.length} verified professionals available near ${locality || district}`
    };
  } catch (err) {
    console.error('findAvailableProfessionals exception:', err);
    return {
      districtActive: true,
      professionals: [],
      message: 'Failed to search nearby professionals.'
    };
  }
};

// ==========================================
// BOOKINGS CRUD
// ==========================================

export const getBookings = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const createBooking = async (bookingData, actor = {}) => {
  const currentSettings = getSystemSettings();
  if (currentSettings?.maintenanceMode) {
    return { data: null, error: 'Platform is currently in Maintenance Mode. New customer bookings are temporarily paused.' };
  }

  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const bookingId = `FXV-${Date.now().toString().slice(-6)}`;
    
    let currentCustomerId = bookingData.customer_id;
    if (!currentCustomerId) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        currentCustomerId = authData?.user?.id || null;
      } catch (e) { void e; }
    }

    const isValidUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

    const cityVal = bookingData.district || bookingData.city || '';
    const stateVal = bookingData.state || '';
    const localityVal = bookingData.locality || '';
    const fullLocText = [localityVal, cityVal, stateVal].filter(Boolean).join(', ');
    const fullAddress = bookingData.address || fullLocText;

    const initialPayload = {
      id: bookingId,
      customer_id: isValidUuid(currentCustomerId) ? currentCustomerId : null,
      worker_id: isValidUuid(bookingData.worker_id) ? bookingData.worker_id : null,
      contractor_id: isValidUuid(bookingData.contractor_id) ? bookingData.contractor_id : null,
      service_id: bookingData.service_id || 'general',
      service_name: bookingData.service_name || 'Home Service',
      city: cityVal,
      address: fullAddress,
      customer_address: fullAddress,
      location_text: fullLocText,
      customer_name: bookingData.customer_name || 'Customer',
      customer_phone: bookingData.customer_phone || '',
      worker_name: bookingData.worker_name || 'Specialist Assigned',
      worker_phone: bookingData.worker_phone || '',
      price: Number(bookingData.price || 0),
      platform_fee: 0,
      payment_method: 'CASH',
      payment_status: 'PENDING',
      paid_at: null,
      status: 'New Request',
      booking_date: bookingData.booking_date || new Date().toISOString(),
      // Additional hierarchy columns if supported in DB
      state: stateVal,
      district: cityVal,
      locality: localityVal,
      pincode: bookingData.pincode || ''
    };

    let activePayload = { ...initialPayload };
    let data = null;
    let error = null;
    let maxRetries = 10;

    while (maxRetries > 0) {
      const res = await supabase
        .from('bookings')
        .insert(activePayload)
        .select()
        .maybeSingle();

      data = res.data;
      error = res.error;

      if (!error) break;

      maxRetries--;
      const msg = error.message || '';

      // 1. Missing column error in PostgREST schema cache (e.g. Could not find the 'district' column)
      const colMatch = msg.match(/Could not find the ['"]?([a-zA-Z0-9_]+)['"]? column/i)
        || msg.match(/column ['"]?([a-zA-Z0-9_]+)['"]? of/i)
        || msg.match(/column ['"]?([a-zA-Z0-9_]+)['"]? does not exist/i);

      if (colMatch && colMatch[1] && activePayload[colMatch[1]] !== undefined) {
        const colToRemove = colMatch[1];
        console.warn(`[createBooking] Stripping non-existent DB column '${colToRemove}' from bookings insert`);
        delete activePayload[colToRemove];
        continue;
      }

      // 2. Foreign key constraint or invalid uuid on worker / customer / contractor / id
      if (msg.includes('foreign key') || msg.includes('violates foreign key constraint') || msg.includes('syntax') || msg.includes('uuid')) {
        let changed = false;
        if ((msg.includes('worker') || !isValidUuid(activePayload.worker_id)) && activePayload.worker_id) {
          delete activePayload.worker_id;
          changed = true;
        }
        if ((msg.includes('customer') || !isValidUuid(activePayload.customer_id)) && activePayload.customer_id) {
          delete activePayload.customer_id;
          changed = true;
        }
        if ((msg.includes('contractor') || !isValidUuid(activePayload.contractor_id)) && activePayload.contractor_id) {
          delete activePayload.contractor_id;
          changed = true;
        }
        if ((msg.includes('uuid') || msg.includes('syntax')) && activePayload.id === bookingId) {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            activePayload.id = crypto.randomUUID();
            changed = true;
          }
        }
        if (changed) continue;
      }

      break;
    }

    if (error) {
      console.error('createBooking DB error:', error);
      return { data: null, error: error.message || 'Booking creation failed in database' };
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create_booking',
      objectType: 'booking',
      objectId: activePayload.id || bookingId,
      payload: activePayload,
    });

    return { data: data || activePayload, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateBookingStatus = async (id, status, workerId = null, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  const updates = { status };
  if (workerId && !String(workerId).startsWith('mock-')) {
    updates.worker_id = workerId;
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update_booking_status',
      objectType: 'booking',
      objectId: id,
      payload: updates,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const assignWorkerToBooking = async (bookingId, worker, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  const payload = {
    worker_id: worker.id && !String(worker.id).startsWith('mock-') ? worker.id : null,
    worker_name: worker.name || 'Verified Specialist',
    worker_phone: worker.phone || null,
    status: 'Assigned',
  };

  try {
    const { data, error } = await supabase
      .from('bookings')
      .update(payload)
      .eq('id', bookingId)
      .select()
      .maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'assign_worker',
      objectType: 'booking',
      objectId: bookingId,
      payload: { worker_id: worker.id, worker_name: payload.worker_name },
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

// ==========================================
// BACKWARD COMPATIBILITY EXPORTS FOR CMS
// ==========================================

const SETTINGS_KEY = 'fixiva_system_settings';

export const getSystemSettings = () => {
  const defaults = {
    maintenanceMode: false,
    enableCoupons: true,
    enableOffers: true,
    enableReviews: true,
    enableWallet: false,
    enableOnlinePayments: false,
    enableCashPayments: true,
    enableNotifications: true,
    enableReferrals: false,
    enableWorkerLiveTracking: true,
    defaultServiceRadiusKm: 15,
    defaultPlatformFee: BUSINESS_CONFIG.PLATFORM_FEE,
    emergencyBookingEnabled: true,
  };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch (e) {
    void e;
    return defaults;
  }
};

export const updateSystemSettings = (updates) => {
  try {
    const current = getSystemSettings();
    const updated = { ...current, ...updates };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('fixiva:settings-updated', { detail: updated }));
      } catch { void 0; }
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('fixiva-channel');
          bc.postMessage({ type: 'SETTINGS_UPDATED', payload: updated });
          bc.close();
        }
      } catch { void 0; }
    }

    return { data: updated, error: null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
};

export const getPayments = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };
  try {
    const { data: bData, error: bErr } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (!bErr && bData) {
      const mappedPayments = bData.map((b) => ({
        id: b.id,
        booking_id: b.id,
        customer_name: b.customer_name || 'Customer',
        worker_name: b.worker_name || 'Unassigned',
        contractor_id: b.contractor_id,
        service_name: b.service_name || 'Home Service',
        amount: Number(b.price || 0),
        platform_fee: Number(b.platform_fee || 0),
        payment_method: b.payment_method || 'CASH',
        status: b.payment_status || 'PENDING',
        paid_at: b.paid_at || null,
        booking_status: b.status,
        created_at: b.created_at,
        transaction_id: `CASH-${b.id}`
      }));
      return { data: mappedPayments, error: null };
    }

    const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    return { data: data || [], error: error?.message || null };
  } catch (err) {
    return { data: [], error: String(err) };
  }
};

export const updatePaymentStatus = async (id, status, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };
  try {
    const isPaid = status === 'PAID' || status === 'Paid';
    const updates = {
      payment_method: 'CASH',
      payment_status: isPaid ? 'PAID' : status,
      platform_fee: 0,
      paid_at: isPaid ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('updatePaymentStatus error:', error);
      return { data: null, error: error.message };
    }

    try {
      await supabase.from('payments').upsert({
        id,
        booking_id: id,
        amount: data?.price || 0,
        payment_method: 'CASH',
        status: isPaid ? 'Paid' : status,
        created_at: data?.created_at || new Date().toISOString()
      });
    } catch (e) {
      void e;
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update_payment_status',
      objectType: 'booking_payment',
      objectId: id,
      payload: updates,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const collectCashPayment = async (bookingId, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data: existing } = await supabase
      .from('bookings')
      .select('payment_status, price')
      .eq('id', bookingId)
      .maybeSingle();

    if (existing && (existing.payment_status === 'PAID' || existing.payment_status === 'Paid')) {
      return { data: existing, error: 'Cash has already been collected for this booking.' };
    }
  } catch (e) {
    void e;
  }

  return updatePaymentStatus(bookingId, 'PAID', actor);
};

export const getSupportTickets = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };
  try {
    const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    return { data: data || [], error: error?.message || null };
  } catch (err) {
    return { data: [], error: String(err) };
  }
};

export const updateTicketStatus = async (id, status, adminReply = '') => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };
  try {
    const { data, error } = await supabase.from('support_tickets').update({ status, admin_reply: adminReply }).eq('id', id).select().maybeSingle();
    return { data, error: error?.message || null };
  } catch (err) {
    return { data: null, error: String(err) };
  }
};
