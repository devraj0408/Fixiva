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

import { calculateWorkerTrustScore } from './trustScoreService';

export const getWorkers = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    let workers = [];
    let profiles = [];
    let bookings = [];
    let reviews = [];
    let tickets = [];
    let wErr = null;
    let pErr = null;

    try {
      const [wRes, pRes, bRes, rRes, tRes] = await Promise.all([
        supabase.from('workers').select('*'),
        supabase.from('profiles').select('*').eq('role', 'worker'),
        supabase.from('bookings').select('*'),
        supabase.from('reviews').select('*'),
        supabase.from('support_tickets').select('*'),
      ]);
      workers = wRes.data || [];
      profiles = pRes.data || [];
      bookings = bRes.data || [];
      reviews = rRes.data || [];
      tickets = tRes.data || [];
      wErr = wRes.error;
      pErr = pRes.error;
    } catch (e) {
      console.warn('getWorkers RLS query fallback:', e);
    }

    if (wErr && pErr && workers.length === 0 && profiles.length === 0) return { data: [], error: wErr?.message || pErr?.message };

    const workerMap = new Map();

    (workers || []).forEach((w) => {
      workerMap.set(w.id, { ...w });
    });

    (profiles || []).forEach((p) => {
      const existing = workerMap.get(p.id) || { id: p.id, status: 'Active' };
      workerMap.set(p.id, { ...existing, profile: p });
    });

    // Scan localStorage for registered worker profiles
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

    // Default directory of verified specialists
    const VERIFIED_SPECIALISTS = [
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

    VERIFIED_SPECIALISTS.forEach(dw => {
      const alreadyExists = Array.from(workerMap.values()).some(
        w => (w.email && dw.email && w.email.toLowerCase() === dw.email.toLowerCase()) || w.id === dw.id
      );
      if (!alreadyExists) {
        workerMap.set(dw.id, { ...dw, source: 'verified_directory' });
      }
    });

    const merged = Array.from(workerMap.values()).map((w) => {
      const p = w.profile || (profiles || []).find((prof) => prof.id === w.id);
      const fullWorker = {
        ...w,
        name: p?.name || w.name || 'Service Professional',
        email: p?.email || w.email || '',
        phone: p?.phone || w.phone || w.whatsapp || '',
        city: w.city || p?.city || '',
        district: w.district || p?.district || w.city || p?.city || '',
        status: w.status || p?.account_status || 'Active',
        profile: p,
      };

      const trustDetails = calculateWorkerTrustScore(fullWorker, bookings, reviews, tickets);

      return {
        ...fullWorker,
        trust_score: trustDetails.score,
        trustScore: trustDetails.score,
        trustScoreDetails: trustDetails,
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
    let contractors = [];
    let profiles = [];
    let cErr = null;
    let pErr = null;

    try {
      const [cRes, pRes] = await Promise.all([
        supabase.from('contractors').select('*'),
        supabase.from('profiles').select('*').eq('role', 'contractor'),
      ]);
      contractors = cRes.data || [];
      profiles = pRes.data || [];
      cErr = cRes.error;
      pErr = pRes.error;
    } catch (e) {
      console.warn('getContractors RLS query fallback:', e);
    }

    if (cErr && pErr && contractors.length === 0 && profiles.length === 0) return { data: [], error: cErr?.message || pErr?.message };

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
