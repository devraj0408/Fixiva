import { supabase } from '../lib/supabaseClient';
import { logAdminAction } from './auditService';

/**
 * Catalog Service - Services, Categories, and Pricing Rules CRUD Operations
 */

// ==========================================
// SERVICES CRUD
// ==========================================
// SERVICES CRUD & LOCAL PERSISTENT STORAGE
// ==========================================

// Local Storage persistent image cache to guarantee uploaded service images are never lost
const IMAGE_CACHE_KEY = 'fixiva_service_images';
const SERVICES_LOCAL_STORAGE_KEY = 'fixiva_local_services';
const CATEGORIES_LOCAL_STORAGE_KEY = 'fixiva_local_categories';

export const getLocalServices = () => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SERVICES_LOCAL_STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveLocalService = (service) => {
  if (!service || !service.id) return;
  try {
    const list = getLocalServices();
    const filtered = list.filter((s) => String(s.id) !== String(service.id));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SERVICES_LOCAL_STORAGE_KEY, JSON.stringify([service, ...filtered]));
    }
  } catch (e) {
    void e;
  }
};

export const removeLocalService = (serviceId) => {
  try {
    const list = getLocalServices();
    const filtered = list.filter((s) => String(s.id) !== String(serviceId));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SERVICES_LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    void e;
  }
};

export const getLocalCategories = () => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(CATEGORIES_LOCAL_STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveLocalCategory = (category) => {
  if (!category || !category.id) return;
  try {
    const list = getLocalCategories();
    const filtered = list.filter((c) => String(c.id) !== String(category.id));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CATEGORIES_LOCAL_STORAGE_KEY, JSON.stringify([category, ...filtered]));
    }
  } catch (e) {
    void e;
  }
};

export const removeLocalCategory = (id) => {
  if (!id) return;
  try {
    const list = getLocalCategories();
    const filtered = list.filter((c) => String(c.id) !== String(id));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CATEGORIES_LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    void e;
  }
};

