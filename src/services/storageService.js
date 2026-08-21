import { supabase } from '../lib/supabaseClient';

/**
 * Helper to convert file to Base64 Data URL so image persists reliably in state/DB/localStorage
 */
export const fileToDataUrl = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve(URL.createObjectURL(file));
    reader.readAsDataURL(file);
  });
};

/**
 * Storage Service for image uploads to Supabase Storage with automatic Base64 Data URL fallback
 * Guarantees that profile photo & asset updates never fail even if Supabase buckets do not exist.
 */
export const uploadImage = async (file, bucket = 'cms-assets', folder = 'catalog') => {
  if (!file) {
    return { success: false, url: '', error: 'No file provided' };
  }

  if (typeof file === 'string') {
    if (file.startsWith('blob:')) {
      return { success: false, url: '', error: 'Blob URL not supported for persistence' };
    }
    return { success: true, url: file };
  }

  // Pre-convert to Data URL as resilient fallback
  let dataUrlFallback = '';
  try {
    dataUrlFallback = await fileToDataUrl(file);
  } catch (e) {
    void e;
  }

  if (!supabase) {
    if (dataUrlFallback) {
      return { success: true, url: dataUrlFallback, error: null };
    }
    return { success: false, url: '', error: 'Supabase storage client not available' };
  }

  try {
    const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${fileExt}`;

    // Try primary bucket upload
    let { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

    // Try fallback bucket if primary bucket fails with Bucket / Not Found
    if (error && (error.message.includes('not found') || error.message.includes('Bucket') || error.message.includes('bucket'))) {
      const retryBucket = bucket === 'cms-assets' ? 'services' : 'cms-assets';
      const retryFallback = await supabase.storage.from(retryBucket).upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (!retryFallback.error && retryFallback.data) {
        data = retryFallback.data;
        error = null;
        bucket = retryBucket;
      }
    }

    // If Supabase storage upload returns error (e.g. Bucket not found, RLS policy, missing permissions), use Data URL fallback
    if (error) {
      console.warn('[storageService] Supabase storage upload notice:', error.message, '- Falling back to Base64 Data URL for persistent storage.');
      if (dataUrlFallback) {
        return { success: true, url: dataUrlFallback, error: null };
      }
      return { success: false, url: '', error: error.message };
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    const finalUrl = publicUrlData?.publicUrl || dataUrlFallback;
    return { success: true, url: finalUrl, error: null };
  } catch (err) {
    console.warn('[storageService] Exception during storage upload, using Data URL fallback:', err);
    if (dataUrlFallback) {
      return { success: true, url: dataUrlFallback, error: null };
    }
    return { success: false, url: '', error: err instanceof Error ? err.message : String(err) };
  }
};
