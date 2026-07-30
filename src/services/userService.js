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
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };

    const customers = (data || []).filter((p) => {
      const role = String(p.role || '').trim().toLowerCase();
      return role === 'customer' || role === 'user' || role === 'client' || (!role && p.email);
    });

    return { data: customers, error: null };
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
// WORKERS CRUD
// ==========================================

export const getWorkers = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const [{ data: workers, error: wErr }, { data: profiles, error: pErr }] = await Promise.all([
      supabase.from('workers').select('*'),
      supabase.from('profiles').select('*').eq('role', 'worker'),
    ]);

    if (wErr && pErr) return { data: [], error: wErr?.message || pErr?.message };

    const workerMap = new Map();

    (workers || []).forEach((w) => {
      workerMap.set(w.id, { ...w });
    });

    (profiles || []).forEach((p) => {
      const existing = workerMap.get(p.id) || { id: p.id, status: 'Active', trust_score: 100 };
      workerMap.set(p.id, { ...existing, profile: p });
    });

    const merged = Array.from(workerMap.values()).map((w) => {
      const p = w.profile || (profiles || []).find((prof) => prof.id === w.id);
      return {
        ...w,
        name: p?.name || 'Service Professional',
        email: p?.email || '',
        phone: p?.phone || '',
        city: w.city || p?.city || '',
        trustScore: w.trust_score ?? 100,
        status: w.status || 'Active',
      };
    });

    return { data: merged, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
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

    const contractorMap = new Map();

    (contractors || []).forEach((c) => {
      contractorMap.set(c.id, { ...c });
    });

    (profiles || []).forEach((p) => {
      const existing = contractorMap.get(p.id) || { id: p.id, status: 'Active', company: p.name || 'Business Entity' };
      contractorMap.set(p.id, { ...existing, profile: p });
    });

    const merged = Array.from(contractorMap.values()).map((c) => {
      const p = c.profile || (profiles || []).find((prof) => prof.id === c.id);
      return {
        ...c,
        name: p?.name || 'Contractor Owner',
        email: p?.email || '',
        phone: p?.phone || '',
        company: c.company || p?.name || 'Business Entity',
        city: c.city || p?.city || '',
        status: c.status || 'Active',
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
