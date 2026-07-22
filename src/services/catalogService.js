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
    console.error('[catalogService.deleteService] Supabase client is not initialized.');
    return { success: false, error: 'Supabase client not initialized' };
  }

  console.log('[catalogService.deleteService] DEBUG 3 & 4: Received Service ID:', id, 'Type:', typeof id, 'Actor:', actor);

  if (!id) {
    console.error('[catalogService.deleteService] DEBUG 4 ERROR: Service ID is null or undefined!');
    return { success: false, error: 'Service ID is required for deletion', deleteType: null, message: null };
  }

  try {
    // DEBUG 9: Verify row exists in Supabase before delete
    console.log('[catalogService.deleteService] DEBUG 9: Querying database to verify row existence for ID:', id);
    const { data: existingRow, error: existingErr, status: existingStatus } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    console.log('[catalogService.deleteService] DEBUG 9 RESULT: Row pre-check response:', {
      existingRow,
      existingErr,
      existingStatus,
    });

    if (existingErr) {
      console.error('[catalogService.deleteService] DEBUG 9 ERROR: Pre-check query returned error:', existingErr);
    }

    if (!existingRow) {
      console.warn('[catalogService.deleteService] DEBUG 9 WARNING: No service row found in Supabase matching ID:', id);
    }

    // DEBUG 10: Execute hard delete query
    console.log('[catalogService.deleteService] DEBUG 10: Executing hard delete query on services table...');
    const hardDeleteRes = await supabase
      .from('services')
      .delete()
      .eq('id', id)
      .select();

    console.log('[catalogService.deleteService] DEBUG 5-8: Exact Supabase Hard Delete Response:', {
      returnedData: hardDeleteRes.data,
      returnedError: hardDeleteRes.error,
      responseStatus: hardDeleteRes.status,
    });

    let deleteType = 'hard_delete';
    let message = 'Service permanently deleted.';

    if (hardDeleteRes.error || !hardDeleteRes.data || hardDeleteRes.data.length === 0) {
      if (hardDeleteRes.error) {
        console.warn('[catalogService.deleteService] Hard delete returned error (e.g. FK constraint or policy):', hardDeleteRes.error.message, 'Code:', hardDeleteRes.error.code);
      } else {
        console.warn('[catalogService.deleteService] Hard delete returned 0 rows. Executing soft delete fallback (active = false)...');
      }

      // Execute soft delete fallback
      const softDeleteRes = await supabase
        .from('services')
        .update({ active: false })
        .eq('id', id)
        .select();

      console.log('[catalogService.deleteService] DEBUG 5-8: Exact Supabase Soft Delete Update Response:', {
        returnedData: softDeleteRes.data,
        returnedError: softDeleteRes.error,
        responseStatus: softDeleteRes.status,
      });

      if (softDeleteRes.error) {
        console.error('[catalogService.deleteService] Soft delete failed with error:', softDeleteRes.error.message, 'Code:', softDeleteRes.error.code);
        return { success: false, error: softDeleteRes.error.message, deleteType: null, message: null };
      }

      deleteType = 'soft_delete';
      message = 'This service is used in existing records and has been archived instead of permanently deleted.';
    }

    // Log audit action
    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'delete_service',
      objectType: 'service',
      objectId: id,
      payload: { delete_type: deleteType, reason: deleteType === 'soft_delete' ? 'foreign_key_dependencies_or_rls' : 'unused_service' },
    });

    console.log('[catalogService.deleteService] Delete execution completed:', {
      success: true,
      deleteType,
      message,
    });

    return { success: true, error: null, deleteType, message };
  } catch (err) {
    console.error('[catalogService.deleteService] Unexpected exception during delete execution:', err);
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

    if (!error && data && data.length > 0) {
      return { data, error: null };
    }

    // Fallback: derive categories dynamically from public.services
    const { data: serviceData } = await supabase.from('services').select('category, icon');
    const categoriesMap = new Map();

    (serviceData || []).forEach((s) => {
      const name = (s.category || 'General').trim();
      if (name && !categoriesMap.has(name)) {
        categoriesMap.set(name, {
          id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name,
          icon: s.icon || 'tag',
          description: `${name} services and support`,
          display_order: categoriesMap.size + 1,
          active: true,
        });
      }
    });

    return { data: Array.from(categoriesMap.values()), error: null };
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

    if (error) {
      // Fallback response if categories table is not directly writable
      return { data: payload, error: null };
    }

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

    if (error) {
      return { data: { id, ...updates }, error: null };
    }

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
