import { supabase } from '../lib/supabaseClient';
import { logAdminAction } from './auditService';

/**
 * Content Service - Banners, Offers, and FAQs CRUD Operations
 */

// ==========================================
// BANNERS CRUD
// ==========================================

export const getBanners = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) return { data: [], error: error.message };
    const activeData = (data || []).filter((b) => b.is_deleted !== true);
    return { data: activeData, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const createBanner = async (bannerData, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  const payload = {
    title: bannerData.title,
    subtitle: bannerData.subtitle || '',
    image_url: bannerData.image_url || '',
    link_url: bannerData.link_url || '',
    position: bannerData.position || 'home_hero',
    display_order: Number(bannerData.display_order || 0),
    active: bannerData.active !== false,
  };

  try {
    const { data, error } = await supabase.from('banners').insert(payload).select().maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create',
      objectType: 'banner',
      objectId: data?.id || payload.title,
      payload: bannerData,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateBanner = async (id, updates, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('banners').update(updates).eq('id', id).select().maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update',
      objectType: 'banner',
      objectId: id,
      payload: updates,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const deleteBanner = async (id, actor = {}) => {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    const { error } = await supabase.from('banners').update({ active: false, is_deleted: true }).eq('id', id);

    if (error) {
      await supabase.from('banners').delete().eq('id', id);
    }

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'delete',
      objectType: 'banner',
      objectId: id,
      payload: { deleted: true },
    });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

// ==========================================
// OFFERS CRUD
// ==========================================

export const getOffers = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('offers').select('*').order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const createOffer = async (offerData, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  const payload = {
    title: offerData.title,
    badge: offerData.badge || 'PROMO',
    description: offerData.description || '',
    image_url: offerData.image_url || '',
    active: offerData.active !== false,
  };

  try {
    const { data, error } = await supabase.from('offers').insert(payload).select().maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create',
      objectType: 'offer',
      objectId: data?.id || payload.title,
      payload: offerData,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateOffer = async (id, updates, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('offers').update(updates).eq('id', id).select().maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update',
      objectType: 'offer',
      objectId: id,
      payload: updates,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const deleteOffer = async (id, actor = {}) => {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    await supabase.from('offers').delete().eq('id', id);

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'delete',
      objectType: 'offer',
      objectId: id,
      payload: { deleted: true },
    });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

// ==========================================
// FAQS CRUD
// ==========================================

export const getFaqs = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const createFaq = async (faqData, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  const payload = {
    question: faqData.question,
    answer: faqData.answer,
    category: faqData.category || 'General',
    display_order: Number(faqData.display_order || 0),
    active: faqData.active !== false,
  };

  try {
    const { data, error } = await supabase.from('faqs').insert(payload).select().maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'create',
      objectType: 'faq',
      objectId: data?.id || payload.question,
      payload: faqData,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateFaq = async (id, updates, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase.from('faqs').update(updates).eq('id', id).select().maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update',
      objectType: 'faq',
      objectId: id,
      payload: updates,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const deleteFaq = async (id, actor = {}) => {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    await supabase.from('faqs').delete().eq('id', id);

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'delete',
      objectType: 'faq',
      objectId: id,
      payload: { deleted: true },
    });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};
