import { supabase } from '../lib/supabaseClient';
import { logAdminAction } from './auditService';
import { STATES, getDistrictsForState, getAllStaticDistricts, getAllStaticAreas, getLocalitiesForDistrict } from '../data/locationData';

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

export const detectCurrentLocation = async () => {
  const getCoords = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        () => {
          // Retry with lower accuracy if high accuracy times out
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            () => resolve(null),
            { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
          );
        },
        { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 }
      );
    });
  };

  try {
    const coords = await getCoords();
    const lat = coords?.latitude || 23.3700;
    const lng = coords?.longitude || 85.3300;

    if (coords) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
          headers: { 'Accept-Language': 'en' }
        });
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const district = addr.state_district || addr.county || addr.city || addr.district || 'Ranchi';
          const state = addr.state || 'Jharkhand';
          const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.town || addr.village || addr.city_district || 'Lalpur';
          return {
            latitude: lat,
            longitude: lng,
            state,
            district,
            locality,
            pincode: addr.postcode || '834001',
            formattedAddress: `${locality}, ${district}, ${state}`
          };
        }
      } catch (e) {
        console.warn('Reverse geocode fetch failed, using coordinate fallback:', e);
      }
    }

    return {
      latitude: lat,
      longitude: lng,
      state: 'Jharkhand',
      district: 'Ranchi',
      locality: 'Lalpur',
      pincode: '834001',
      formattedAddress: 'Lalpur, Ranchi, Jharkhand 834001'
    };
  } catch (err) {
    console.warn('detectCurrentLocation exception fallback:', err);
    return {
      latitude: 23.3700,
      longitude: 85.3300,
      state: 'Jharkhand',
      district: 'Ranchi',
      locality: 'Lalpur',
      pincode: '834001',
      formattedAddress: 'Lalpur, Ranchi, Jharkhand 834001'
    };
  }
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
// AREA LOCALITIES CRUD & PERSISTENCE
// ==========================================

const CUSTOM_AREAS_KEY = 'fixiva_custom_areas';
const AREA_UPDATES_KEY = 'fixiva_area_updates';
const DELETED_AREAS_KEY = 'fixiva_deleted_areas';

