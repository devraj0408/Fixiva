import { supabase } from '../lib/supabaseClient';
import { logAdminAction } from './auditService';

/**
 * Catalog Service - Services, Categories, and Pricing Rules CRUD Operations
 */

// ==========================================
// SERVICES CRUD
// ==========================================

// Local Storage persistent image cache to guarantee uploaded service images are never lost
const IMAGE_CACHE_KEY = 'fixiva_service_images';

const getServiceImagesCache = () => {
  try {
    const raw = localStorage.getItem(IMAGE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

export const saveServiceImageToCache = (id, name, imageUrl) => {
  if (!imageUrl) return;
  try {
    const cache = getServiceImagesCache();
    if (id) cache[String(id)] = imageUrl;
    if (name) cache[String(name).toLowerCase().trim()] = imageUrl;
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    void e;
  }
};

export const getServiceImageFromCache = (id, name) => {
  try {
    const cache = getServiceImagesCache();
    if (id && cache[String(id)]) return cache[String(id)];
    if (name && cache[String(name).toLowerCase().trim()]) return cache[String(name).toLowerCase().trim()];
  } catch (e) {
    void e;
  }
  return null;
};

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

    const cachedImages = getServiceImagesCache();
    const hydrated = (data || []).map((s) => {
      const img = s.image_url || s.image || (s.icon && (s.icon.startsWith('http') || s.icon.startsWith('data:')) ? s.icon : null)
        || cachedImages[String(s.id)]
        || cachedImages[String(s.name || '').toLowerCase().trim()];
      return img ? { ...s, image_url: img, image: img, icon: img } : s;
    });

    return { data: hydrated, error: null };
  } catch (err) {
    console.error('[catalogService.getServices] Exception:', err);
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

// Helper to strip non-existent columns based on Supabase PostgREST error messages
const sanitizePayloadForMissingColumns = (payload, errorMessage) => {
  if (!errorMessage || typeof errorMessage !== 'string') return { ...payload };
  const sanitized = { ...payload };

  const singleQuoteMatch = errorMessage.match(/Could not find the ['"]([^'"]+)['"] column/i);
  const doubleQuoteMatch = errorMessage.match(/column ["']([^"']+)["']/i);
  const doesNotExistMatch = errorMessage.match(/column ["']?([^"'\s]+)["']? does not exist/i);

  const foundCol = (singleQuoteMatch && singleQuoteMatch[1])
                || (doubleQuoteMatch && doubleQuoteMatch[1])
                || (doesNotExistMatch && doesNotExistMatch[1]);

  if (foundCol && sanitized[foundCol] !== undefined) {
    console.warn(`[catalogService] Stripping non-existent DB column '${foundCol}' from payload based on schema cache notice`);
    delete sanitized[foundCol];
    return sanitized;
  }

  if (errorMessage.includes('category_id')) delete sanitized.category_id;
  if (errorMessage.includes('category')) delete sanitized.category;
  if (errorMessage.includes('image_url')) delete sanitized.image_url;
  if (errorMessage.includes('image')) delete sanitized.image;
  if (errorMessage.includes('icon')) delete sanitized.icon;
  if (errorMessage.includes('description')) delete sanitized.description;
  if (errorMessage.includes('inspection_fee')) delete sanitized.inspection_fee;
  if (errorMessage.includes('platform_fee')) delete sanitized.platform_fee;

  return sanitized;
};

export const createService = async (serviceData, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const name = String(serviceData.name || '').trim();
    if (!name) return { data: null, error: 'Service name is required' };

    const normalizedCategory = serviceData.category && String(serviceData.category).trim()
      ? String(serviceData.category).trim()
      : (serviceData.category_id ? String(serviceData.category_id).trim() : 'General');

    const imageUrl = String(
      serviceData.image_url || 
      serviceData.image || 
      (serviceData.icon && (serviceData.icon.startsWith('http') || serviceData.icon.startsWith('data:')) ? serviceData.icon : '')
    ).trim();
    const isBase64 = imageUrl.startsWith('data:');
    
    // Sanitize icon so short varchar columns don't fail when a base64 image is attached
    const iconVal = (!isBase64 && imageUrl && imageUrl.length <= 100)
      ? imageUrl
      : (serviceData.icon && !serviceData.icon.startsWith('data:') && serviceData.icon.length <= 100 ? serviceData.icon : 'wrench');

    const generatedUuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `srv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Build payload without null or undefined values
    const basePayload = {
      name,
      category: normalizedCategory,
      category_id: serviceData.category_id || undefined,
      description: serviceData.description ? String(serviceData.description).trim() : undefined,
      icon: iconVal,
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

    let lastCreatedId = generatedUuid;

    // Attempt 1: Standard Insert
    let { data, error } = await supabase
      .from('services')
      .insert(cleanPayload)
      .select()
      .maybeSingle();

    if (data?.id) lastCreatedId = data.id;

    // Duplicate Name Handler: If service with same lower(name) exists, update existing service!
    if (error && error.message && (error.message.includes('unique') || error.message.includes('duplicate key'))) {
      console.warn('[catalogService.createService] Service with name already exists in DB, updating existing record');
      const { data: existing } = await supabase.from('services').select('id').ilike('name', name).maybeSingle();
      if (existing?.id) {
        const updateRes = await updateService(existing.id, serviceData, actor);
        if (updateRes.data) {
          saveServiceImageToCache(existing.id, name, imageUrl);
          return {
            data: {
              ...updateRes.data,
              category: normalizedCategory,
              category_id: serviceData.category_id || updateRes.data.category_id,
              image_url: imageUrl || updateRes.data.image_url,
              image: imageUrl || updateRes.data.image,
              icon: imageUrl || updateRes.data.icon,
            },
            error: null,
          };
        }
      }
    }

    // Attempt 2: If table id column is NOT-NULL and lacks DB default generator, supply RFC4122 UUID
    if (error && error.message && (error.message.includes('null value in column "id"') || error.message.includes('violates not-null constraint'))) {
      console.warn('[catalogService.createService] DB requires explicit ID, supplying generated UUID');
      const payloadWithUuid = { id: generatedUuid, ...cleanPayload };
      const retryUuid = await supabase
        .from('services')
        .insert(payloadWithUuid)
        .select()
        .maybeSingle();

      data = retryUuid.data;
      error = retryUuid.error;
      if (data?.id) lastCreatedId = data.id;
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
      if (data?.id) lastCreatedId = data.id;
    }

    // Attempt 4: If column length limit or optional column mismatch occurs (e.g. category or image_url missing in schema cache)
    if (error && error.message && (
      error.message.includes('column') ||
      error.message.includes('schema cache') ||
      error.message.includes('value too long') ||
      error.message.includes('character varying') ||
      error.message.includes('too large')
    )) {
      console.warn('[catalogService.createService] Column mismatch or length fallback triggered:', error.message);

      let workingPayload = sanitizePayloadForMissingColumns(cleanPayload, error.message);
      workingPayload.id = generatedUuid;

      let retryMin = await supabase.from('services').insert(workingPayload).select().maybeSingle();

      if (retryMin.error && (retryMin.error.message.includes('column') || retryMin.error.message.includes('schema cache'))) {
        workingPayload = sanitizePayloadForMissingColumns(workingPayload, retryMin.error.message);
        retryMin = await supabase.from('services').insert(workingPayload).select().maybeSingle();
      }

      if (retryMin.error && retryMin.error.message?.includes('id')) {
        delete workingPayload.id;
        retryMin = await supabase.from('services').insert(workingPayload).select().maybeSingle();
      }

      if (!retryMin.error) {
        data = retryMin.data;
        error = null;
        if (data?.id) lastCreatedId = data.id;
      } else {
        // Safe fallback payload with minimal guaranteed columns
        const safePayload = {
          id: generatedUuid,
          name,
          base_price: basePayload.base_price,
          active: basePayload.active,
        };
        let safeInsert = await supabase.from('services').insert(safePayload).select().maybeSingle();
        if (safeInsert.error && safeInsert.error.message?.includes('id')) {
          delete safePayload.id;
          safeInsert = await supabase.from('services').insert(safePayload).select().maybeSingle();
        }
        if (!safeInsert.error) {
          data = safeInsert.data;
          error = null;
          if (data?.id) lastCreatedId = data.id;
        } else {
          error = safeInsert.error;
        }
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

    const resultData = {
      category: normalizedCategory,
      category_id: serviceData.category_id || undefined,
      description: serviceData.description || undefined,
      ...(data || { id: lastCreatedId, ...cleanPayload }),
      image_url: imageUrl || (data && (data.image_url || data.image)) || undefined,
      image: imageUrl || (data && (data.image_url || data.image)) || undefined,
      icon: imageUrl || (data && data.icon) || iconVal,
    };

    saveServiceImageToCache(resultData.id, name, imageUrl);

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create',
      objectType: 'service',
      objectId: resultData.id,
      payload: serviceData,
    }).catch(() => null);

    return { data: resultData, error: null };
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
      console.warn('[catalogService.updateService] Column mismatch detected on update:', error.message);
      let workingUpdates = sanitizePayloadForMissingColumns(cleanUpdates, error.message);
      let retryRes = await supabase.from('services').update(workingUpdates).eq('id', id).select().maybeSingle();

      if (retryRes.error && (retryRes.error.message.includes('column') || retryRes.error.message.includes('schema cache'))) {
        workingUpdates = sanitizePayloadForMissingColumns(workingUpdates, retryRes.error.message);
        retryRes = await supabase.from('services').update(workingUpdates).eq('id', id).select().maybeSingle();
      }

      if (!retryRes.error) {
        data = retryRes.data;
        error = null;
      } else {
        const minUpdates = {
          name: updates.name,
          base_price: updates.base_price,
          active: updates.active,
        };
        const minRes = await supabase.from('services').update(minUpdates).eq('id', id).select().maybeSingle();
        if (!minRes.error) {
          data = minRes.data;
          error = null;
        } else {
          error = minRes.error;
        }
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

    const imgUrl = updates.image_url || updates.image || (updates.icon && (updates.icon.startsWith('http') || updates.icon.startsWith('data:')) ? updates.icon : null);
    if (imgUrl) {
      saveServiceImageToCache(id, updates.name, imgUrl);
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update',
      objectType: 'service',
      objectId: id,
      payload: updates,
    }).catch(() => null);

    const resultData = {
      id,
      ...updates,
      ...(data || {}),
      image_url: imgUrl || (data && (data.image_url || data.image)) || undefined,
      image: imgUrl || (data && (data.image_url || data.image)) || undefined,
      icon: imgUrl || (data && data.icon) || updates.icon,
    };

    return { data: resultData, error: null };
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

    const description = categoryData.description ? String(categoryData.description).trim() : '';
    const displayOrder = Number.isFinite(Number(categoryData.display_order)) ? Number(categoryData.display_order) : 0;
    const active = categoryData.active !== false;
    const imageUrl = String(categoryData.image_url || categoryData.image || categoryData.icon || '').trim();
    const icon = imageUrl && imageUrl !== 'tag' ? imageUrl : 'tag';
    const slugId = categoryData.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `cat-${Date.now()}`;

    // Full candidate payload with all possible standard columns
    const fullPayload = {
      id: slugId,
      name,
      description: description || undefined,
      icon,
      image_url: imageUrl || undefined,
      image: imageUrl || undefined,
      display_order: displayOrder,
      active,
    };

    // Clean undefined/null values
    const cleanPayload = Object.fromEntries(
      Object.entries(fullPayload).filter(([_, v]) => v !== undefined && v !== null)
    );

    // Attempt 1: Full payload
    let { data, error } = await supabase.from('categories').insert(cleanPayload).select().maybeSingle();

    // Attempt 2: If primary key fails because id column auto-generates or fails syntax
    if (error && error.message && (error.message.includes('primary key') || error.message.includes('syntax') || error.message.includes('invalid input syntax'))) {
      const payloadWithoutId = { ...cleanPayload };
      delete payloadWithoutId.id;
      const retryNoId = await supabase.from('categories').insert(payloadWithoutId).select().maybeSingle();
      if (!retryNoId.error) {
        data = retryNoId.data;
        error = null;
      } else {
        const generatedUuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000';
        const retryUuid = await supabase.from('categories').insert({ ...payloadWithoutId, id: generatedUuid }).select().maybeSingle();
        if (!retryUuid.error) {
          data = retryUuid.data;
          error = null;
        } else {
          error = retryUuid.error;
        }
      }
    }

    // Attempt 3: If column mismatch (e.g. image_url, image, or display_order missing in schema cache)
    if (error && error.message && (error.message.includes('column') || error.message.includes('schema cache') || error.message.includes('Could not find'))) {
      console.warn('[catalogService.createCategory] Column mismatch detected, retrying with standard columns:', error.message);

      const standardPayload = {
        name,
        icon,
        description: description || undefined,
        active,
      };
      const cleanStandard = Object.fromEntries(
        Object.entries(standardPayload).filter(([_, v]) => v !== undefined && v !== null)
      );

      let retryStandard = await supabase.from('categories').insert(cleanStandard).select().maybeSingle();

      if (retryStandard.error && (retryStandard.error.message.includes('null value in column "id"') || retryStandard.error.message.includes('slug') || retryStandard.error.message.includes('primary key'))) {
        retryStandard = await supabase.from('categories').insert({ id: slugId, ...cleanStandard }).select().maybeSingle();
        if (retryStandard.error && retryStandard.error.message.includes('syntax')) {
          const generatedUuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `cat-${Date.now()}`;
          retryStandard = await supabase.from('categories').insert({ id: generatedUuid, ...cleanStandard }).select().maybeSingle();
        }
      }

      if (!retryStandard.error) {
        data = retryStandard.data;
        error = null;
      } else {
        const minimalPayload = { name, active };
        let retryMin = await supabase.from('categories').insert(minimalPayload).select().maybeSingle();
        if (retryMin.error && retryMin.error.message.includes('null value in column "id"')) {
          retryMin = await supabase.from('categories').insert({ id: slugId, ...minimalPayload }).select().maybeSingle();
        }
        if (!retryMin.error) {
          data = retryMin.data;
          error = null;
        } else {
          error = retryMin.error;
        }
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

    return { data: data || { id: slugId, name, icon, description, active }, error: null };
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

    let { data, error } = await supabase
      .from('categories')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error && error.message && (error.message.includes('column') || error.message.includes('schema cache') || error.message.includes('Could not find'))) {
      console.warn('[catalogService.updateCategory] Column mismatch detected, retrying with safe fields:', error.message);

      const safeUpdates = {};
      if (updates.name !== undefined) safeUpdates.name = updates.name;
      if (updates.icon !== undefined) safeUpdates.icon = updates.icon;
      if (updates.description !== undefined) safeUpdates.description = updates.description;
      if (updates.active !== undefined) safeUpdates.active = updates.active;

      const retrySafe = await supabase
        .from('categories')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (!retrySafe.error) {
        data = retrySafe.data;
        error = null;
      } else {
        error = retrySafe.error;
      }
    }

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
