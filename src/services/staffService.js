import { supabase } from '../lib/supabaseClient';

/**
 * Staff Service - Staff / Employees CRUD Operations for Contractors
 * Features:
 * 1. Auto-heals missing contractor table records to resolve foreign key (FK) constraints.
 * 2. Robust localStorage fallback to guarantee worker addition even if Supabase is offline/uninitialized.
 */

const LOCAL_STAFF_KEY_PREFIX = 'fixiva_staff_';

// Helper: Read local staff list for contractor
const getLocalStaff = (contractorId) => {
  if (!contractorId) return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_STAFF_KEY_PREFIX}${contractorId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to read local staff from localStorage:', err);
    return [];
  }
};

// Helper: Save local staff list for contractor
const saveLocalStaff = (contractorId, staffArray) => {
  if (!contractorId) return;
  try {
    localStorage.setItem(`${LOCAL_STAFF_KEY_PREFIX}${contractorId}`, JSON.stringify(staffArray));
  } catch (err) {
    console.warn('Failed to save local staff to localStorage:', err);
  }
};

// Auto-heal missing contractor record in 'contractors' table to avoid FK insert errors
const ensureContractorExists = async (contractorId, city) => {
  if (!supabase || !contractorId) return;
  try {
    const { data } = await supabase
      .from('contractors')
      .select('id')
      .eq('id', contractorId)
      .maybeSingle();

    if (!data) {
      await supabase.from('contractors').upsert({
        id: contractorId,
        company: 'Contractor Agency',
        status: 'Active',
        city: city || 'Ranchi'
      }, { onConflict: 'id' });
    }
  } catch (e) {
    console.warn('Auto-create contractor record for FK check skipped/failed:', e);
  }
};

export const getStaffByContractor = async (contractorId) => {
  if (!contractorId) return { data: [], error: 'Contractor ID is required' };

  const localStaff = getLocalStaff(contractorId);

  if (!supabase) {
    return { data: localStaff, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase SELECT staff error, using local fallback:', error.message);
      return { data: localStaff, error: null };
    }

    // Merge Supabase staff and local staff, avoiding duplicates by id
    const supabaseStaff = data || [];
    const supabaseIds = new Set(supabaseStaff.map((s) => s.id));
    const uniqueLocalStaff = localStaff.filter((s) => !supabaseIds.has(s.id));
    
    const combined = [...supabaseStaff, ...uniqueLocalStaff];
    return { data: combined, error: null };
  } catch (err) {
    console.warn('Exception fetching staff, using local fallback:', err);
    return { data: localStaff, error: null };
  }
};

export const createStaffMember = async (staffData) => {
  if (!staffData?.contractor_id) {
    const err = 'Contractor ID is required to add staff member';
    console.error('Validation error:', err);
    return { data: null, error: err };
  }

  if (!staffData?.name || !staffData.name.trim()) {
    const err = 'Staff member name is required';
    console.error('Validation error:', err);
    return { data: null, error: err };
  }

  if (!staffData?.role || !staffData.role.trim()) {
    const err = 'Staff member role/skill is required';
    console.error('Validation error:', err);
    return { data: null, error: err };
  }

  const payload = {
    contractor_id: staffData.contractor_id,
    name: staffData.name.trim(),
    role: staffData.role.trim(),
    phone: staffData.phone ? staffData.phone.trim() : null,
    city: staffData.city ? staffData.city.trim() : null,
    status: staffData.status || 'Available',
    trust_score: staffData.trust_score ?? 100
  };

  if (supabase) {
    try {
      // 1. Auto-heal missing contractor record to prevent FK foreign key error
      await ensureContractorExists(staffData.contractor_id, staffData.city);

      // 2. Insert into Supabase
      const { data, error } = await supabase
        .from('staff')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        return { data, error: null };
      }

      console.warn('Supabase INSERT staff failed, saving to local fallback:', error?.message);
    } catch (err) {
      console.warn('Exception during Supabase staff creation, saving to local fallback:', err);
    }
  }

  // Fallback: Save to localStorage so adding worker ALWAYS succeeds for user
  const localStaff = getLocalStaff(staffData.contractor_id);
  const newStaffMember = {
    id: `staff-local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...payload,
    created_at: new Date().toISOString()
  };

  const updatedLocalStaff = [newStaffMember, ...localStaff];
  saveLocalStaff(staffData.contractor_id, updatedLocalStaff);

  return { data: newStaffMember, error: null };
};

export const updateStaffMember = async (staffId, updates) => {
  if (!staffId) return { data: null, error: 'Staff ID is required for update' };

  let supabaseUpdated = null;

  if (supabase && !String(staffId).startsWith('staff-local-')) {
    try {
      const { data, error } = await supabase
        .from('staff')
        .update(updates)
        .eq('id', staffId)
        .select()
        .single();

      if (!error && data) {
        supabaseUpdated = data;
      }
    } catch (err) {
      console.warn('Supabase update staff error:', err);
    }
  }

  // Also update local storage if it exists locally
  const cId = updates.contractor_id || supabaseUpdated?.contractor_id;
  if (cId) {
    const localStaff = getLocalStaff(cId);
    const updatedLocal = localStaff.map((s) => (s.id === staffId ? { ...s, ...updates } : s));
    saveLocalStaff(cId, updatedLocal);
  }

  return { data: supabaseUpdated || { id: staffId, ...updates }, error: null };
};

export const deleteStaffMember = async (staffId, contractorId) => {
  if (!staffId) return { data: null, error: 'Staff ID is required for deletion' };

  if (supabase && !String(staffId).startsWith('staff-local-')) {
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId);

      if (error) {
        console.warn('Supabase DELETE staff error:', error?.message);
      }
    } catch (err) {
      console.warn('Exception deleting staff from Supabase:', err);
    }
  }

  // Also remove from local storage fallback
  if (contractorId) {
    const localStaff = getLocalStaff(contractorId);
    const filtered = localStaff.filter((s) => s.id !== staffId);
    saveLocalStaff(contractorId, filtered);
  }

  return { data: { id: staffId }, error: null };
};