const getServiceImagesCache = () => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(IMAGE_CACHE_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

export const saveServiceImageToCache = (id, name, imageUrl) => {
  if (!imageUrl || typeof localStorage === 'undefined') return;
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

const DEFAULT_SERVICE_IMAGES = {
  plumber: '/assets/hero-slideshow/plumber.jpg',
  plumbing: '/assets/hero-slideshow/plumber.jpg',
  electrician: '/assets/hero-slideshow/electrician.jpg',
  electrical: '/assets/hero-slideshow/electrician.jpg',
  cleaning: '/assets/hero-slideshow/cleaning.jpg',
  'house cleaning': '/assets/hero-slideshow/cleaning.jpg',
  'home cleaning': '/assets/hero-slideshow/cleaning.jpg',
  'pest control': '/assets/hero-slideshow/pestcontrol.jpg',
  pestcontrol: '/assets/hero-slideshow/pestcontrol.jpg',
  labour: '/assets/hero-slideshow/labour.jpg',
  'construction labour': '/assets/hero-slideshow/labour.jpg',
  'ac repair': '/assets/hero-slideshow/ac_service.jpg',
  'ac service': '/assets/hero-slideshow/ac_service.jpg',
  painter: '/assets/hero-slideshow/painting.jpg',
  painting: '/assets/hero-slideshow/painting.jpg',
  carpenter: '/assets/hero-slideshow/carpenter.jpg',
  carpentry: '/assets/hero-slideshow/carpenter.jpg',
  'appliance repair': '/assets/hero-slideshow/appliance.jpg',
  renovation: '/assets/hero-slideshow/renovation.jpg',
  'home renovation': '/assets/hero-slideshow/renovation.jpg'
};

export const getServices = async () => {
  const localList = getLocalServices();
  const cachedImages = getServiceImagesCache();

  try {
    let dbServices = [];
    if (supabase) {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });

      if (!error && Array.isArray(data)) {
        dbServices = data;
      } else if (error) {
        console.warn('[catalogService.getServices] Supabase query notice, using local fallbacks:', error.message);
      }
    }

    // Merge Supabase records with local records
    const mergedMap = new Map();
    dbServices.forEach((s) => {
      mergedMap.set(String(s.id), s);
    });
    localList.forEach((s) => {
      const existing = mergedMap.get(String(s.id)) || {};
      mergedMap.set(String(s.id), { ...existing, ...s });
    });

    const combined = Array.from(mergedMap.values()).map((s) => {
      const sId = String(s.id || '').toLowerCase().trim();
      const sName = String(s.name || '').toLowerCase().trim();
      const defaultImg = DEFAULT_SERVICE_IMAGES[sId] || DEFAULT_SERVICE_IMAGES[sName];
      
      const img = s.image_url || s.image || (s.icon && (s.icon.startsWith('http') || s.icon.startsWith('data:')) ? s.icon : null)
        || cachedImages[String(s.id)]
        || cachedImages[sName]
        || defaultImg;

      return {
        ...s,
        category: s.category || 'General',
        image_url: img || undefined,
        image: img || undefined,
        icon: img || s.icon || 'wrench',
      };
    });

    return { data: combined, error: null };
  } catch (err) {
    console.error('[catalogService.getServices] Exception:', err);
    return { data: localList, error: null };
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

    // Build the clean full service record for state and local storage
    const fullServiceRecord = {
      id: generatedUuid,
      name,
      category: normalizedCategory,
      category_id: serviceData.category_id || undefined,
      description: serviceData.description ? String(serviceData.description).trim() : '',
      icon: iconVal,
      image_url: imageUrl || undefined,
      image: imageUrl || undefined,
      base_price: Number.isFinite(Number(serviceData.base_price)) ? Number(serviceData.base_price) : 0,
      platform_fee: Number.isFinite(Number(serviceData.platform_fee)) ? Number(serviceData.platform_fee) : 0,
      inspection_fee: Number.isFinite(Number(serviceData.inspection_fee)) ? Number(serviceData.inspection_fee) : 0,
      active: serviceData.active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Guarantee immediate persistence in local cache
    saveLocalService(fullServiceRecord);
    if (imageUrl) {
      saveServiceImageToCache(fullServiceRecord.id, name, imageUrl);
    }

    // If Supabase is initialized, attempt to persist to DB as well
    if (supabase) {
      try {
        // Schema-aligned DB payload: Supabase services table uses 'image' (not 'image_url') and does NOT have 'category' column
        const dbPayload = {
          id: generatedUuid,
          name,
          description: fullServiceRecord.description || null,
          icon: iconVal,
          image: imageUrl || null,
          base_price: fullServiceRecord.base_price,
          platform_fee: fullServiceRecord.platform_fee,
          inspection_fee: fullServiceRecord.inspection_fee,
          active: fullServiceRecord.active,
        };

        // Only include category_id if it's a valid non-empty string
        if (serviceData.category_id && String(serviceData.category_id).trim()) {
          dbPayload.category_id = String(serviceData.category_id).trim();
        }

        let { data, error } = await supabase
          .from('services')
          .insert(dbPayload)
          .select()
          .maybeSingle();

        // Duplicate Name Handler: If service with same lower(name) exists, update existing record
        if (error && (error.message.includes('unique') || error.message.includes('duplicate key'))) {
          console.warn('[catalogService.createService] Service with name already exists in DB, updating existing record');
          const { data: existingList } = await supabase.from('services').select('id').ilike('name', name).limit(1);
          const existing = existingList?.[0];
          if (existing?.id) {
            fullServiceRecord.id = existing.id;
            saveLocalService(fullServiceRecord);
            await updateService(existing.id, serviceData, actor).catch(() => null);
          }
        } else if (error && (error.message.includes('category_id') || error.message.includes('foreign key') || error.message.includes('uuid'))) {
          // Retry without category_id if category FK or UUID format failed
          delete dbPayload.category_id;
          const retry = await supabase.from('services').insert(dbPayload).select().maybeSingle();
          if (!retry.error && retry.data) {
            fullServiceRecord.id = retry.data.id || fullServiceRecord.id;
            saveLocalService(fullServiceRecord);
          }
        } else if (!error && data) {
          fullServiceRecord.id = data.id || fullServiceRecord.id;
          saveLocalService(fullServiceRecord);
        } else if (error) {
          console.warn('[catalogService.createService] Supabase insert notice (local copy preserved):', error.message);
        }
      } catch (dbErr) {
        console.warn('[catalogService.createService] Supabase DB write non-blocking failure:', dbErr);
      }
    }

    await logAdminAction({
      actorId: actor?.id,
      actorEmail: actor?.email,
      action: 'create',
      objectType: 'service',
      objectId: fullServiceRecord.id,
      payload: serviceData,
    }).catch(() => null);

    return { data: fullServiceRecord, error: null };
  } catch (err) {
    console.error('[catalogService.createService] EXCEPTION:', err);
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateService = async (id, updates, actor = {}) => {
  try {
    const cleanUpdates = { ...updates };
    delete cleanUpdates.id; // Never update primary key

    const imgUrl = updates.image_url || updates.image || (updates.icon && (updates.icon.startsWith('http') || updates.icon.startsWith('data:')) ? updates.icon : null);

    const resultData = {
      id,
      ...updates,
      updated_at: new Date().toISOString(),
      image_url: imgUrl || undefined,
      image: imgUrl || undefined,
      icon: imgUrl || updates.icon || 'wrench',
    };

    // Always update local cache
    saveLocalService(resultData);
    if (imgUrl) {
      saveServiceImageToCache(id, updates.name, imgUrl);
    }

    // Update in Supabase if client is ready
    if (supabase) {
      try {
        // Schema-aligned columns for services table
        const dbUpdates = { ...cleanUpdates };
        delete dbUpdates.category; // DB services table doesn't have 'category'
        if (imgUrl) {
          dbUpdates.image = imgUrl;
        }
        delete dbUpdates.image_url;

        let { data, error } = await supabase
          .from('services')
          .update(dbUpdates)
          .eq('id', id)
          .select()
          .maybeSingle();

        if (error && (error.message.includes('column') || error.message.includes('schema cache'))) {
          let workingUpdates = sanitizePayloadForMissingColumns(dbUpdates, error.message);
          let retryRes = await supabase.from('services').update(workingUpdates).eq('id', id).select().maybeSingle();
          if (retryRes.data) {
            data = retryRes.data;
          }
        }
        if (data) {
          resultData.id = data.id || id;
          saveLocalService(resultData);
        }
      } catch (dbErr) {
        console.warn('[catalogService.updateService] Supabase update notice:', dbErr);
      }
    }

    await logAdminAction({
      actorId: actor?.id,
      actorEmail: actor?.email,
      action: 'update',
      objectType: 'service',
      objectId: id,
      payload: updates,
    }).catch(() => null);

    return { data: resultData, error: null };
  } catch (err) {
    console.error('[catalogService.updateService] EXCEPTION:', err);
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const deleteService = async (id, actor = {}) => {
  try {
    // Delete from local storage
    removeLocalService(id);

    // Delete from Supabase if connected
    if (supabase) {
      try {
        await supabase.from('services').delete().eq('id', id);
      } catch (dbErr) {
        console.warn('[catalogService.deleteService] Supabase delete notice:', dbErr);
      }
    }

    await logAdminAction({
      actorId: actor?.id,
      actorEmail: actor?.email,
      action: 'delete',
      objectType: 'service',
      objectId: id,
    }).catch(() => null);

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
  const localList = getLocalCategories();

  try {
    let dbCategories = [];
    if (supabase) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (!error && Array.isArray(data)) {
        dbCategories = data;
      } else if (error) {
        console.warn('[catalogService.getCategories] Supabase query notice, using local fallbacks:', error.message);
      }
    }

    const mergedMap = new Map();
    dbCategories.forEach((c) => mergedMap.set(String(c.id), c));
    localList.forEach((c) => {
      const existing = mergedMap.get(String(c.id)) || {};
      mergedMap.set(String(c.id), { ...existing, ...c });
    });

    return { data: Array.from(mergedMap.values()), error: null };
  } catch (err) {
    console.error('[catalogService.getCategories] EXCEPTION:', err);
    return { data: localList, error: null };
  }
};

export const createCategory = async (categoryData, actor = {}) => {
  try {
    const name = String(categoryData.name || '').trim();
    if (!name) return { data: null, error: 'Category name is required' };

    const description = categoryData.description ? String(categoryData.description).trim() : '';
    const displayOrder = Number.isFinite(Number(categoryData.display_order)) ? Number(categoryData.display_order) : 0;
    const active = categoryData.active !== false;
    const imageUrl = String(categoryData.image_url || categoryData.image || categoryData.icon || '').trim();
    const icon = imageUrl && imageUrl !== 'tag' ? imageUrl : 'tag';
    const slugId = categoryData.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `cat-${Date.now()}`;

    const fullRecord = {
      id: slugId,
      name,
      description,
      icon,
      image_url: imageUrl || undefined,
      image: imageUrl || undefined,
      display_order: displayOrder,
      active,
      created_at: new Date().toISOString(),
    };

    // Save locally immediately
    saveLocalCategory(fullRecord);

    if (supabase) {
      try {
        const cleanPayload = Object.fromEntries(
          Object.entries(fullRecord).filter(([_, v]) => v !== undefined && v !== null)
        );

        let { data, error } = await supabase.from('categories').insert(cleanPayload).select().maybeSingle();

        if (error && (error.message.includes('column') || error.message.includes('schema cache'))) {
          const minimal = { name, icon, description, active };
          const retry = await supabase.from('categories').insert(minimal).select().maybeSingle();
          if (retry.data?.id) fullRecord.id = retry.data.id;
        } else if (data?.id) {
          fullRecord.id = data.id;
        }
        saveLocalCategory(fullRecord);
      } catch (dbErr) {
        console.warn('[catalogService.createCategory] Supabase write note:', dbErr);
      }
    }

    await logAdminAction({
      actorId: actor?.id,
      actorEmail: actor?.email,
      action: 'create',
      objectType: 'category',
      objectId: fullRecord.id,
      payload: categoryData,
    }).catch(() => null);

    return { data: fullRecord, error: null };
  } catch (err) {
    console.error('[catalogService.createCategory] EXCEPTION:', err);
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateCategory = async (id, updates, actor = {}) => {
  try {
    const resultData = { id, ...updates, updated_at: new Date().toISOString() };
    saveLocalCategory(resultData);

    if (supabase) {
      try {
        const cleanUpdates = { ...updates };
        delete cleanUpdates.id;
        await supabase.from('categories').update(cleanUpdates).eq('id', id);
      } catch (dbErr) {
        console.warn('[catalogService.updateCategory] Supabase write note:', dbErr);
      }
    }

    await logAdminAction({
      actorId: actor?.id,
      actorEmail: actor?.email,
      action: 'update',
      objectType: 'category',
      objectId: id,
      payload: updates,
    }).catch(() => null);

    return { data: resultData, error: null };
  } catch (err) {
    console.error('[catalogService.updateCategory] EXCEPTION:', err);
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const deleteCategory = async (id, actor = {}) => {
  try {
    removeLocalCategory(id);

    if (supabase) {
      try {
        await supabase.from('categories').delete().eq('id', id);
      } catch (dbErr) {
        console.warn('[catalogService.deleteCategory] Supabase delete note:', dbErr);
      }
    }

    await logAdminAction({
      actorId: actor?.id,
      actorEmail: actor?.email,
      action: 'delete',
      objectType: 'category',
      objectId: id,
    }).catch(() => null);

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
