import { supabase } from '../lib/supabaseClient';

/**
 * Audit Logging Service using existing public.admin_audit table / log_admin_action RPC
 */
export const logAdminAction = async ({
  actorId = null,
  actorEmail = '',
  action,
  objectType = '',
  objectId = '',
  payload = {},
}) => {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    // 1. Try calling log_admin_action RPC if available
    const { error: rpcError } = await supabase.rpc('log_admin_action', {
      p_actor_id: actorId,
      p_actor_email: actorEmail,
      p_action: action,
      p_object_type: objectType,
      p_object_id: String(objectId || ''),
      p_payload: payload,
    });

    if (!rpcError) {
      return { success: true };
    }

    // 2. Direct insert into admin_audit as fallback
    const { error: insertError } = await supabase.from('admin_audit').insert({
      actor_id: actorId,
      actor_email: actorEmail,
      action: action,
      object_type: objectType,
      object_id: String(objectId || ''),
      payload: payload,
    });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};
