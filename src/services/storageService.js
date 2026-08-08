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

  // If file is already a string URL/Base64, return it directly
  if (typeof file === 'string') {
    return { success: true, url: file };
  }

  if (!supabase) {
    const localUrl = await fileToDataUrl(file);
    return { success: true, url: localUrl, fallback: true };
  }

  try {
    const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${fileExt}`;

    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (error) {
      console.warn('Supabase storage upload failed, using Base64 data URL fallback:', error.message);
      const localDataUrl = await fileToDataUrl(file);
      return { success: true, url: localDataUrl, fallback: true, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return { success: true, url: publicUrlData?.publicUrl || '' };
  } catch (err) {
    console.warn('Exception during image upload, using Base64 fallback:', err);
    const localDataUrl = await fileToDataUrl(file);
    return { success: true, url: localDataUrl, fallback: true };
  }
};

