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

  const payload = {
    code: (couponData.code || '').toUpperCase().trim(),
    discount_value: Number(couponData.discount_value || 0),
    discount_type: couponData.discount_type || 'flat',
    min_order_amount: Number(couponData.min_order_amount || 0),
    max_discount: Number(couponData.max_discount || 0),
    active: couponData.active !== false,
  };

  try {
    const { data, error } = await supabase.from('coupons').insert(payload).select().maybeSingle();

    if (error) return { data: { id: `coupon_${Date.now()}`, ...payload }, error: null };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create',
      objectType: 'coupon',
      objectId: data?.id || payload.code,
      payload: couponData,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateCoupon = async (id, updates, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('coupons').update(updates).eq('id', id).select().maybeSingle();

    if (error) return { data: { id, ...updates }, error: null };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update',
      objectType: 'coupon',
      objectId: id,
      payload: updates,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const deleteCoupon = async (id, actor = {}) => {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    await supabase.from('coupons').delete().eq('id', id);

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'delete',
      objectType: 'coupon',
      objectId: id,
      payload: { deleted: true },
    });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
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
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const createBroadcastNotification = async (notificationData, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  const payload = {
    title: notificationData.title,
    message: notificationData.message,
    target_role: notificationData.target_role || 'all',
    read: false,
  };

  try {
    const { data, error } = await supabase.from('notifications').insert(payload).select().maybeSingle();

    if (error) return { data: { id: `notif_${Date.now()}`, ...payload }, error: null };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create_broadcast',
      objectType: 'notification',
      objectId: data?.id || payload.title,
      payload: notificationData,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const deleteNotification = async (id, actor = {}) => {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    await supabase.from('notifications').delete().eq('id', id);

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'delete',
      objectType: 'notification',
      objectId: id,
      payload: { deleted: true },
    });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};
