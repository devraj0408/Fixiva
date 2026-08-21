import { supabase } from '../lib/supabaseClient';

/**
 * Helper to convert file to Base64 Data URL so image persists reliably in state/DB/localStorage
 */
const fileToDataUrl = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve(URL.createObjectURL(file));
    reader.readAsDataURL(file);
  });
};

/**
 * Storage Service for image uploads to Supabase Storage with URL & Base64 fallback support
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

  if (!supabase) {
    return { success: false, url: '', error: 'Supabase storage client not available' };
  }

  try {
    const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${fileExt}`;

    let { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (error && (error.message.includes('not found') || error.message.includes('Bucket'))) {
      const retryFallback = await supabase.storage.from('services').upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (!retryFallback.error && retryFallback.data) {
        data = retryFallback.data;
        error = null;
        bucket = 'services';
      }
    }

    if (error) {
      console.warn('Supabase storage upload failed:', error.message);
      return { success: false, url: '', error: error.message };
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    const finalUrl = publicUrlData?.publicUrl || '';
    return { success: true, url: finalUrl, error: null };
  } catch (err) {
    console.warn('Exception during image upload:', err);
    return { success: false, url: '', error: err instanceof Error ? err.message : String(err) };
  }
};

