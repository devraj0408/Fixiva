import { supabase } from '../lib/supabaseClient';

/**
 * Staff Service - Staff / Employees CRUD Operations for Contractors
 */

export const getStaffByContractor = async (contractorId) => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };
  if (!contractorId) return { data: [], error: 'Contractor ID is required' };

  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase SELECT staff error:', error);
      return { data: [], error: error.message };
    }
    return { data: data || [], error: null };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Exception fetching staff:', err);
    return { data: [], error: errMsg };
  }
};

export const createStaffMember = async (staffData) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

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

  try {
    const { data, error } = await supabase
      .from('staff')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Supabase INSERT staff error:', error);
      return { data: null, error: error.message || 'Failed to insert staff member into Supabase' };
    }

    return { data, error: null };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Exception during staff creation:', err);
    return { data: null, error: errMsg };
  }
};

export const updateStaffMember = async (staffId, updates) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };
  if (!staffId) return { data: null, error: 'Staff ID is required for update' };

  try {
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', staffId)
      .select()
      .single();

    if (error) {
      console.error('Supabase UPDATE staff error:', error);
      return { data: null, error: error.message };
    }
    return { data, error: null };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Exception updating staff:', err);
    return { data: null, error: errMsg };
  }
};

export const deleteStaffMember = async (staffId) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };
  if (!staffId) return { data: null, error: 'Staff ID is required for deletion' };

  try {
    const { data, error } = await supabase
      .from('staff')
      .delete()
      .eq('id', staffId)
      .select();

    if (error) {
      console.error('Supabase DELETE staff error:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Exception during staff deletion:', err);
    return { data: null, error: errMsg };
  }
};
