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
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const createService = async (serviceData, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const slugId = serviceData.id || String(serviceData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'service-' + Date.now();
    const normalizedCategory = serviceData.category && String(serviceData.category).trim()
      ? String(serviceData.category).trim()
      : (serviceData.category_id ? String(serviceData.category_id).trim() : 'General');

    const imageUrl = String(serviceData.image_url || serviceData.image || serviceData.icon || '').trim();

    const fullPayload = {
      id: slugId,
      name: String(serviceData.name || '').trim(),
      category: normalizedCategory,
      category_id: serviceData.category_id || null,
      description: String(serviceData.description || '').trim(),
      icon: imageUrl || 'wrench',
      image_url: imageUrl || null,
      image: imageUrl || null,
      base_price: Number.isFinite(Number(serviceData.base_price)) ? Number(serviceData.base_price) : 0,
      platform_fee: Number.isFinite(Number(serviceData.platform_fee)) ? Number(serviceData.platform_fee) : 0,
      inspection_fee: Number.isFinite(Number(serviceData.inspection_fee)) ? Number(serviceData.inspection_fee) : 0,
      active: serviceData.active === true || serviceData.active === 'true' || serviceData.active === 1 || serviceData.active === '1',
    };

    // Attempt 1: Full payload insert
    let { data, error } = await supabase.from('services').insert(fullPayload).select().maybeSingle();

    // Attempt 2: If 'image_url' or 'image' or 'category_id' column is missing from schema
    if (error && error.message && (error.message.includes('image_url') || error.message.includes('column "image"'))) {
      delete fullPayload.image_url;
      delete fullPayload.image;
      const retry = await supabase.from('services').insert(fullPayload).select().maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error && error.message && error.message.includes('category_id')) {
      delete fullPayload.category_id;
      const retry = await supabase.from('services').insert(fullPayload).select().maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error && error.message && (error.message.includes("'category'") || error.message.includes('column "category"'))) {
      delete fullPayload.category;
      const retry = await supabase.from('services').insert(fullPayload).select().maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    // Attempt 4: If invalid input syntax for type (e.g. PK is integer or UUID)
    if (error && error.message && error.message.includes('invalid input syntax')) {
      console.warn('createService: ID type mismatch, retrying without explicit id field:', error.message);
      const payloadNoId = { ...fullPayload };
      delete payloadNoId.id;
      const retry = await supabase.from('services').insert(payloadNoId).select().maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    // Attempt 5: Minimal payload fallback if other column schema mismatches exist
    if (error && error.message && (error.message.includes('column') || error.message.includes('schema cache') || error.message.includes('Could not find'))) {
      console.warn('createService: column mismatch, retrying clean minimal payload:', error.message);
      const cleanPayload = {
        name: String(serviceData.name || '').trim(),
        base_price: Number.isFinite(Number(serviceData.base_price)) ? Number(serviceData.base_price) : 0,
        platform_fee: Number.isFinite(Number(serviceData.platform_fee)) ? Number(serviceData.platform_fee) : 0,
        active: serviceData.active !== false,
      };
      const retryMinimal = await supabase.from('services').insert(cleanPayload).select().maybeSingle();
      if (!retryMinimal.error) {
        data = retryMinimal.data;
        error = null;
      } else {
        error = retryMinimal.error;
      }
    }

    if (error) {
      console.error('createService DB error final:', error);
      return { data: null, error: error.message };
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create',
      objectType: 'service',
      objectId: data?.id || slugId,
      payload: serviceData,
    });

    return { data: data || fullPayload, error: null };
  } catch (err) {
    console.error('createService exception:', err);
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateService = async (id, updates, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const cleanUpdates = { ...updates };
    let { data, error } = await supabase
      .from('services')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error && error.message && (error.message.includes('category_id') || error.message.includes("'category'"))) {
      delete cleanUpdates.category_id;
      delete cleanUpdates.category;
      const retry = await supabase.from('services').update(cleanUpdates).eq('id', id).select().maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error && error.message && error.message.includes('invalid input syntax') && !isNaN(Number(id))) {
      const retry = await supabase.from('services').update(cleanUpdates).eq('id', Number(id)).select().maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('updateService DB error:', error);
      return { data: null, error: error.message };
    }

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
    console.error('updateService exception:', err);
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
    console.error('deleteService exception:', err);
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
    console.error('getCategories exception:', err);
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const createCategory = async (categoryData, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const rawIcon = categoryData.icon !== undefined && categoryData.icon !== null ? String(categoryData.icon).trim() : null;
    const iconValue = rawIcon && rawIcon !== 'tag' && rawIcon !== '' ? rawIcon : null;

    const parsedOrder = parseInt(categoryData.display_order, 10);
    const display_order = isNaN(parsedOrder) ? 0 : parsedOrder;
    const active = Boolean(categoryData.active === true || categoryData.active === 'true' || categoryData.active === 1 || categoryData.active === '1');

    const slugId = String(categoryData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'category-' + Date.now();

    const payloadWithSlug = {
      id: categoryData.id || slugId,
      name: String(categoryData.name || '').trim(),
      icon: iconValue,
      description: String(categoryData.description || '').trim(),
      display_order,
      active,
    };

    const payloadWithoutId = {
      name: String(categoryData.name || '').trim(),
      icon: iconValue,
      description: String(categoryData.description || '').trim(),
      display_order,
      active,
    };

    // Attempt 1: Try inserting with custom slug ID
    let { data, error } = await supabase.from('categories').insert(payloadWithSlug).select().maybeSingle();

    // Attempt 2: If invalid input syntax for type (e.g. DB uses integer/serial or UUID PK), retry without explicit id field
    if (error && error.message && error.message.includes('invalid input syntax')) {
      console.warn('createCategory slug ID type mismatch, retrying without id field:', error.message);
      const retryRes = await supabase.from('categories').insert(payloadWithoutId).select().maybeSingle();
      if (!retryRes.error) {
        data = retryRes.data;
        error = null;
      } else {
        error = retryRes.error;
      }
    }

    // Attempt 3: Fallback for missing column schema errors
    if (error && error.message && (error.message.includes('display_order') || error.message.includes('icon') || error.message.includes('active'))) {
      console.warn('createCategory column mismatch, retrying minimal payload:', error.message);
      const minimalPayload = {
        name: String(categoryData.name || '').trim(),
        description: String(categoryData.description || '').trim(),
      };
      if (!error.message.includes('icon')) minimalPayload.icon = iconValue;
      if (!error.message.includes('display_order')) minimalPayload.display_order = display_order;
      if (!error.message.includes('active')) minimalPayload.active = active;

      const retryMinimal = await supabase.from('categories').insert(minimalPayload).select().maybeSingle();
      if (!retryMinimal.error) {
        data = retryMinimal.data;
        error = null;
      } else {
        error = retryMinimal.error;
      }
    }

    if (error) {
      console.error('createCategory DB error:', error);
      return { data: null, error: error.message };
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create',
      objectType: 'category',
      objectId: data?.id || payloadWithSlug.id,
      payload: categoryData,
    });

    return { data: data || payloadWithSlug, error: null };
  } catch (err) {
    console.error('createCategory exception:', err);
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateCategory = async (id, updates, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const cleanUpdates = { ...updates };
    if (cleanUpdates.icon === 'tag' || cleanUpdates.icon === '') cleanUpdates.icon = null;
    if (cleanUpdates.display_order !== undefined) {
      const order = parseInt(cleanUpdates.display_order, 10);
      cleanUpdates.display_order = isNaN(order) ? 0 : order;
    }

    let { data, error } = await supabase.from('categories').update(cleanUpdates).eq('id', id).select().maybeSingle();

    if (error && error.message && error.message.includes('invalid input syntax') && !isNaN(Number(id))) {
      const numId = Number(id);
      const retry = await supabase.from('categories').update(cleanUpdates).eq('id', numId).select().maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('updateCategory DB error:', error);
      return { data: null, error: error.message };
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
    console.error('updateCategory exception:', err);
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
