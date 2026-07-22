import { supabase } from '../lib/supabaseClient';

/**
 * Storage Service for image uploads to Supabase Storage with URL fallback support
 */
export const uploadImage = async (file, bucket = 'cms-assets', folder = 'catalog') => {
  if (!file) {
    return { success: false, url: '', error: 'No file provided' };
  }

  // If file is already a string URL, return it directly
  if (typeof file === 'string') {
    return { success: true, url: file };
  }

  if (!supabase) {
    return { success: false, url: '', error: 'Supabase client not initialized' };
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${fileExt}`;

    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (error) {
      // Fall back to object URL preview if storage bucket upload fails or is restricted
      const localPreviewUrl = URL.createObjectURL(file);
      return { success: false, url: localPreviewUrl, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return { success: true, url: publicUrlData?.publicUrl || '' };
  } catch (err) {
    return { success: false, url: '', error: err instanceof Error ? err.message : String(err) };
  }
};
