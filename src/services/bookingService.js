import { supabase } from '../lib/supabaseClient';
import { logAdminAction } from './auditService';

/**
 * Booking Service - Bookings, Payments, Support Tickets, and Settings CRUD Operations
 */

// ==========================================
// BOOKINGS CRUD
// ==========================================

export const getBookings = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateBookingStatus = async (id, status, workerId = null, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  const updates = { status };
  if (workerId) {
    updates.worker_id = workerId;
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update_booking_status',
      objectType: 'booking',
      objectId: id,
      payload: updates,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

export const assignWorkerToBooking = async (bookingId, worker, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  const payload = {
    worker_id: worker.id,
    worker_name: worker.name || worker.email || 'Verified Specialist',
    worker_phone: worker.phone || null,
    status: 'Assigned',
  };

  try {
    const { data, error } = await supabase
      .from('bookings')
      .update(payload)
      .eq('id', bookingId)
      .select()
      .maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'assign_worker',
      objectType: 'booking',
      objectId: bookingId,
      payload: { worker_id: worker.id, worker_name: payload.worker_name },
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

// ==========================================
// PAYMENTS CRUD
// ==========================================

export const getPayments = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const updatePaymentStatus = async (id, status, actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('payments')
      .update({ status })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) return { data: null, error: error.message };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update_payment_status',
      objectType: 'payment',
      objectId: id,
      payload: { status },
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

// ==========================================
// SUPPORT TICKETS CRUD
// ==========================================

export const getSupportTickets = async () => {
  if (!supabase) return { data: [], error: 'Supabase client not initialized' };

  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
};

export const updateTicketStatus = async (id, status, adminReply = '', actor = {}) => {
  if (!supabase) return { data: null, error: 'Supabase client not initialized' };

  const updates = { status };
  if (adminReply) {
    updates.admin_reply = adminReply;
  }

  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) return { data: { id, ...updates }, error: null };

    await logAdminAction({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'update_ticket_status',
      objectType: 'support_ticket',
      objectId: id,
      payload: updates,
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
};

// ==========================================
// SYSTEM SETTINGS & FEATURE FLAGS
// ==========================================

export const getSystemSettings = () => {
  return {
    maintenanceMode: false,
    enableCoupons: true,
    enableOffers: true,
    enableReviews: true,
    enableWallet: false,
    enableOnlinePayments: false,
    enableCashPayments: true,
    enableNotifications: true,
    enableReferrals: false,
    enableWorkerLiveTracking: true,
    defaultServiceRadiusKm: 15,
    defaultPlatformFee: 49,
    emergencyBookingEnabled: true,
  };
};
