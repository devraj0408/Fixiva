import { supabase } from '../lib/supabaseClient';
import { logAdminAction } from './auditService';

/**
 * User Service - Customers, Workers, Contractors, and Reviews CRUD Operations
 */

// ==========================================
// CUSTOMERS CRUD
// ==========================================

export const getCustomers = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateCustomerStatus = async (id, account_status, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ account_status })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update_customer_status',
      objectType: 'customer',
      objectId: id,
      payload: { account_status },
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

// ==========================================
// WORKERS & VERIFICATION CRUD
// ==========================================

export const getWorkers = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const [{ data: workers, error: wErr }, { data: profiles, error: pErr }] = await Promise.all([
      supabase.from('workers').select('*'),
      supabase.from('profiles').select('*').eq('role', 'worker'),
    ]);

    if (wErr && pErr) return { data: [], error: wErr?.message || pErr?.message };

    const merged = (workers || []).map((w) => {
      const p = (profiles || []).find((prof) => prof.id === w.id);
      return {
        ...w,
        name: p?.name || 'Service Professional',
        email: p?.email || '',
        phone: p?.phone || '',
        city: w.city || p?.city || '',
        trustScore: w.trust_score ?? 100,
      };
    });

    return { data: merged, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateWorkerVerification = async (id, status, trustScore, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  const updates = { status };
  if (trustScore !== undefined && trustScore !== null) {
    updates.trust_score = Number(trustScore);
  }

  try {
    const { data, error } = await supabase.from('workers').update(updates).eq('id', id).select().maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'verify_worker',
      objectType: 'worker',
      objectId: id,
      payload: updates,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateWorkerProfile = async (id, updates, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('workers').update(updates).eq('id', id).select().maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update_worker_profile',
      objectType: 'worker',
      objectId: id,
      payload: updates,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

// ==========================================
// CONTRACTORS CRUD
// ==========================================

export const getContractors = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const [{ data: contractors, error: cErr }, { data: profiles, error: pErr }] = await Promise.all([
      supabase.from('contractors').select('*'),
      supabase.from('profiles').select('*').eq('role', 'contractor'),
    ]);

    if (cErr && pErr) return { data: [], error: cErr?.message || pErr?.message };

    const merged = (contractors || []).map((c) => {
      const p = (profiles || []).find((prof) => prof.id === c.id);
      return {
        ...c,
        name: p?.name || 'Contractor Owner',
        email: p?.email || '',
        phone: p?.phone || '',
        company: c.company || 'Business Entity',
        city: c.city || p?.city || '',
      };
    });

    return { data: merged, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateContractorStatus = async (id, status, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('contractors').update({ status }).eq('id', id).select().maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update_contractor_status',
      objectType: 'contractor',
      objectId: id,
      payload: { status },
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

// ==========================================
// REVIEWS CRUD
// ==========================================

export const getReviews = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const featureReview = async (id, is_featured, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('reviews').update({ is_featured }).eq('id', id).select().maybeSingle();

    if (error) return { data: { id, is_featured }, error: null };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'feature_review',
      objectType: 'review',
      objectId: id,
      payload: { is_featured },
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const deleteReview = async (id, actor = {}) => {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    await supabase.from('reviews').delete().eq('id', id);

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'delete',
      objectType: 'review',
      objectId: id,
      payload: { deleted: true },
    });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};
