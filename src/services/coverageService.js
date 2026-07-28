import { supabase } from '../lib/supabaseClient';
import { logAdminAction } from './auditService';
import { getDistricts } from './locationService';

/**
 * Single Coverage Service - District Coverage Management & Coverage Requests Workflow
 * Supabase Single Source of Truth
 */

// ==========================================
// DISTRICT COVERAGE MANAGEMENT
// ==========================================

export const getDistrictCoverageList = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    // 1. Fetch Districts
    const { data: districts, error: distErr } = await getDistricts();
    if (distErr) return { data: [], error: distErr };

    // 2. Fetch Workers count per district
    const { data: workers } = await supabase
      .from('workers')
      .select('id, district, city, status');

    // 3. Fetch Contractors count per district
    const { data: contractors } = await supabase
      .from('contractors')
      .select('id, district, city, status');

    // 4. Fetch Active Bookings per district
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, district, city, status');

    // 5. Fetch Coverage Requests per district
    const { data: requests } = await supabase
      .from('coverage_requests')
      .select('id, district, status');

    // Map aggregated metrics to each District
    const aggregated = (districts || []).map(dist => {
      const distName = (dist.name || '').toLowerCase();
      
      const workerCount = (workers || []).filter(w => 
        ((w.district || w.city || '').toLowerCase() === distName) && w.status !== 'Disabled'
      ).length;

      const contractorCount = (contractors || []).filter(c => 
        ((c.district || c.city || '').toLowerCase() === distName) && c.status !== 'Disabled'
      ).length;

      const bookingCount = (bookings || []).filter(b => 
        ((b.district || b.city || '').toLowerCase() === distName)
      ).length;

      const requestCount = (requests || []).filter(r => 
        ((r.district || '').toLowerCase() === distName)
      ).length;

      return {
        ...dist,
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

export const isDistrictActive = async (stateName, districtName) => {
  if (!districtName) return false;
  if (!supabase) return true;

  try {
    const { data } = await supabase
      .from('districts')
      .select('status')
      .ilike('name', districtName.trim())
      .maybeSingle();

    if (data) {
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

    // Default: if in primary operating list (Ranchi, Jamshedpur, Dhanbad, Bokaro, Deoghar, Patna, Lucknow, Kolkata, New Delhi, Noida, Gurugram, Bhubaneswar)
    const activeDefaults = [
      'ranchi', 'jamshedpur', 'dhanbad', 'bokaro', 'deoghar', 
      'patna', 'lucknow', 'kolkata', 'new delhi', 'noida', 'gurugram', 'bhubaneswar'
    ];
    return activeDefaults.includes(districtName.toLowerCase());
  } catch {
    return true;
  }
};

export const updateDistrictStatus = async (districtId, status, coverage_radius_km = 15, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const payload = { status, coverage_radius_km: Number(coverage_radius_km) };

    let { data, error } = await supabase
      .from('districts')
      .update(payload)
      .eq('id', districtId)
      .select()
      .maybeSingle();

    // Fallback: update legacy cities table if district ID is numeric matching city
    if (error || !data) {
      const legacyRes = await supabase
        .from('cities')
        .update({ status: status === 'Active' ? 'Live' : status })
        .eq('id', districtId)
        .select()
        .maybeSingle();
      data = legacyRes.data;
      error = legacyRes.error;
    }

    if (error) {
      console.error('updateDistrictStatus DB error:', error);
      return { data: null, error: error.message };
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update_district_status',
      objectType: 'district',
      objectId: districtId,
      payload: { status, coverage_radius_km },
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

// ==========================================
// COVERAGE REQUESTS WORKFLOW
// ==========================================

export const getCoverageRequests = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('coverage_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('getCoverageRequests error:', error.message);
      return { data: [], error: error.message };
    }
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const submitCoverageRequest = async ({
  customer_id = null,
  customer_name = '',
  phone = '',
  email = '',
  service_id = '',
  service_name = 'General Home Services',
  state = 'Jharkhand',
  district = '',
  locality = '',
  pincode = '',
  latitude = null,
  longitude = null
}) => {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };
  if (!district.trim() || !locality.trim() || (!phone.trim() && !email.trim())) {
    return { success: false, error: 'Please provide all location and contact details.' };
  }

  try {
    const payload = {
      customer_id,
      customer_name: customer_name.trim() || 'Customer',
      phone: phone.trim() || email.trim(),
      email: email.trim(),
      service_id,
      service_name: service_name.trim(),
      state: state.trim() || 'Jharkhand',
      district: district.trim(),
      locality: locality.trim(),
      pincode: pincode.trim() || null,
      latitude,
      longitude,
      status: 'Pending',
      request_count: 1
    };

    // Check for duplicate request from same phone/email for same service and locality
    const { data: existing } = await supabase
      .from('coverage_requests')
      .select('id, request_count')
      .eq('phone', payload.phone)
      .ilike('district', payload.district)
      .ilike('locality', payload.locality)
      .maybeSingle();

    if (existing) {
      // Increment request count instead of failing or inserting duplicate
      await supabase
        .from('coverage_requests')
        .update({ request_count: (existing.request_count || 1) + 1 })
        .eq('id', existing.id);

      return { success: true, duplicate: true, message: "You've already requested coverage for this locality. Request updated!" };
    }

    const { data, error } = await supabase
      .from('coverage_requests')
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23505' || String(error.message || '').toLowerCase().includes('unique')) {
        return { success: true, duplicate: true, message: "You've already requested coverage for this locality." };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateCoverageRequestStatus = async (id, status, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('coverage_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) return { data: null, error: error.message };

    // If request is Approved, automatically activate the corresponding District in `districts` table!
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

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update_coverage_request_status',
      objectType: 'coverage_request',
      objectId: id,
      payload: { status },
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};
