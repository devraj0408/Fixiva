import { supabase } from '../lib/supabaseClient';
import { logAdminAction } from './auditService';

/**
 * Content Service - Banners, Offers, and FAQs CRUD Operations
 */

// ==========================================
// BANNERS CRUD WITH SCHEMALESS & LOCALSTORAGE FALLBACK
// ==========================================

const CUSTOM_BANNERS_KEY = 'fixiva_custom_banners';
const BANNER_UPDATES_KEY = 'fixiva_banner_updates';
const DELETED_BANNERS_KEY = 'fixiva_deleted_banners';

const getStoredCustomBanners = () => {
  try {
    const raw = localStorage.getItem(CUSTOM_BANNERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    void e;
    return [];
  }
};

const saveCustomBannerToStorage = (banner) => {
  try {
    const current = getStoredCustomBanners();
    const filtered = current.filter(b => b.id !== banner.id && (b.title || '').toLowerCase() !== (banner.title || '').toLowerCase());
    localStorage.setItem(CUSTOM_BANNERS_KEY, JSON.stringify([banner, ...filtered]));
  } catch (err) {
    console.warn('Failed to save custom banner to localStorage:', err);
  }
};

const getStoredBannerUpdates = () => {
  try {
    const raw = localStorage.getItem(BANNER_UPDATES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    void e;
    return {};
  }
};

const saveBannerUpdateToStorage = (id, updates) => {
  try {
    const map = getStoredBannerUpdates();
    map[id] = { ...(map[id] || {}), ...updates };
    localStorage.setItem(BANNER_UPDATES_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to save banner update to localStorage:', err);
  }
};

const getStoredDeletedBannerIds = () => {
  try {
    const raw = localStorage.getItem(DELETED_BANNERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    void e;
    return [];
  }
};

const saveDeletedBannerIdToStorage = (id) => {
  try {
    const current = getStoredDeletedBannerIds();
    if (!current.includes(id)) {
      localStorage.setItem(DELETED_BANNERS_KEY, JSON.stringify([...current, id]));
    }
  } catch (err) {
    console.warn('Failed to save deleted banner ID to localStorage:', err);
  }
};

export const getBanners = async () => {
  let dbData = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data) {
        dbData = data;
      }
    } catch (e) {
      void e;
    }
  }

  const customList = getStoredCustomBanners();
  const deletedIds = getStoredDeletedBannerIds();
  const updatesMap = getStoredBannerUpdates();

  const combined = [...dbData, ...customList];
  const bannerMap = new Map();

  combined.forEach(b => {
    if (!b || deletedIds.includes(b.id) || b.is_deleted === true) return;
    const key = b.id || b.title;
    const updates = updatesMap[b.id] || updatesMap[b.title];
    const finalItem = updates ? { ...b, ...updates } : b;
    if (!bannerMap.has(key)) {
      bannerMap.set(key, finalItem);
    }
  });

  return { data: Array.from(bannerMap.values()), error: null };
};

export const createBanner = async (bannerData, actor = {}) => {
  const newBanner = {
    id: bannerData.id || `banner-${Date.now()}`,
    title: String(bannerData.title || '').trim(),
    subtitle: String(bannerData.subtitle || '').trim(),
    image_url: String(bannerData.image_url || '').trim(),
    link_url: String(bannerData.link_url || '').trim(),
    position: String(bannerData.position || 'home_hero').trim(),
    display_order: Number(bannerData.display_order || 0),
    active: bannerData.active !== false,
    created_at: new Date().toISOString(),
  };

  let createdData = null;

  if (supabase) {
    try {
      const payload = {
        title: newBanner.title,
        subtitle: newBanner.subtitle,
        image_url: newBanner.image_url,
        link_url: newBanner.link_url,
        position: newBanner.position,
        display_order: newBanner.display_order,
        active: newBanner.active,
      };

      let { data, error } = await supabase.from('banners').insert(payload).select().maybeSingle();

      // If DB error occurs (e.g. missing 'link_url' column in Supabase schema), retry stripped payload
      if (error) {
        console.warn('createBanner full payload error, retrying without link_url column:', error.message);
        const strippedPayload = {
          title: newBanner.title,
          subtitle: newBanner.subtitle,
          image_url: newBanner.image_url,
          position: newBanner.position,
          display_order: newBanner.display_order,
          active: newBanner.active,
        };
        const retry = await supabase.from('banners').insert(strippedPayload).select().maybeSingle();
        if (retry.data) {
          createdData = { ...retry.data, link_url: newBanner.link_url };
        }
      } else if (data) {
        createdData = data;
      }
    } catch (e) {
      void e;
    }
  }

  const finalBanner = createdData || newBanner;
  saveCustomBannerToStorage(finalBanner);

  await logAdminAction({
    actorId: actor?.id,
    actorEmail: actor?.email,
    action: 'create',
    objectType: 'banner',
    objectId: finalBanner.id,
    payload: bannerData,
  });

  return { data: finalBanner, error: null };
};

export const updateBanner = async (id, updates, actor = {}) => {
  saveBannerUpdateToStorage(id, updates);

  if (supabase) {
    try {
      let { data, error } = await supabase.from('banners').update(updates).eq('id', id).select().maybeSingle();

      if (error && error.message && error.message.includes('link_url')) {
        const copy = { ...updates };
        delete copy.link_url;
        const retry = await supabase.from('banners').update(copy).eq('id', id).select().maybeSingle();
        if (retry.data) {
          data = { ...retry.data, link_url: updates.link_url };
        }
      }

      if (data) {
        return { data, error: null };
      }
    } catch (e) {
      void e;
    }
  }

  await logAdminAction({
    actorId: actor?.id,
    actorEmail: actor?.email,
    action: 'update',
    objectType: 'banner',
    objectId: id,
    payload: updates,
  });

  return { data: { id, ...updates }, error: null };
};

export const deleteBanner = async (id, actor = {}) => {
  saveDeletedBannerIdToStorage(id);

  if (supabase) {
    try {
      const { error } = await supabase.from('banners').update({ active: false, is_deleted: true }).eq('id', id);
      if (error) {
        await supabase.from('banners').delete().eq('id', id);
      }
    } catch (e) {
      void e;
    }
  }

  await logAdminAction({
    actorId: actor?.id,
    actorEmail: actor?.email,
    action: 'delete',
    objectType: 'banner',
    objectId: id,
    payload: { deleted: true },
  });

  return { success: true, error: null };
};

// ==========================================
// OFFERS CRUD WITH SCHEMALESS & LOCALSTORAGE FALLBACK
// ==========================================

const CUSTOM_OFFERS_KEY = 'fixiva_custom_offers';
const OFFER_UPDATES_KEY = 'fixiva_offer_updates';
const DELETED_OFFERS_KEY = 'fixiva_deleted_offers';

const getStoredCustomOffers = () => {
  try {
    const raw = localStorage.getItem(CUSTOM_OFFERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    void e;
    return [];
  }
};

const saveCustomOfferToStorage = (offer) => {
  try {
    const current = getStoredCustomOffers();
    const filtered = current.filter(o => o.id !== offer.id && (o.title || '').toLowerCase() !== (offer.title || '').toLowerCase());
    localStorage.setItem(CUSTOM_OFFERS_KEY, JSON.stringify([offer, ...filtered]));
  } catch (err) {
    console.warn('Failed to save custom offer to localStorage:', err);
  }
};

const getStoredOfferUpdates = () => {
  try {
    const raw = localStorage.getItem(OFFER_UPDATES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    void e;
    return {};
  }
};

const saveOfferUpdateToStorage = (id, updates) => {
  try {
    const map = getStoredOfferUpdates();
    map[id] = { ...(map[id] || {}), ...updates };
    localStorage.setItem(OFFER_UPDATES_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to save offer update to localStorage:', err);
  }
};

const getStoredDeletedOfferIds = () => {
  try {
    const raw = localStorage.getItem(DELETED_OFFERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    void e;
    return [];
  }
};

const saveDeletedOfferIdToStorage = (id) => {
  try {
    const current = getStoredDeletedOfferIds();
    if (!current.includes(id)) {
      localStorage.setItem(DELETED_OFFERS_KEY, JSON.stringify([...current, id]));
    }
  } catch (err) {
    console.warn('Failed to save deleted offer ID to localStorage:', err);
  }
};

export const getOffers = async () => {
  let dbData = [];

  if (supabase) {
    try {
      const { data, error } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        dbData = data;
      }
    } catch (e) {
      void e;
    }
  }

  const customList = getStoredCustomOffers();
  const deletedIds = getStoredDeletedOfferIds();
  const updatesMap = getStoredOfferUpdates();

  const combined = [...dbData, ...customList];
  const offerMap = new Map();

  combined.forEach(o => {
    if (!o || deletedIds.includes(o.id) || o.is_deleted === true) return;
    const key = o.id || o.title;
    const updates = updatesMap[o.id] || updatesMap[o.title];
    const finalItem = updates ? { ...o, ...updates } : o;
    if (!offerMap.has(key)) {
      offerMap.set(key, finalItem);
    }
  });

  return { data: Array.from(offerMap.values()), error: null };
};

export const createOffer = async (offerData, actor = {}) => {
  const newOffer = {
    id: offerData.id || `offer-${Date.now()}`,
    title: String(offerData.title || '').trim(),
    badge: String(offerData.badge || 'HOT DEAL').trim(),
    description: String(offerData.description || '').trim(),
    image_url: String(offerData.image_url || '').trim(),
    active: offerData.active !== false,
    created_at: new Date().toISOString(),
  };

  let createdData = null;

  if (supabase) {
    try {
      const payload = {
        title: newOffer.title,
        badge: newOffer.badge,
        description: newOffer.description,
        image_url: newOffer.image_url,
        active: newOffer.active,
      };

      let { data, error } = await supabase.from('offers').insert(payload).select().maybeSingle();

      // If DB error occurs (e.g. missing 'badge' column in schema cache), retry stripped payload
      if (error) {
        console.warn('createOffer full payload error, retrying without badge column:', error.message);
        const strippedPayload = {
          title: newOffer.title,
          description: newOffer.description,
          image_url: newOffer.image_url,
          active: newOffer.active,
        };
        const retry = await supabase.from('offers').insert(strippedPayload).select().maybeSingle();
        if (retry.data) {
          createdData = { ...retry.data, badge: newOffer.badge };
        }
      } else if (data) {
        createdData = data;
      }
    } catch (e) {
      void e;
    }
  }

  const finalOffer = createdData || newOffer;
  saveCustomOfferToStorage(finalOffer);

  await logAdminAction({
    actorId: actor?.id,
    actorEmail: actor?.email,
    action: 'create',
    objectType: 'offer',
    objectId: finalOffer.id,
    payload: offerData,
  });

  return { data: finalOffer, error: null };
};

export const updateOffer = async (id, updates, actor = {}) => {
  saveOfferUpdateToStorage(id, updates);

  if (supabase) {
    try {
      let { data, error } = await supabase.from('offers').update(updates).eq('id', id).select().maybeSingle();

      if (error && error.message && error.message.includes('badge')) {
        const copy = { ...updates };
        delete copy.badge;
        const retry = await supabase.from('offers').update(copy).eq('id', id).select().maybeSingle();
        if (retry.data) {
          data = { ...retry.data, badge: updates.badge };
        }
      }

      if (data) {
        return { data, error: null };
      }
    } catch (e) {
      void e;
    }
  }

  await logAdminAction({
    actorId: actor?.id,
    actorEmail: actor?.email,
    action: 'update',
    objectType: 'offer',
    objectId: id,
    payload: updates,
  });

  return { data: { id, ...updates }, error: null };
};

export const deleteOffer = async (id, actor = {}) => {
  saveDeletedOfferIdToStorage(id);

  if (supabase) {
    try {
      await supabase.from('offers').delete().eq('id', id);
    } catch (e) {
      void e;
    }
  }

  await logAdminAction({
    actorId: actor?.id,
    actorEmail: actor?.email,
    action: 'delete',
    objectType: 'offer',
    objectId: id,
    payload: { deleted: true },
  });

  return { success: true, error: null };
};

// ==========================================
// FAQS CRUD WITH SCHEMALESS & LOCALSTORAGE FALLBACK
// ==========================================

const CUSTOM_FAQS_KEY = 'fixiva_custom_faqs';
const FAQ_UPDATES_KEY = 'fixiva_faq_updates';
const DELETED_FAQS_KEY = 'fixiva_deleted_faqs';

const getStoredCustomFaqs = () => {
  try {
    const raw = localStorage.getItem(CUSTOM_FAQS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    void e;
    return [];
  }
};

const saveCustomFaqToStorage = (faq) => {
  try {
    const current = getStoredCustomFaqs();
    const filtered = current.filter(f => f.id !== faq.id && (f.question || '').toLowerCase() !== (faq.question || '').toLowerCase());
    localStorage.setItem(CUSTOM_FAQS_KEY, JSON.stringify([faq, ...filtered]));
  } catch (err) {
    console.warn('Failed to save custom FAQ to localStorage:', err);
  }
};

const getStoredFaqUpdates = () => {
  try {
    const raw = localStorage.getItem(FAQ_UPDATES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    void e;
    return {};
  }
};

const saveFaqUpdateToStorage = (id, updates) => {
  try {
    const map = getStoredFaqUpdates();
    map[id] = { ...(map[id] || {}), ...updates };
    localStorage.setItem(FAQ_UPDATES_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to save FAQ update to localStorage:', err);
  }
};

const getStoredDeletedFaqIds = () => {
  try {
    const raw = localStorage.getItem(DELETED_FAQS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    void e;
    return [];
  }
};

const saveDeletedFaqIdToStorage = (id) => {
  try {
    const current = getStoredDeletedFaqIds();
    if (!current.includes(id)) {
      localStorage.setItem(DELETED_FAQS_KEY, JSON.stringify([...current, id]));
    }
  } catch (err) {
    console.warn('Failed to save deleted FAQ ID to localStorage:', err);
  }
};

export const getFaqs = async () => {
  let dbData = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data) {
        dbData = data;
      }
    } catch (e) {
      void e;
    }
  }

  const customList = getStoredCustomFaqs();
  const deletedIds = getStoredDeletedFaqIds();
  const updatesMap = getStoredFaqUpdates();

  const combined = [...dbData, ...customList];
  const faqMap = new Map();

  combined.forEach(f => {
    if (!f || deletedIds.includes(f.id)) return;
    const key = f.id || f.question;
    const updates = updatesMap[f.id] || updatesMap[f.question];
    const finalItem = updates ? { ...f, ...updates } : f;
    if (!faqMap.has(key)) {
      faqMap.set(key, finalItem);
    }
  });

  return { data: Array.from(faqMap.values()), error: null };
};

export const createFaq = async (faqData, actor = {}) => {
  const rawCategory = faqData.category ? String(faqData.category).trim().toUpperCase() : 'GENERAL';
  const validCategories = ['GENERAL', 'ACCOUNT', 'BOOKINGS', 'PAYMENTS'];
  const normalizedCategory = validCategories.includes(rawCategory) ? rawCategory : (rawCategory || 'GENERAL');

  const newFaq = {
    id: faqData.id || `faq-${Date.now()}`,
    question: String(faqData.question || '').trim(),
    answer: String(faqData.answer || '').trim(),
    category: normalizedCategory,
    display_order: Number.isFinite(Number(faqData.display_order)) ? Number(faqData.display_order) : 0,
    active: faqData.active === true || faqData.active === 'true' || faqData.active === 1 || faqData.active === '1',
  };

  let createdData = null;

  if (supabase) {
    try {
      const payload = {
        question: newFaq.question,
        answer: newFaq.answer,
        category: newFaq.category,
        display_order: newFaq.display_order,
        active: newFaq.active,
      };

      let { data, error } = await supabase.from('faqs').insert(payload).select().maybeSingle();

      if (error && error.message && error.message.includes('category')) {
        const fallbackPayload = {
          question: payload.question,
          answer: payload.answer,
          display_order: payload.display_order,
          active: payload.active,
        };
        const retry = await supabase.from('faqs').insert(fallbackPayload).select().maybeSingle();
        if (retry.data) {
          createdData = { ...retry.data, category: normalizedCategory };
        }
      } else if (data) {
        createdData = data;
      }
    } catch (e) {
      void e;
    }
  }

  const finalFaq = createdData || newFaq;
  saveCustomFaqToStorage(finalFaq);

  await logAdminAction({
    actorId: actor?.id,
    actorEmail: actor?.email,
    action: 'create',
    objectType: 'faq',
    objectId: finalFaq.id,
    payload: faqData,
  });

  return { data: finalFaq, error: null };
};

export const updateFaq = async (id, updates, actor = {}) => {
  saveFaqUpdateToStorage(id, updates);

  if (supabase) {
    try {
      const payload = { ...updates };
      if (payload.category) {
        payload.category = String(payload.category).trim().toUpperCase();
      }
      let { data } = await supabase.from('faqs').update(payload).eq('id', id).select().maybeSingle();

      if (data) {
        return { data, error: null };
      }
    } catch (e) {
      void e;
    }
  }

  await logAdminAction({
    actorId: actor?.id,
    actorEmail: actor?.email,
    action: 'update',
    objectType: 'faq',
    objectId: id,
    payload: updates,
  });

  return { data: { id, ...updates }, error: null };
};

export const deleteFaq = async (id, actor = {}) => {
  saveDeletedFaqIdToStorage(id);

  if (supabase) {
    try {
      await supabase.from('faqs').delete().eq('id', id);
    } catch (e) {
      void e;
    }
  }

  await logAdminAction({
    actorId: actor?.id,
    actorEmail: actor?.email,
    action: 'delete',
    objectType: 'faq',
    objectId: id,
    payload: { deleted: true },
  });

  return { success: true, error: null };
};
