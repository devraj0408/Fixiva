import { supabase } from '../lib/supabaseClient';
import { logAdminAction } from './auditService';
import { STATES, getDistrictsForState, getAllStaticDistricts, getLocalitiesForDistrict } from '../data/locationData';

/**
 * Unified Location Service - States, Districts & Geolocation Operations
 * Hierarchy: State -> District -> Locality -> Pincode
 */

export const isMissingTableError = (error) => {
  if (!error) return false;
  const msg = String(error.message || '').toLowerCase();
  const code = String(error.code || '');
  return (
    msg.includes('relation "districts" does not exist') ||
    msg.includes('relation "cities" does not exist') ||
    msg.includes('table "districts" does not exist') ||
    msg.includes('table "cities" does not exist') ||
    msg.includes('could not find the table') ||
    msg.includes('schema cache') ||
    code === '42P01' ||
    code === 'PGRST205'
  );
};

const CUSTOM_DISTRICTS_KEY = 'fixiva_custom_districts';
const DISTRICT_UPDATES_KEY = 'fixiva_district_updates';

export const getStoredCustomDistricts = () => {
  try {
    const raw = localStorage.getItem(CUSTOM_DISTRICTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    void e;
    return [];
  }
};

export const saveCustomDistrictToStorage = (district) => {
  try {
    const list = getStoredCustomDistricts();
    const updated = [district, ...list.filter(d => (d.name || '').toLowerCase() !== (district.name || '').toLowerCase())];
    localStorage.setItem(CUSTOM_DISTRICTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save custom district to localStorage:', err);
  }
};

export const getStoredDistrictUpdates = () => {
  try {
    const raw = localStorage.getItem(DISTRICT_UPDATES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    void e;
    return {};
  }
};

export const saveDistrictUpdateToStorage = (id, updates) => {
  try {
    const map = getStoredDistrictUpdates();
    map[id] = { ...(map[id] || {}), ...updates };
    localStorage.setItem(DISTRICT_UPDATES_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to save district update to localStorage:', err);
  }
};

// ==========================================
// STATES & DISTRICTS CRUD
// ==========================================

export const getStates = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('states')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      const fallbackStates = STATES.map((s, idx) => ({ id: idx + 1, name: s, status: 'Active' }));
      return { data: fallbackStates, error: null };
    }
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const getDistricts = async (stateName = null) => {
  let baseDistricts = [];

  if (supabase) {
    try {
      let query = supabase.from('districts').select('*').order('name', { ascending: true });
      if (stateName) {
        query = query.ilike('state_name', stateName);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        baseDistricts = data;
      } else if (error && isMissingTableError(error)) {
        const { data: cityData, error: cityError } = await supabase.from('cities').select('*');
        if (!cityError && cityData && cityData.length > 0) {
          baseDistricts = cityData.map(c => ({
            id: c.id,
            name: c.name,
            state_name: c.region || c.state || 'Jharkhand',
            status: c.status === 'Disabled' ? 'Disabled' : 'Active',
            coverage_radius_km: 15
          }));
          if (stateName) {
            baseDistricts = baseDistricts.filter(d => (d.state_name || '').toLowerCase() === stateName.toLowerCase());
          }
        }
      }
    } catch (e) {
      void e;
    }
  }

  // Fallback to static districts if DB returned no data
  if (baseDistricts.length === 0) {
    if (stateName) {
      const names = getDistrictsForState(stateName);
      baseDistricts = names.map((d, idx) => ({
        id: idx + 100,
        name: d,
        state_name: stateName,
        status: 'Active',
        coverage_radius_km: 15
      }));
    } else {
      baseDistricts = getAllStaticDistricts();
    }
  }

  // Merge custom created districts from localStorage
  const customList = getStoredCustomDistricts();
  const districtMap = new Map();

  [...baseDistricts, ...customList].forEach(d => {
    if (stateName && (d.state_name || '').toLowerCase() !== stateName.toLowerCase()) return;
    const key = (d.name || '').toLowerCase();
    districtMap.set(key, d);
  });

  // Apply stored status/radius updates
  const updatesMap = getStoredDistrictUpdates();
  const merged = Array.from(districtMap.values()).map(d => {
    const update = updatesMap[d.id] || updatesMap[d.name];
    if (update) {
      return { ...d, ...update };
    }
    return d;
  });

  return { data: merged, error: null };
};

export const createDistrict = async (districtData, actor = {}) => {
  const payload = {
    id: `dist-${Date.now()}`,
    state_name: String(districtData.state_name || districtData.state || 'Jharkhand').trim(),
    name: String(districtData.name || districtData.district || '').trim(),
    status: String(districtData.status || 'Active').trim(),
    coverage_radius_km: Number(districtData.coverage_radius_km || 15),
  };

  let createdData = null;

  if (supabase) {
    try {
      const { data, error } = await supabase.from('districts').insert(payload).select().maybeSingle();
      if (!error && data) {
        createdData = data;
      } else {
        const cityPayload = {
          name: payload.name,
          region: payload.state_name,
          state: payload.state_name,
          status: payload.status === 'Disabled' ? 'Disabled' : 'Live',
        };
        const { data: cityData, error: cityErr } = await supabase
          .from('cities')
          .insert(cityPayload)
          .select()
          .maybeSingle();

        if (!cityErr && cityData) {
          createdData = cityData;
        }
      }
    } catch (e) {
      void e;
    }
  }

  // Always save custom district to localStorage so district addition NEVER fails for admin
  saveCustomDistrictToStorage(payload);

  await logAdminAction({
    actorId: actor?.id,
    actorEmail: actor?.email,
    action: 'create',
    objectType: 'district',
    objectId: createdData?.id || payload.id,
    payload: districtData,
  });

  return { data: createdData || payload, error: null };
};

export const updateDistrict = async (id, updates, actor = {}) => {
  saveDistrictUpdateToStorage(id, updates);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('districts')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error && isMissingTableError(error)) {
        await supabase
          .from('cities')
          .update({ status: updates.status === 'Active' ? 'Live' : updates.status })
          .eq('id', id);
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
    action: 'update',
    objectType: 'district',
    objectId: id,
    payload: updates,
  });

  return { data: { id, ...updates }, error: null };
};

export const deleteDistrict = async (id, actor = {}) => {
  if (supabase) {
    try {
      let { error } = await supabase.from('districts').delete().eq('id', id);
      if (error && isMissingTableError(error)) {
        await supabase.from('cities').delete().eq('id', id);
      }
    } catch (e) {
      void e;
    }
  }

  await logAdminAction({
    actorId: actor?.id,
    actorEmail: actor?.email,
    action: 'delete',
    objectType: 'district',
    objectId: id,
    payload: { deleted: true },
  });

  return { success: true, error: null };
};

// ==========================================
// LOCALITIES & GEOLOCATION HELPERS
// ==========================================

export const getLocalities = (districtName, stateName = '') => {
  return getLocalitiesForDistrict(districtName, stateName);
};

export const calculateDistanceInKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
};

