import { supabase } from '../lib/supabaseClient';
import { logAdminAction } from './auditService';

/**
 * Marketing Service - Coupons and Notifications CRUD Operations
 */

// ==========================================
// COUPONS CRUD
// ==========================================
// COUPONS CRUD WITH SCHEMALESS & LOCALSTORAGE FALLBACK
// ==========================================

const CUSTOM_COUPONS_KEY = 'fixiva_custom_coupons';
const COUPON_UPDATES_KEY = 'fixiva_coupon_updates';
const DELETED_COUPONS_KEY = 'fixiva_deleted_coupons';

const INITIAL_DEFAULT_COUPONS = [
  {
    id: 'coupon-default-1',
    code: 'FIXIVA100',
    discount_type: 'flat',
    discount_value: 100,
    min_order_amount: 336,
    max_discount: 100,
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'coupon-default-2',
    code: 'WELCOME50',
    discount_type: 'percentage',
    discount_value: 20,
    min_order_amount: 299,
    max_discount: 150,
    active: true,
    created_at: new Date().toISOString()
  }
];

const getStoredCustomCoupons = () => {
  try {
    const raw = localStorage.getItem(CUSTOM_COUPONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveCustomCouponToStorage = (coupon) => {
  try {
    const current = getStoredCustomCoupons();
    const filtered = current.filter(
      (c) => c.id !== coupon.id && (c.code || '').toUpperCase() !== (coupon.code || '').toUpperCase()
    );
    localStorage.setItem(CUSTOM_COUPONS_KEY, JSON.stringify([coupon, ...filtered]));
  } catch (err) {
    console.warn('Failed to save custom coupon to localStorage:', err);
  }
};

const getStoredCouponUpdates = () => {
  try {
    const raw = localStorage.getItem(COUPON_UPDATES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveCouponUpdateToStorage = (id, updates) => {
  try {
    const map = getStoredCouponUpdates();
    map[id] = { ...(map[id] || {}), ...updates };
    localStorage.setItem(COUPON_UPDATES_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to save coupon update to localStorage:', err);
  }
};

const getStoredDeletedCouponIds = () => {
  try {
    const raw = localStorage.getItem(DELETED_COUPONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveDeletedCouponIdToStorage = (id) => {
  try {
    const list = getStoredDeletedCouponIds();
    if (!list.includes(id)) {
      localStorage.setItem(DELETED_COUPONS_KEY, JSON.stringify([...list, id]));
    }
  } catch (err) {
    console.warn('Failed to save deleted coupon ID to localStorage:', err);
  }
};

export const getCoupons = async () => {
  let dbCoupons = [];

  if (supabase) {
    try {
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        dbCoupons = data;
      }
    } catch (e) {
      console.warn('Supabase fetch coupons error:', e);
    }
  }

  const custom = getStoredCustomCoupons();
  const updatesMap = getStoredCouponUpdates();
  const deletedIds = getStoredDeletedCouponIds();

  const combinedMap = new Map();

  // Add DB coupons
  dbCoupons.forEach((c) => {
    if (!deletedIds.includes(c.id)) {
      combinedMap.set(c.id, { ...c, ...(updatesMap[c.id] || {}) });
    }
  });

  // Add custom stored coupons
  custom.forEach((c) => {
    if (!deletedIds.includes(c.id)) {
      combinedMap.set(c.id, { ...c, ...(updatesMap[c.id] || {}) });
    }
  });

  // If list is empty, insert defaults
  if (combinedMap.size === 0) {
    INITIAL_DEFAULT_COUPONS.forEach((c) => {
      if (!deletedIds.includes(c.id)) {
        combinedMap.set(c.id, { ...c, ...(updatesMap[c.id] || {}) });
      }
    });
  }

  const finalCoupons = Array.from(combinedMap.values());
  return { data: finalCoupons, error: null };
};

export const createCoupon = async (couponData, actor = {}) => {
  try {
    const codeClean = String(couponData.code || '').toUpperCase().trim();
    if (!codeClean) {
      return { data: null, error: 'Coupon code is required.' };
    }

    const discountVal = Number(couponData.discount_value) || 0;
    const minOrderVal = Number(couponData.min_order_amount) || 0;
    let maxDiscountVal = 0;

    if (couponData.max_discount !== undefined && couponData.max_discount !== null && couponData.max_discount !== '') {
      maxDiscountVal = Number(couponData.max_discount);
    } else if (couponData.max_discount_amount !== undefined && couponData.max_discount_amount !== null && couponData.max_discount_amount !== '') {
      maxDiscountVal = Number(couponData.max_discount_amount);
    } else if (String(couponData.discount_type || '').toLowerCase() === 'flat') {
      maxDiscountVal = discountVal;
    }

    const payload = {
      id: `coupon-${Date.now()}`,
      code: codeClean,
      discount_value: discountVal,
      discount_type: String(couponData.discount_type || 'flat').toLowerCase(),
      min_order_amount: minOrderVal,
      max_discount: maxDiscountVal,
      active: couponData.active !== false && couponData.active !== 'false',
      created_at: new Date().toISOString()
    };

    // Save to storage immediately
    saveCustomCouponToStorage(payload);

    if (supabase) {
      try {
        let { data, error } = await supabase.from('coupons').insert([payload]).select();
        if (error) {
          console.warn('createCoupon insert DB warning:', error);
        } else if (Array.isArray(data) && data.length > 0) {
          saveCustomCouponToStorage(data[0]);
          payload.id = data[0].id;
        }
      } catch (e) {
        console.warn('createCoupon Supabase fallback:', e);
      }
    }

    try {
      if (actor && (actor.id || actor.email)) {
        await logAdminAction({
          actorId: actor?.id,
          actorEmail: actor?.email,
          action: 'create',
          objectType: 'coupon',
          objectId: payload.id || codeClean,
          payload: couponData,
        });
      }
    } catch (e) {
      console.warn('Audit log ignored for coupon create:', e);
    }

    return { data: payload, error: null };
  } catch (err) {
    console.error('createCoupon exception:', err);
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateCoupon = async (id, updates, actor = {}) => {
  saveCouponUpdateToStorage(id, updates);

  if (supabase) {
    try {
      let { data, error } = await supabase.from('coupons').update(updates).eq('id', id).select();
      if (error) {
        console.warn('updateCoupon DB warning:', error);
      }
    } catch (e) {
      console.warn('updateCoupon Supabase exception:', e);
    }
  }

  try {
    if (actor && (actor.id || actor.email)) {
      await logAdminAction({
        actorId: actor?.id,
        actorEmail: actor?.email,
        action: 'update',
        objectType: 'coupon',
        objectId: id,
        payload: updates,
      });
    }
  } catch (e) {
    console.warn('Audit log ignored for coupon update:', e);
  }

  return { data: { id, ...updates }, error: null };
};

export const deleteCoupon = async (id, actor = {}) => {
  saveDeletedCouponIdToStorage(id);

  if (supabase) {
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) {
        console.warn('deleteCoupon DB warning:', error);
      }
    } catch (e) {
      console.warn('deleteCoupon Supabase exception:', e);
    }
  }

  try {
    if (actor && (actor.id || actor.email)) {
      await logAdminAction({
        actorId: actor?.id,
        actorEmail: actor?.email,
        action: 'delete',
        objectType: 'coupon',
        objectId: id,
        payload: { deleted: true },
      });
    }
  } catch (e) {
    console.warn('Audit log ignored for coupon delete:', e);
  }

  return { success: true, error: null };
};

// ==========================================
// NOTIFICATIONS CRUD
// ==========================================

export const getNotifications = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    console.error('getNotifications exception:', err);
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const createBroadcastNotification = async (notificationData, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const roleMap = {
      'ALL': 'all',
      'ALL USERS': 'all',
      'ALL_USERS': 'all',
      'CUSTOMERS ONLY': 'customer',
      'CUSTOMER': 'customer',
      'CUSTOMERS': 'customer',
      'WORKERS ONLY': 'worker',
      'WORKER': 'worker',
      'WORKERS': 'worker',
      'CONTRACTORS ONLY': 'contractor',
      'CONTRACTOR': 'contractor',
      'CONTRACTORS': 'contractor',
    };
    const rawRole = String(notificationData.target_role || notificationData.targetRole || 'all').trim().toUpperCase();
    const normalizedTargetRole = roleMap[rawRole] || 'all';

    const payload = {
      title: String(notificationData.title || '').trim(),
      message: String(notificationData.message || '').trim(),
      target_role: normalizedTargetRole,
      created_by: actor?.id || null,
      is_active: true,
      read: false,
    };

    let { data, error } = await supabase.from('notifications').insert(payload).select().maybeSingle();

    if (error) {
      console.error('createBroadcastNotification DB error:', error);
      if (error.message && error.message.includes('target_role')) {
        const fallbackPayload = {
          title: payload.title,
          message: payload.message,
          read: false,
        };
        const retry = await supabase.from('notifications').insert(fallbackPayload).select().maybeSingle();
        data = retry.data || { ...fallbackPayload, id: Date.now(), target_role: normalizedTargetRole };
        error = retry.error;
      }
    }

    if (error) return { data: null, error: error.message };

    try {
      if (actor && (actor.id || actor.email)) {
        await logAdminAction({
          actorId: actor?.id,
          actorEmail: actor?.email,
          action: 'create_broadcast',
          objectType: 'notification',
          objectId: data?.id || payload.title,
          payload: notificationData,
        });
      }
    } catch (e) {
      console.warn('Audit log ignored for broadcast notification:', e);
    }

    return { data: data || payload, error: null };
  } catch (err) {
    console.error('createBroadcastNotification exception:', err);
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const deleteNotification = async (id, actor = {}) => {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) {
      console.error('deleteNotification DB error:', error);
      return { success: false, error: error.message };
    }

    try {
      if (actor && (actor.id || actor.email)) {
        await logAdminAction({
          actorId: actor?.id,
          actorEmail: actor?.email,
          action: 'delete',
          objectType: 'notification',
          objectId: id,
          payload: { deleted: true },
        });
      }
    } catch (e) {
      console.warn('Audit log ignored for delete notification:', e);
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('deleteNotification exception:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};
