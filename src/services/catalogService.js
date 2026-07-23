import { supabase } from '../lib/supabaseClient';
import { logAdminAction } from './auditService';

/**
 * Catalog Service - Services, Categories, and Pricing Rules CRUD Operations
 */

// ==========================================
// SERVICES CRUD
// ==========================================

export const getServices = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name', { ascending: true });

    if (error) return { data: [], error: error.message };
    const activeServices = (data || []).filter((s) => s.active !== false);
    return { data: activeServices, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const createService = async (serviceData, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  const id = serviceData.id || serviceData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const payload = {
    id,
    name: serviceData.name,
    category: serviceData.category || 'General',
    description: serviceData.description || '',
    icon: serviceData.icon || 'wrench',
    base_price: Number(serviceData.base_price || 0),
    platform_fee: Number(serviceData.platform_fee || 0),
    inspection_fee: Number(serviceData.inspection_fee || 0),
    active: serviceData.active !== false,
  };

  try {
    const { data, error } = await supabase.from('services').insert(payload).select().maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create',
      objectType: 'service',
      objectId: id,
      payload: serviceData,
    });

    return { data: data || payload, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateService = async (id, updates, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update',
      objectType: 'service',
      objectId: id,
      payload: updates,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const toggleServiceActive = async (id, active, actor = {}) => {
  return updateService(id, { active }, actor);
};

export const deleteService = async (id, actor = {}) => {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  if (!id) {
    return { success: false, error: 'Service ID is required for deletion', deleteType: null, message: null };
  }

  try {
    const hardDeleteRes = await supabase
      .from('services')
      .delete()
      .eq('id', id)
      .select();

    let deleteType = 'hard_delete';
    let message = 'Service permanently deleted.';

    if (hardDeleteRes.error || !hardDeleteRes.data || hardDeleteRes.data.length === 0) {
      const softDeleteRes = await supabase
        .from('services')
        .update({ active: false })
        .eq('id', id)
        .select();

      if (softDeleteRes.error) {
        return { success: false, error: softDeleteRes.error.message, deleteType: null, message: null };
      }

      deleteType = 'soft_delete';
      message = 'This service is used in existing records and has been archived instead of permanently deleted.';
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'delete_service',
      objectType: 'service',
      objectId: id,
      payload: { delete_type: deleteType, reason: deleteType === 'soft_delete' ? 'foreign_key_dependencies_or_rls' : 'unused_service' },
    });

    return { success: true, error: null, deleteType, message };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err), deleteType: null, message: null };
  }
};

// ==========================================
// CATEGORIES CRUD
// ==========================================

export const getCategories = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const createCategory = async (categoryData, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  const id = categoryData.id || categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const payload = {
    id,
    name: categoryData.name,
    icon: categoryData.icon || 'tag',
    description: categoryData.description || '',
    display_order: Number(categoryData.display_order || 0),
    active: categoryData.active !== false,
  };

  try {
    const { data, error } = await supabase.from('categories').insert(payload).select().maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create',
      objectType: 'category',
      objectId: id,
      payload: categoryData,
    });

    return { data: data || payload, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateCategory = async (id, updates, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update',
      objectType: 'category',
      objectId: id,
      payload: updates,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const deleteCategory = async (id, actor = {}) => {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    await supabase.from('categories').delete().eq('id', id);

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'delete',
      objectType: 'category',
      objectId: id,
      payload: { deleted: true },
    });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

// ==========================================
// PRICING RULES CRUD
// ==========================================

export const getPricingRules = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('pricing_rules').select('*');
    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const createPricingRule = async (ruleData, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('pricing_rules').insert(ruleData).select().maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create',
      objectType: 'pricing_rule',
      objectId: data?.id || '',
      payload: ruleData,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updatePricingRule = async (id, updates, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('pricing_rules').update(updates).eq('id', id).select().maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update',
      objectType: 'pricing_rule',
      objectId: id,
      payload: updates,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const deletePricingRule = async (id, actor = {}) => {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    const { error } = await supabase.from('pricing_rules').delete().eq('id', id);
    if (error) return { success: false, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'delete',
      objectType: 'pricing_rule',
      objectId: id,
      payload: { deleted: true },
    });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};
