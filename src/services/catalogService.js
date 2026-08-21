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

    if (error) {
      console.error('[catalogService.getServices] Supabase error:', error.message);
      return { data: [], error: error.message };
    }
    return { data: data || [], error: null };
  } catch (err) {
    console.error('[catalogService.getServices] Exception:', err);
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const createService = async (serviceData, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const name = String(serviceData.name || '').trim();
    if (!name) return { data: null, error: 'Service name is required' };

    const normalizedCategory = serviceData.category && String(serviceData.category).trim()
      ? String(serviceData.category).trim()
      : (serviceData.category_id ? String(serviceData.category_id).trim() : 'General');

    const imageUrl = String(serviceData.image_url || serviceData.image || serviceData.icon || '').trim();

    // Build payload without null or undefined values
    const basePayload = {
      name,
      category: normalizedCategory,
      category_id: serviceData.category_id || undefined,
      description: serviceData.description ? String(serviceData.description).trim() : undefined,
      icon: imageUrl || 'wrench',
      image_url: imageUrl || undefined,
      image: imageUrl || undefined,
      base_price: Number.isFinite(Number(serviceData.base_price)) ? Number(serviceData.base_price) : 0,
      platform_fee: Number.isFinite(Number(serviceData.platform_fee)) ? Number(serviceData.platform_fee) : 0,
      inspection_fee: Number.isFinite(Number(serviceData.inspection_fee)) ? Number(serviceData.inspection_fee) : 0,
      active: serviceData.active !== false,
    };

    // Remove undefined / null keys
    const cleanPayload = Object.fromEntries(
      Object.entries(basePayload).filter(([_, v]) => v !== undefined && v !== null)
    );

    // Attempt 1: Auto-generated primary key (PostgreSQL gen_random_uuid() or default generator)
    let { data, error } = await supabase
      .from('services')
      .insert(cleanPayload)
      .select()
      .maybeSingle();

    // Attempt 2: If table id column is NOT-NULL and lacks DB default generator, supply RFC4122 UUID
    if (error && error.message && (error.message.includes('null value in column "id"') || error.message.includes('violates not-null constraint'))) {
      console.warn('[catalogService.createService] DB requires explicit ID, supplying generated UUID');
      const generatedUuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
            (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
          );

      const payloadWithUuid = { id: generatedUuid, ...cleanPayload };
      const retryUuid = await supabase
        .from('services')
        .insert(payloadWithUuid)
        .select()
        .maybeSingle();

      data = retryUuid.data;
      error = retryUuid.error;
    }

    // Attempt 3: If string slug id is required by legacy varchar schema
    if (error && error.message && (error.message.includes('invalid input syntax') || error.message.includes('slug'))) {
      const slugId = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `service-${Date.now()}`;
      const payloadWithSlug = { id: slugId, ...cleanPayload };
      const retrySlug = await supabase
        .from('services')
        .insert(payloadWithSlug)
        .select()
        .maybeSingle();

      data = retrySlug.data;
      error = retrySlug.error;
    }

    // Attempt 4: If optional column (image_url, category_id) does not exist in schema cache
    if (error && error.message && (error.message.includes('column') || error.message.includes('schema cache'))) {
      console.warn('[catalogService.createService] Column mismatch fallback:', error.message);
      const minimalPayload = {
        name,
        base_price: basePayload.base_price,
        platform_fee: basePayload.platform_fee,
        active: basePayload.active,
      };

      let retryMin = await supabase.from('services').insert(minimalPayload).select().maybeSingle();
      if (retryMin.error && retryMin.error.message?.includes('null value in column "id"')) {
        const generatedUuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `srv-${Date.now()}`;
        retryMin = await supabase.from('services').insert({ id: generatedUuid, ...minimalPayload }).select().maybeSingle();
      }

      if (!retryMin.error) {
        data = retryMin.data;
        error = null;
      } else {
        error = retryMin.error;
      }
    }

    if (error) {
      console.error('[catalogService.createService] FULL SUPABASE ERROR:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return { data: null, error: error.message };
    }

    if (!data?.id) {
      console.error('[catalogService.createService] Error: Insert returned no service ID');
      return { data: null, error: 'Service created but no service ID returned.' };
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create',
      objectType: 'service',
      objectId: data.id,
      payload: serviceData,
    });

    return { data, error: null };
  } catch (err) {
    console.error('[catalogService.createService] EXCEPTION:', err);
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateService = async (id, updates, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const cleanUpdates = { ...updates };
    delete cleanUpdates.id; // Never update primary key

    let { data, error } = await supabase
      .from('services')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error && error.message && (error.message.includes('column') || error.message.includes('schema cache'))) {
      const minimalUpdates = {
        name: updates.name,
        base_price: updates.base_price,
        platform_fee: updates.platform_fee,
        active: updates.active,
      };
      const retryMin = await supabase
        .from('services')
        .update(minimalUpdates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (!retryMin.error) {
        data = retryMin.data;
        error = null;
      } else {
        error = retryMin.error;
      }
    }

    if (error) {
      console.error('[catalogService.updateService] FULL SUPABASE ERROR:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
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

    return { data: data || { id, ...updates }, error: null };
  } catch (err) {
    console.error('[catalogService.updateService] EXCEPTION:', err);
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const deleteService = async (id, actor = {}) => {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    const { error } = await supabase.from('services').delete().eq('id', id);

    if (error) {
      console.error('[catalogService.deleteService] FULL SUPABASE ERROR:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return { success: false, error: error.message };
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'delete',
      objectType: 'service',
      objectId: id,
    });

    return { success: true, error: null };
  } catch (err) {
    console.error('[catalogService.deleteService] EXCEPTION:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export const toggleServiceActive = async (id, active, actor = {}) => {
  return updateService(id, { active }, actor);
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
      .order('name', { ascending: true });

    if (error) {
      console.error('[catalogService.getCategories] Supabase error:', error.message);
      return { data: [], error: error.message };
    }
    return { data: data || [], error: null };
  } catch (err) {
    console.error('[catalogService.getCategories] EXCEPTION:', err);
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const createCategory = async (categoryData, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const name = String(categoryData.name || '').trim();
    if (!name) return { data: null, error: 'Category name is required' };

    const slugId = categoryData.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `cat-${Date.now()}`;
    const imageUrl = String(categoryData.image_url || categoryData.image || categoryData.icon || '').trim();

    const payloadWithSlug = {
      id: slugId,
      name,
      icon: imageUrl || 'folder',
      image_url: imageUrl || null,
      image: imageUrl || null,
      active: categoryData.active !== false,
    };

    let { data, error } = await supabase.from('categories').insert(payloadWithSlug).select().maybeSingle();

    if (error && error.message && (error.message.includes('primary key') || error.message.includes('syntax'))) {
      const payloadWithoutId = { ...payloadWithSlug };
      delete payloadWithoutId.id;
      const retryRes = await supabase.from('categories').insert(payloadWithoutId).select().maybeSingle();
      if (!retryRes.error) {
        data = retryRes.data;
        error = null;
      }
    }

    if (error) {
      console.error('[catalogService.createCategory] FULL SUPABASE ERROR:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return { data: null, error: error.message };
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create',
      objectType: 'category',
      objectId: data?.id || slugId,
      payload: categoryData,
    });

    return { data: data || payloadWithSlug, error: null };
  } catch (err) {
    console.error('[catalogService.createCategory] EXCEPTION:', err);
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateCategory = async (id, updates, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const cleanUpdates = { ...updates };
    delete cleanUpdates.id;

    const { data, error } = await supabase
      .from('categories')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[catalogService.updateCategory] FULL SUPABASE ERROR:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
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

    return { data: data || { id, ...updates }, error: null };
  } catch (err) {
    console.error('[catalogService.updateCategory] EXCEPTION:', err);
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const deleteCategory = async (id, actor = {}) => {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      console.error('[catalogService.deleteCategory] FULL SUPABASE ERROR:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return { success: false, error: error.message };
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'delete',
      objectType: 'category',
      objectId: id,
    });

    return { success: true, error: null };
  } catch (err) {
    console.error('[catalogService.deleteCategory] EXCEPTION:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

// ==========================================
// PRICING RULES CRUD
// ==========================================

export const getPricingRules = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[catalogService.getPricingRules] Supabase error:', error.message);
      return { data: [], error: error.message };
    }
    return { data: data || [], error: null };
  } catch (err) {
    console.error('[catalogService.getPricingRules] EXCEPTION:', err);
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const createPricingRule = async (ruleData, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('pricing_rules').insert(ruleData).select().maybeSingle();

    if (error) {
      console.error('[catalogService.createPricingRule] FULL SUPABASE ERROR:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return { data: null, error: error.message };
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create',
      objectType: 'pricing_rule',
      objectId: data?.id,
      payload: ruleData,
    });

    return { data, error: null };
  } catch (err) {
    console.error('[catalogService.createPricingRule] EXCEPTION:', err);
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updatePricingRule = async (id, updates, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const cleanUpdates = { ...updates };
    delete cleanUpdates.id;

    const { data, error } = await supabase
      .from('pricing_rules')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[catalogService.updatePricingRule] FULL SUPABASE ERROR:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return { data: null, error: error.message };
    }

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
    console.error('[catalogService.updatePricingRule] EXCEPTION:', err);
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const deletePricingRule = async (id, actor = {}) => {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    const { error } = await supabase.from('pricing_rules').delete().eq('id', id);

    if (error) {
      console.error('[catalogService.deletePricingRule] FULL SUPABASE ERROR:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return { success: false, error: error.message };
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'delete',
      objectType: 'pricing_rule',
      objectId: id,
    });

    return { success: true, error: null };
  } catch (err) {
    console.error('[catalogService.deletePricingRule] EXCEPTION:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};