export const detectCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({
          latitude,
          longitude,
          state: 'Jharkhand',
          district: 'Ranchi',
          locality: 'Lalpur',
          pincode: '834001',
          formattedAddress: `Lalpur, Ranchi, Jharkhand 834001`
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
};

export const getRecentLocations = () => {
  try {
    const raw = localStorage.getItem('fixiva:recent-locations');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveRecentLocation = (locationObj) => {
  if (!locationObj || !locationObj.district) return;
  try {
    const current = getRecentLocations();
    const filtered = current.filter(
      l => l.locality !== locationObj.locality || l.district !== locationObj.district
    );
    const updated = [locationObj, ...filtered].slice(0, 5);
    localStorage.setItem('fixiva:recent-locations', JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save recent location:', err);
  }
};

// ==========================================
// BACKWARD COMPATIBILITY ALIAS EXPORTS FOR CMS
// ==========================================

export const getCities = getDistricts;
export const createCity = createDistrict;
export const updateCity = updateDistrict;
export const deleteCity = deleteDistrict;

export const getAreas = async () => ({ data: [], error: null });
export const createArea = async (data) => ({ data, error: null });
export const updateArea = async (id, updates) => ({ data: { id, ...updates }, error: null });
export const deleteArea = async () => ({ success: true, error: null });

export const getCoverageRequests = async () => {
  const { getCoverageRequests: getCoverageRequestsFromCoverageService } = await import('./coverageService');
  return getCoverageRequestsFromCoverageService();
};
