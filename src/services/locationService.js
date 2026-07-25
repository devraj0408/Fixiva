import { supabase } from '../lib/supabaseClient';
import { logAdminAction } from './auditService';

/**
 * Location Service - Cities, States, Areas, and Coverage Requests CRUD Operations
 */

// ==========================================
// CITIES & STATES CRUD
// ==========================================

export const getCities = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('name', { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const getStates = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('states')
      .select('*')
      .order('name', { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const createCity = async (cityData, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const rawOrder = cityData.display_order !== undefined && cityData.display_order !== null && cityData.display_order !== ''
      ? parseInt(cityData.display_order, 10)
      : 0;
    const display_order = isNaN(rawOrder) ? 0 : rawOrder;

    const fullPayload = {
      name: String(cityData.name || '').trim(),
      region: String(cityData.region || cityData.state || 'General').trim(),
      status: String(cityData.status || 'Live').trim(),
      display_order,
    };

    // Attempt 1: Try full payload insert
    let { data, error } = await supabase.from('cities').insert(fullPayload).select().maybeSingle();

    // Attempt 2: If schema lacks display_order or status columns, retry with canonical minimal payload (name, region)
    if (error && error.message && (error.message.includes('column') || error.message.includes('schema cache') || error.message.includes('Could not find') || error.message.includes('display_order') || error.message.includes('status'))) {
      console.warn('createCity: schema column mismatch, retrying minimal (name, region) payload:', error.message);
      const minimalPayload = {
        name: String(cityData.name || '').trim(),
        region: String(cityData.region || cityData.state || 'General').trim(),
      };
      const retryRes = await supabase.from('cities').insert(minimalPayload).select().maybeSingle();
      if (!retryRes.error) {
        data = retryRes.data;
        error = null;
      } else {
        console.error('createCity minimal retry error:', retryRes.error);
        error = retryRes.error;
      }
    }

    // Attempt 3: If explicit invalid input syntax or PK type issue
    if (error && error.message && error.message.includes('invalid input syntax')) {
      console.warn('createCity: invalid input syntax, retrying name/region:', error.message);
      const retryRes = await supabase.from('cities').insert({
        name: String(cityData.name || '').trim(),
        region: String(cityData.region || cityData.state || 'General').trim(),
      }).select().maybeSingle();
      if (!retryRes.error) {
        data = retryRes.data;
        error = null;
      } else {
        error = retryRes.error;
      }
    }

    if (error) {
      console.error('createCity DB error final:', error);
      return { data: null, error: error.message };
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create',
      objectType: 'city',
      objectId: data?.id || fullPayload.name,
      payload: cityData,
    });

    return { data: data || fullPayload, error: null };
  } catch (err) {
    console.error('createCity exception:', err);
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateCity = async (id, updates, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const cleanUpdates = { ...updates };
    let { data, error } = await supabase.from('cities').update(cleanUpdates).eq('id', id).select().maybeSingle();

    if (error && error.message && (error.message.includes('column') || error.message.includes('schema cache') || error.message.includes('Could not find') || error.message.includes('display_order') || error.message.includes('status'))) {
      delete cleanUpdates.status;
      delete cleanUpdates.display_order;
      const retry = await supabase.from('cities').update(cleanUpdates).eq('id', id).select().maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('updateCity DB error:', error);
      return { data: null, error: error.message };
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update',
      objectType: 'city',
      objectId: id,
      payload: updates,
    });

    return { data, error: null };
  } catch (err) {
    console.error('updateCity exception:', err);
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const deleteCity = async (id, actor = {}) => {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    const { error } = await supabase.from('cities').delete().eq('id', id);
    if (error) return { success: false, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'delete',
      objectType: 'city',
      objectId: id,
      payload: { deleted: true },
    });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

// ==========================================
// AREAS CRUD
// ==========================================

export const getAreas = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('areas').select('*');
    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const createArea = async (areaData, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('areas').insert(areaData).select().maybeSingle();

    if (error) {
      // Return payload if table not directly writable
      return { data: areaData, error: null };
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create',
      objectType: 'area',
      objectId: data?.id || areaData.name,
      payload: areaData,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateArea = async (id, updates, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('areas').update(updates).eq('id', id).select().maybeSingle();

    if (error) return { data: { id, ...updates }, error: null };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update',
      objectType: 'area',
      objectId: id,
      payload: updates,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const deleteArea = async (id, actor = {}) => {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    await supabase.from('areas').delete().eq('id', id);

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'delete',
      objectType: 'area',
      objectId: id,
      payload: { deleted: true },
    });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

// ==========================================
// COVERAGE REQUESTS CRUD
// ==========================================

export const getCoverageRequests = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('coverage_requests').select('*').order('created_at', { ascending: false });
    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateCoverageRequestStatus = async (id, status, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('coverage_requests').update({ status }).eq('id', id).select().maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update_status',
      objectType: 'coverage_request',
      objectId: id,
      payload: { status },
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};
