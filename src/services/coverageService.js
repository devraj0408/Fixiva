import { supabase } from '../lib/supabaseClient';
import { logAdminAction } from './auditService';
import { getDistricts, isMissingTableError, saveDistrictUpdateToStorage } from './locationService';

/**
 * Single Coverage Service - District Coverage Management & Coverage Requests Workflow
 * Supabase Single Source of Truth
 */

// ==========================================
// DISTRICT COVERAGE MANAGEMENT
// ==========================================

const isMatchForDistrict = (item, distName) => {
  if (!item || !distName) return false;

  const target = String(distName).toLowerCase().replace(/\s+district$/i, '').trim();
  if (!target) return false;

  const fields = [
    item.district,
    item.city,
    item.locality,
    item.coverage_area,
    item.address,
    item.location,
    item.preferred_location
  ];

  return fields.some(field => {
    if (!field || typeof field !== 'string') return false;
    const str = field.toLowerCase().trim();
    if (!str) return false;

    const cleanField = str.replace(/\s+district$/i, '').trim();

    return (
      cleanField === target ||
      cleanField.includes(target) ||
      target.includes(cleanField)
    );
  });
};

export const getDistrictCoverageList = async (customData = null) => {
  try {
    // 1. Fetch Districts
    const { data: districts, error: distErr } = await getDistricts();
    if (distErr) return { data: [], error: distErr };

    // 2. Fetch Customers count per district
    let customers = customData?.customers || [];
    if (!customData || customers.length === 0) {
      if (supabase) {
        try {
          const res = await supabase.from('profiles').select('*');
          if (res.data && res.data.length > 0) {
            customers = res.data.filter(p => {
              const role = String(p.role || '').trim().toLowerCase();
              return role === 'customer' || role === 'user' || role === 'client' || (!role && p.id);
            });
          }
        } catch (e) { void e; }
      }
    }

    // 3. Fetch Workers count per district
    let workers = customData?.workers || [];
    if (!customData || workers.length === 0) {
      if (supabase) {
        try {
          const [{ data: wData }, { data: pData }] = await Promise.all([
            supabase.from('workers').select('*'),
            supabase.from('profiles').select('*').eq('role', 'worker')
          ]);
          const map = new Map();
          (wData || []).forEach(w => map.set(w.id, { ...w }));
          (pData || []).forEach(p => {
            const ex = map.get(p.id) || { id: p.id };
            map.set(p.id, {
              ...ex,
              ...p,
              district: ex.district || p.district || ex.city || p.city,
              city: ex.city || p.city || ex.district || p.district
            });
          });
          workers = Array.from(map.values());
        } catch (e) { void e; }
      }
    }

    // 4. Fetch Contractors count per district
    let contractors = customData?.contractors || [];
    if (!customData || contractors.length === 0) {
      if (supabase) {
        try {
          const [{ data: cData }, { data: pData }] = await Promise.all([
            supabase.from('contractors').select('*'),
            supabase.from('profiles').select('*').eq('role', 'contractor')
          ]);
          const map = new Map();
          (cData || []).forEach(c => map.set(c.id, { ...c }));
          (pData || []).forEach(p => {
            const ex = map.get(p.id) || { id: p.id };
            map.set(p.id, {
              ...ex,
              ...p,
              district: ex.district || p.district || ex.city || p.city,
              city: ex.city || p.city || ex.district || p.district
            });
          });
          contractors = Array.from(map.values());
        } catch (e) { void e; }
      }
    }

    // 5. Fetch Active Bookings per district
    let bookings = customData?.bookings || [];
    if (!customData || bookings.length === 0) {
      if (supabase) {
        try {
          const res = await supabase.from('bookings').select('*');
          if (res.data) bookings = res.data;
        } catch (e) { void e; }
      }
    }

    // 6. Fetch Coverage Requests per district
    let requests = customData?.requests || [];
    if (!customData || requests.length === 0) {
      if (supabase) {
        try {
          const res = await supabase.from('coverage_requests').select('*');
          if (res.data) requests = res.data;
        } catch (e) { void e; }
      }
    }

    // Map aggregated metrics to each District using robust matching
    const aggregated = (districts || []).map(dist => {
      const customerCount = (customers || []).filter(c => 
        isMatchForDistrict(c, dist.name) && String(c.account_status || c.status || '').toLowerCase() !== 'disabled'
      ).length;

      const workerCount = (workers || []).filter(w => 
        isMatchForDistrict(w, dist.name) && String(w.status || '').toLowerCase() !== 'disabled'
      ).length;

      const contractorCount = (contractors || []).filter(c => 
        isMatchForDistrict(c, dist.name) && String(c.status || '').toLowerCase() !== 'disabled'
      ).length;

      const bookingCount = (bookings || []).filter(b => 
        isMatchForDistrict(b, dist.name)
      ).length;

      const requestCount = (requests || []).filter(r => 
        isMatchForDistrict(r, dist.name)
      ).length;

      return {
        ...dist,
        customerCount,
        workerCount,
        contractorCount,
        bookingCount,
        requestCount,
        status: dist.status || 'Active',
        coverage_radius_km: dist.coverage_radius_km || 15
      };
    });

    return { data: aggregated, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const isDistrictActive = async (stateName, districtName, serviceId = null) => {
  if (!districtName) return false;

  const cleanName = districtName.trim().toLowerCase();

  // Check stored service city control from localStorage
  if (serviceId) {
    try {
      const cityControl = JSON.parse(localStorage.getItem('fixiva_city_control') || '{}');
      const cKeys = [cleanName, `dist-${cleanName}`, districtName];
      const sKeys = [serviceId, String(serviceId).toLowerCase()];

      for (const cKey of cKeys) {
        if (cityControl[cKey]) {
          for (const sKey of sKeys) {
            if (cityControl[cKey][sKey] !== undefined) {
              return cityControl[cKey][sKey] === true;
            }
          }
        }
      }
    } catch (e) { void e; }
  }

  // Check stored local district updates first
  try {
    const updatesMap = JSON.parse(localStorage.getItem('fixiva_district_updates') || '{}');
    const update = Object.values(updatesMap).find(u => 
      u && (String(u.name || '').toLowerCase() === cleanName || String(u.id || '').toLowerCase() === cleanName)
    );
    if (update && update.status) {
      return update.status === 'Active';
    }
  } catch (e) { void e; }

  // Check custom created districts from localStorage
  try {
    const customList = JSON.parse(localStorage.getItem('fixiva_custom_districts') || '[]');
    const matchedCustom = customList.find(d => String(d.name || '').trim().toLowerCase() === cleanName);
    if (matchedCustom) {
      return matchedCustom.status === 'Active';
    }
  } catch (e) { void e; }

  if (!supabase) return true;

  try {
    const { data, error } = await supabase
      .from('districts')
      .select('status')
      .ilike('name', districtName.trim())
      .maybeSingle();

    if (!error && data) {
      return data.status === 'Active';
    }

    // Check legacy cities fallback
    const { data: cityData } = await supabase
      .from('cities')
      .select('status')
      .ilike('name', districtName.trim())
      .maybeSingle();

    if (cityData) {
      return cityData.status !== 'Disabled' && cityData.status !== 'Coming Soon';
    }

    // Default: if in primary operating list
    const activeDefaults = [
      'ranchi', 'jamshedpur', 'dhanbad', 'bokaro', 'deoghar', 'dumka',
      'patna', 'lucknow', 'kolkata', 'new delhi', 'noida', 'gurugram', 'bhubaneswar'
    ];
    return activeDefaults.includes(cleanName);
  } catch {
    return true;
  }
};

export const updateDistrictStatus = async (districtId, status, coverage_radius_km = 15, actor = {}) => {
  const payload = { status, coverage_radius_km: Number(coverage_radius_km) };

  // Always save update to LocalStorage fallback so district status updates stick immediately
  saveDistrictUpdateToStorage(districtId, payload);

  if (supabase) {
    try {
      let { data, error } = await supabase
        .from('districts')
        .update(payload)
        .eq('id', districtId)
        .select()
        .maybeSingle();

      if (error && isMissingTableError(error)) {
        await supabase
          .from('cities')
          .update({ status: status === 'Active' ? 'Live' : status })
          .eq('id', districtId);
      }

      if (data) {
        return { data, error: null };
      }
    } catch (e) {
      void e;
    }
  }

  await logAdminAction({
    actorId: actor?.id,
    actorEmail: actor?.email,
    action: 'update_district_status',
    objectType: 'district',
    objectId: districtId,
    payload: { status, coverage_radius_km },
  });

  return { data: { id: districtId, ...payload }, error: null };
};

// ==========================================
// COVERAGE REQUESTS WORKFLOW WITH LOCALSTORAGE FALLBACK & OVERLOAD SUPPORT
// ==========================================

const CUSTOM_COVERAGE_REQUESTS_KEY = 'fixiva_custom_coverage_requests';
const COVERAGE_REQUEST_UPDATES_KEY = 'fixiva_coverage_request_updates';

const getStoredCustomCoverageRequests = () => {
  try {
    const raw = localStorage.getItem(CUSTOM_COVERAGE_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    void e;
    return [];
  }
};

const saveCustomCoverageRequestToStorage = (req) => {
  try {
    const current = getStoredCustomCoverageRequests();
    const filtered = current.filter(r => r.id !== req.id && !(
      (r.phone || r.email || '').toLowerCase() === (req.phone || req.email || '').toLowerCase() &&
      (r.district || '').toLowerCase() === (req.district || '').toLowerCase()
    ));
    localStorage.setItem(CUSTOM_COVERAGE_REQUESTS_KEY, JSON.stringify([req, ...filtered]));
  } catch (err) {
    console.warn('Failed to save coverage request to localStorage:', err);
  }
};

const getStoredCoverageRequestUpdates = () => {
  try {
    const raw = localStorage.getItem(COVERAGE_REQUEST_UPDATES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    void e;
    return {};
  }
};

const saveCoverageRequestUpdateToStorage = (id, updates) => {
  try {
    const map = getStoredCoverageRequestUpdates();
    map[id] = { ...(map[id] || {}), ...updates };
    localStorage.setItem(COVERAGE_REQUEST_UPDATES_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to save coverage request update to localStorage:', err);
  }
};

export const getCoverageRequests = async () => {
  let dbData = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('coverage_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbData = data;
      }
    } catch (e) {
      void e;
    }
  }

  const customList = getStoredCustomCoverageRequests();
  const updatesMap = getStoredCoverageRequestUpdates();

  const combined = [...dbData, ...customList];
  const reqMap = new Map();

  combined.forEach(r => {
    if (!r) return;
    const key = r.id || `${r.district}-${r.email || r.phone}`;
    const updates = updatesMap[r.id] || updatesMap[key];
    const finalItem = updates ? { ...r, ...updates } : r;
    if (!reqMap.has(key)) {
      reqMap.set(key, finalItem);
    }
  });

  return { data: Array.from(reqMap.values()), error: null };
};

export const submitCoverageRequest = async (arg1, arg2, arg3) => {
  let customer_id;
  let customer_name;
  let phone;
  let email;
  let service_id;
  let service_name;
  let state;
  let district;
  let locality;
  let pincode;
  let latitude;
  let longitude;

  if (typeof arg1 === 'object' && arg1 !== null) {
    customer_id = arg1.customer_id || arg1.customerId || null;
    customer_name = arg1.customer_name || arg1.customerName || '';
    phone = arg1.phone || arg1.email || '';
    email = arg1.email || '';
    service_id = arg1.service_id || arg1.serviceId || '';
    service_name = arg1.service_name || arg1.serviceName || 'General Home Services';
    state = arg1.state || arg1.region || '';
    district = arg1.district || arg1.city || '';
    locality = arg1.locality || arg1.area || '';
    pincode = arg1.pincode || '';
    latitude = arg1.latitude || null;
    longitude = arg1.longitude || null;
  } else {
    customer_id = null;
    customer_name = '';
    district = String(arg1 || '').trim();
    state = String(arg2 || '').trim() || '';
    email = String(arg3 || '').trim();
    phone = email;
    service_id = '';
    service_name = 'General Home Services';
    locality = '';
    pincode = '';
    latitude = null;
    longitude = null;
  }

  const cleanDistrict = String(district || '').trim();
  const cleanState = String(state || '').trim() || '';
  const cleanLocality = String(locality || '').trim() || '';
  const cleanContact = String(phone || email || '').trim();

  if (!cleanDistrict || !cleanContact) {
    return { success: false, error: 'Please select a city/district and provide an email or phone number.' };
  }

  const newRequest = {
    id: `req-${Date.now()}`,
    customer_id,
    customer_name: String(customer_name || '').trim() || 'Customer',
    phone: cleanContact,
    email: String(email || cleanContact).trim(),
    service_id,
    service_name: String(service_name || '').trim() || 'General Home Services',
    state: cleanState,
    district: cleanDistrict,
    locality: cleanLocality,
    pincode: String(pincode || '').trim() || null,
    latitude,
    longitude,
    status: 'Pending',
    request_count: 1,
    created_at: new Date().toISOString(),
  };

  let createdData = null;

  if (supabase) {
    try {
      const payload = {
        customer_id: newRequest.customer_id,
        customer_name: newRequest.customer_name,
        phone: newRequest.phone,
        email: newRequest.email,
        service_id: newRequest.service_id,
        service_name: newRequest.service_name,
        state: newRequest.state,
        district: newRequest.district,
        locality: newRequest.locality,
        pincode: newRequest.pincode,
        status: newRequest.status,
        request_count: newRequest.request_count,
      };

      const { data, error } = await supabase.from('coverage_requests').insert(payload).select().maybeSingle();
      if (!error && data) {
        createdData = data;
      } else if (error) {
        // Retry stripped payload if schema mismatch
        const strippedPayload = {
          phone: newRequest.phone,
          email: newRequest.email,
          state: newRequest.state,
          district: newRequest.district,
          status: newRequest.status,
        };
        const retry = await supabase.from('coverage_requests').insert(strippedPayload).select().maybeSingle();
        if (retry.data) {
          createdData = { ...retry.data, locality: newRequest.locality, service_name: newRequest.service_name };
        }
      }
    } catch (e) {
      void e;
    }
  }

  const finalReq = createdData || newRequest;
  saveCustomCoverageRequestToStorage(finalReq);

  return { success: true, data: finalReq, message: "Coverage request submitted successfully! We'll notify you when service expands to your city." };
};

export const updateCoverageRequestStatus = async (id, status, actor = {}) => {
  saveCoverageRequestUpdateToStorage(id, { status });

  if (supabase) {
    try {
      const { data } = await supabase
        .from('coverage_requests')
        .update({ status })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (status === 'Approved' && data && data.district) {
        await supabase
          .from('districts')
          .update({ status: 'Active' })
          .ilike('name', data.district);
        
        await supabase
          .from('cities')
          .update({ status: 'Live' })
          .ilike('name', data.district);
      }
    } catch (e) {
      void e;
    }
  }

  await logAdminAction({
    actorId: actor?.id,
    actorEmail: actor?.email,
    action: 'update_coverage_request_status',
    objectType: 'coverage_request',
    objectId: id,
    payload: { status },
  });

  return { data: { id, status }, error: null };
};
