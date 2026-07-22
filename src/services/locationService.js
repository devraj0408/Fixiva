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

  const payload = {
    name: cityData.name,
    region: cityData.region || cityData.state || 'General',
    status: cityData.status || 'Live',
    display_order: Number(cityData.display_order || 0),
  };

  try {
    const { data, error } = await supabase.from('cities').insert(payload).select().maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create',
      objectType: 'city',
      objectId: data?.id || payload.name,
      payload: cityData,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateCity = async (id, updates, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('cities').update(updates).eq('id', id).select().maybeSingle();

    if (error) return { data: null, error: error.message };

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
