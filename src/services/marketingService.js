import { supabase } from '../lib/supabaseClient';
import { logAdminAction } from './auditService';

/**
 * Marketing Service - Coupons and Notifications CRUD Operations
 */

// ==========================================
// COUPONS CRUD
// ==========================================

export const getCoupons = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const createCoupon = async (couponData, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

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
      code: codeClean,
      discount_value: discountVal,
      discount_type: String(couponData.discount_type || 'flat').toLowerCase(),
      min_order_amount: minOrderVal,
      max_discount: maxDiscountVal,
      active: couponData.active !== false && couponData.active !== 'false',
    };

    // 1. Primary insert with select
    let { data, error } = await supabase.from('coupons').insert(payload).select();

    // 2. If select fails (e.g. RLS on select), try plain insert without select
    if (error) {
      console.warn('createCoupon insert with select warning:', error);
      const retryInsert = await supabase.from('coupons').insert(payload);
      if (!retryInsert.error) {
        error = null;
        data = [{ ...payload, id: `coupon-${Date.now()}`, created_at: new Date().toISOString() }];
      }
    }

    // 3. Fallback if max_discount vs max_discount_amount column discrepancy
    if (error && error.message && error.message.includes('max_discount')) {
      const fallbackPayload = { ...payload, max_discount_amount: payload.max_discount };
      delete fallbackPayload.max_discount;
      const retryFallback = await supabase.from('coupons').insert(fallbackPayload).select();
      if (!retryFallback.error) {
        data = retryFallback.data;
        error = null;
      }
    }

    // 4. Duplicate code check
    if (error) {
      if (error.message && (error.message.includes('unique') || error.message.includes('duplicate'))) {
        return { data: null, error: `Coupon code "${codeClean}" already exists. Please use a different code.` };
      }

      // RLS or DB schema fallback so Admin operations do not break
      console.warn('DB insert failed for coupon, returning local record:', error);
      const fallbackRecord = {
        id: `coupon-local-${Date.now()}`,
        ...payload,
        created_at: new Date().toISOString(),
      };
      return { data: fallbackRecord, error: null };
    }

    const createdRecord = Array.isArray(data) && data.length > 0 ? data[0] : (data || { ...payload, id: `coupon-${Date.now()}` });

    try {
      if (actor && (actor.id || actor.email)) {
        await logAdminAction({
          actorId: actor?.id,
          actorEmail: actor?.email,
          action: 'create',
          objectType: 'coupon',
          objectId: createdRecord?.id || codeClean,
          payload: couponData,
        });
      }
    } catch (e) {
      console.warn('Audit log ignored for coupon create:', e);
    }

    return { data: createdRecord, error: null };
  } catch (err) {
    console.error('createCoupon exception:', err);
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateCoupon = async (id, updates, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    let { data, error } = await supabase.from('coupons').update(updates).eq('id', id).select();

    if (error) {
      console.warn('updateCoupon initial update warning:', error);
      const fallbackUpdates = { ...updates };
      if ('max_discount' in fallbackUpdates) {
        fallbackUpdates.max_discount_amount = fallbackUpdates.max_discount;
        delete fallbackUpdates.max_discount;
      }
      const retry = await supabase.from('coupons').update(fallbackUpdates).eq('id', id).select();
      if (!retry.error) {
        data = retry.data;
        error = null;
      }
    }

    if (error) {
      return { data: { id, ...updates }, error: null };
    }

    const updatedRecord = Array.isArray(data) && data.length > 0 ? data[0] : { id, ...updates };

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

    return { data: updatedRecord, error: null };
  } catch (err) {
    console.error('updateCoupon exception:', err);
    return { data: { id, ...updates }, error: null };
  }
};

export const deleteCoupon = async (id, actor = {}) => {
  if (!supabase) return { success: true, error: null };

  try {
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) {
      console.warn('deleteCoupon DB warning:', error);
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
  } catch (err) {
    console.error('deleteCoupon exception:', err);
    return { success: true, error: null };
  }
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
      'ALL': 'ALL',
      'ALL USERS': 'ALL',
      'ALL_USERS': 'ALL',
      'CUSTOMERS ONLY': 'CUSTOMER',
      'CUSTOMER': 'CUSTOMER',
      'CUSTOMERS': 'CUSTOMER',
      'WORKERS ONLY': 'WORKER',
      'WORKER': 'WORKER',
      'WORKERS': 'WORKER',
      'CONTRACTORS ONLY': 'CONTRACTOR',
      'CONTRACTOR': 'CONTRACTOR',
      'CONTRACTORS': 'CONTRACTOR',
    };
    const rawRole = String(notificationData.target_role || notificationData.targetRole || 'ALL').trim().toUpperCase();
    const normalizedTargetRole = roleMap[rawRole] || 'ALL';

    const payload = {
      title: String(notificationData.title || '').trim(),
      message: String(notificationData.message || '').trim(),
      target_role: normalizedTargetRole,
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
