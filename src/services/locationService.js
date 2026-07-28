import { supabase } from '../lib/supabaseClient';
import { logAdminAction } from './auditService';
import { STATES, getDistrictsForState, getLocalitiesForDistrict } from '../data/locationData';
import { getCoverageRequests as fetchCoverageRequestsFromService } from './coverageService';

/**
 * Unified Location Service - States, Districts & Geolocation Operations
 * Hierarchy: State -> District -> Locality -> Pincode
 */

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
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    let query = supabase.from('districts').select('*').order('name', { ascending: true });
    
    if (stateName) {
      query = query.ilike('state_name', stateName);
    }

    const { data, error } = await query;

    if (error) {
      const { data: cityData } = await supabase.from('cities').select('*');
      if (cityData && cityData.length > 0) {
        const mappedDistricts = cityData.map(c => ({
          id: c.id,
          name: c.name,
          state_name: c.region || c.state || 'Jharkhand',
          status: c.status === 'Disabled' ? 'Disabled' : 'Active',
          coverage_radius_km: 15
        }));
        const filtered = stateName
          ? mappedDistricts.filter(d => d.state_name.toLowerCase() === stateName.toLowerCase())
          : mappedDistricts;
        return { data: filtered, error: null };
      }

      const hardcodedNames = stateName ? getDistrictsForState(stateName) : [];
      const staticDistricts = hardcodedNames.map((d, idx) => ({
        id: idx + 100,
        name: d,
        state_name: stateName || 'Jharkhand',
        status: 'Active',
        coverage_radius_km: 15
      }));
      return { data: staticDistricts, error: null };
    }

    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const createDistrict = async (districtData, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const payload = {
      state_name: String(districtData.state_name || districtData.state || 'Jharkhand').trim(),
      name: String(districtData.name || districtData.district || '').trim(),
      status: String(districtData.status || 'Active').trim(),
      coverage_radius_km: Number(districtData.coverage_radius_km || 15),
    };

    const { data, error } = await supabase.from('districts').insert(payload).select().maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create',
      objectType: 'district',
      objectId: data?.id || payload.name,
      payload: districtData,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateDistrict = async (id, updates, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('districts')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update',
      objectType: 'district',
      objectId: id,
      payload: updates,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const deleteDistrict = async (id, actor = {}) => {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    const { error } = await supabase.from('districts').delete().eq('id', id);
    if (error) return { success: false, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'delete',
      objectType: 'district',
      objectId: id,
      payload: { deleted: true },
    });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
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
export const deleteArea = async (id) => ({ success: true, error: null });

export const getCoverageRequests = fetchCoverageRequestsFromService;