export const getStoredCustomAreas = () => {
  try {
    const raw = localStorage.getItem(CUSTOM_AREAS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    void e;
    return [];
  }
};

export const saveCustomAreaToStorage = (area) => {
  try {
    const list = getStoredCustomAreas();
    const updated = [
      area,
      ...list.filter(a => String(a.id) !== String(area.id) && (a.name || '').toLowerCase() !== (area.name || '').toLowerCase())
    ];
    localStorage.setItem(CUSTOM_AREAS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save custom area to localStorage:', err);
  }
};

export const getStoredAreaUpdates = () => {
  try {
    const raw = localStorage.getItem(AREA_UPDATES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    void e;
    return {};
  }
};

export const saveAreaUpdateToStorage = (id, updates) => {
  try {
    const map = getStoredAreaUpdates();
    map[id] = { ...(map[id] || {}), ...updates };
    localStorage.setItem(AREA_UPDATES_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to save area update to localStorage:', err);
  }
};

export const getStoredDeletedAreas = () => {
  try {
    const raw = localStorage.getItem(DELETED_AREAS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    void e;
    return [];
  }
};

export const saveDeletedAreaToStorage = (id, areaName = '') => {
  try {
    const list = getStoredDeletedAreas();
    const updated = Array.from(new Set([...list, String(id), String(areaName).toLowerCase()].filter(Boolean)));
    localStorage.setItem(DELETED_AREAS_KEY, JSON.stringify(updated));

    // Also purge from custom areas list if present
    const customList = getStoredCustomAreas();
    const filteredCustom = customList.filter(
      a => String(a.id) !== String(id) && (a.name || '').toLowerCase() !== String(areaName).toLowerCase()
    );
    localStorage.setItem(CUSTOM_AREAS_KEY, JSON.stringify(filteredCustom));
  } catch (err) {
    console.warn('Failed to save deleted area to localStorage:', err);
  }
};

export const getAreas = async () => {
  let dbAreas = [];

  if (supabase) {
    try {
      const { data, error } = await supabase.from('areas').select('*').order('name', { ascending: true });
      if (!error && data && data.length > 0) {
        dbAreas = data;
      }
    } catch (e) {
      void e;
    }
  }

  const { data: districts } = await getDistricts();
  const staticAreas = getAllStaticAreas(districts || []);
  const customAreas = getStoredCustomAreas();

  const areaMap = new Map();

  [...staticAreas, ...dbAreas, ...customAreas].forEach(area => {
    if (!area || !area.name) return;
    const key = `${String(area.name).toLowerCase()}_${String(area.city_id || area.district_name || '').toLowerCase()}`;
    areaMap.set(key, area);
  });

  const updatesMap = getStoredAreaUpdates();
  const deletedList = getStoredDeletedAreas();
  const deletedSet = new Set(deletedList.map(d => String(d).toLowerCase()));

  const merged = Array.from(areaMap.values())
    .map(area => {
      const update = updatesMap[area.id] || updatesMap[area.name];
      if (update) {
        return { ...area, ...update };
      }
      return area;
    })
    .filter(area => {
      if (!area || !area.name) return false;
      const isIdDeleted = deletedSet.has(String(area.id).toLowerCase());
      const isNameDeleted = deletedSet.has(String(area.name).toLowerCase());
      return !isIdDeleted && !isNameDeleted;
    });

  return { data: merged, error: null };
};

export const createArea = async (areaData, actor = {}) => {
  const { data: districts } = await getDistricts();
  const matchedCity = (districts || []).find(
    d => String(d.id) === String(areaData.city_id) || String(d.name).toLowerCase() === String(areaData.city_id || areaData.district_name || '').toLowerCase()
  );

  const payload = {
    id: `area-${Date.now()}`,
    name: String(areaData.name || '').trim(),
    city_id: areaData.city_id || matchedCity?.id || `dist-${Date.now()}`,
    district_name: matchedCity ? matchedCity.name : String(areaData.district_name || '').trim(),
    state_name: matchedCity ? (matchedCity.state_name || 'Jharkhand') : String(areaData.state_name || 'Jharkhand').trim(),
    pincode: String(areaData.pincode || '').trim(),
    status: String(areaData.status || 'Active').trim(),
  };

  let dbResult = null;
  if (supabase) {
    try {
      const { data, error } = await supabase.from('areas').insert(payload).select().maybeSingle();
      if (!error && data) {
        dbResult = data;
      }
    } catch (e) {
      void e;
    }
  }

  saveCustomAreaToStorage(payload);

  await logAdminAction({
    actorId: actor?.id,
    actorEmail: actor?.email,
    action: 'create',
    objectType: 'area',
    objectId: dbResult?.id || payload.id,
    payload: areaData,
  });

  return { data: dbResult || payload, error: null };
};

export const updateArea = async (id, updates, actor = {}) => {
  saveAreaUpdateToStorage(id, updates);

  if (supabase) {
    try {
      const { data } = await supabase.from('areas').update(updates).eq('id', id).select().maybeSingle();
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
    objectType: 'area',
    objectId: id,
    payload: updates,
  });

  return { data: { id, ...updates }, error: null };
};

export const deleteArea = async (id, actor = {}) => {
  let areaName = '';
  try {
    const { data: currentAreas } = await getAreas();
    const targetArea = (currentAreas || []).find(a => String(a.id) === String(id));
    if (targetArea) {
      areaName = targetArea.name;
    }
  } catch (e) {
    void e;
  }

  saveDeletedAreaToStorage(id, areaName);

  if (supabase) {
    try {
      await supabase.from('areas').delete().eq('id', id);
    } catch (e) {
      void e;
    }
  }

  await logAdminAction({
    actorId: actor?.id,
    actorEmail: actor?.email,
    action: 'delete',
    objectType: 'area',
    objectId: id,
    payload: { deleted: true },
  });

  return { success: true, error: null };
};

// ==========================================
// BACKWARD COMPATIBILITY ALIAS EXPORTS FOR CMS
// ==========================================

export const getCities = getDistricts;
export const createCity = createDistrict;
export const updateCity = updateDistrict;
export const deleteCity = deleteDistrict;

export const getCoverageRequests = async () => {
  const { getCoverageRequests: getCoverageRequestsFromCoverageService } = await import('./coverageService');
  return getCoverageRequestsFromCoverageService();
};
