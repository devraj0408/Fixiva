// src/context/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import Confirm from '../components/Confirm';
import { useToast } from './ToastContext';
import { supabase } from '../lib/supabaseClient';
import { isAdminRole } from '../lib/adminAccess';

const AppContext = createContext();

const PRIMARY_ADMIN_EMAIL = 'fixiva869@gmail.com';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizePhone = (value) => String(value || '').replace(/\D/g, '');
const detectIdentifierKind = (value) => {
  if (!value) return 'email';
  return String(value).includes('@') ? 'email' : 'phone';
};
const resolveEmailForAuth = async (supabaseClient, normalized) => {
  const kind = detectIdentifierKind(normalized);
  if (kind === 'phone') {
    const { data: profile } = await supabaseClient.from('profiles').select('email').eq('phone', normalizePhone(normalized)).maybeSingle();
    if (!profile?.email) {
      return null;
    }
    return profile.email;
  }
  return normalizeEmail(normalized);
};

export const AuthProvider = ({ children }) => {
  // Auth state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(null);

  // Refs to prevent race conditions and double loading
  const isVerifyingOtpRef = useRef(false);
  const isInitializingRef = useRef(false);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Application data
  const [bookings, setBookings] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [services, setServices] = useState([]);
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [coverageRequests, setCoverageRequests] = useState([]);
  const [cityControl, setCityControl] = useState({});
  const [serviceSupportsCategory, setServiceSupportsCategory] = useState(true);
  const { showToast } = useToast();

  // Confirm dialog (promise-based)
  const [confirmState, setConfirmState] = useState(null);
  const confirm = (message, title = 'Confirm') => new Promise((resolve) => {
    setConfirmState({ message, title, resolve });
  });
  const resolveConfirm = (value) => {
    if (confirmState?.resolve) confirmState.resolve(value);
    setConfirmState(null);
  };

  // Fetch marketplace data
  const fetchMarketplaceData = useCallback(async () => {
    const fetchWithFallback = async (table, columns = '*') => {
      if (!supabase) {
        return [];
      }
      const { data, error } = await supabase.from(table).select(columns);
      if (error) {
        return [];
      }
      return data || [];
    };

    const fetchServices = async () => {
      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase.from('services').select('id,name,description,base_price,platform_fee,active');
      if (!error) {
        return (data || []).map((item) => ({ ...item, category: item.category || '' }));
      }
      return [];
    };

    const [bk, wk, ct, pr, rv, tk, sv, cs] = await Promise.all([
      fetchWithFallback('bookings'),
      fetchWithFallback('workers'),
      fetchWithFallback('contractors'),
      fetchWithFallback('profiles'),
      fetchWithFallback('reviews'),
      fetchWithFallback('support_tickets'),
      fetchServices(),
      fetchWithFallback('city_services', 'city_id,service_id,enabled'),
    ]);

    const fallbackServices = [
      { id: 'plumbing', name: 'Plumbing', description: 'Home plumbing support', category: 'Home Services', base_price: 499, platform_fee: 99, active: true },
      { id: 'electrical', name: 'Electrical', description: 'Electrical repairs and inspections', category: 'Home Services', base_price: 599, platform_fee: 129, active: true },
      { id: 'cleaning', name: 'Cleaning', description: 'Deep cleaning and maintenance', category: 'Home Services', base_price: 399, platform_fee: 79, active: true },
    ];

    setBookings(bk || []);
    setWorkers(wk || []);
    setContractors(ct || []);
    setProfiles(pr || []);
    setTickets(tk || []);
    setServices((sv || []).length > 0 ? sv : fallbackServices);
    setCities([]);
    setStates([]);
    setCoverageRequests([]);

    const processedReviews = (rv || []).map(r => {
      const b = (bk || []).find(booking => booking.id === r.booking_id);
      return {
        ...r,
        userName: b?.customer_name || 'Customer',
        serviceType: r.service_type || b?.service_name || 'Home Service'
      };
    });
    setReviews(processedReviews);

    const cityMap = {};
    (cs || []).forEach(({ city_id, service_id, enabled }) => {
      if (!cityMap[city_id]) cityMap[city_id] = {};
      cityMap[city_id][service_id] = enabled;
    });
    setCityControl(cityMap);
  }, []);

  const fetchUserProfile = useCallback(async function fetchUserProfile(userId, fallbackEmail = '') {
    if (!supabase || !userId) {
      setUser(null);
      return null;
    }

    const normalizedEmail = normalizeEmail(fallbackEmail);
    const isAdminEmail = normalizedEmail === PRIMARY_ADMIN_EMAIL;

    try {
      // 1. Check profile by ID
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // 2. Search by email if not found by ID to avoid duplicate key insertion
      if (!profile && normalizedEmail) {
        const { data: emailProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (emailProfile) {
          const updatePayload = {
            id: userId,
            account_status: 'active',
            ...(isAdminEmail ? { role: 'admin' } : {}),
          };
          await supabase.from('profiles').update(updatePayload).eq('email', normalizedEmail).catch(() => null);

          profile = {
            ...emailProfile,
            id: userId,
            account_status: 'active',
            role: isAdminEmail ? 'admin' : (emailProfile.role || 'customer'),
          };
        }
      }

      // 3. Create ONE profile safely if not found
      if (!profile && normalizedEmail) {
        const newRole = isAdminEmail ? 'admin' : 'customer';
        const newProfile = {
          id: userId,
          email: normalizedEmail,
          role: newRole,
          name: normalizedEmail.split('@')[0] || 'User',
          phone: '',
          city: '',
          account_status: 'active',
          email_verified: true,
        };

        const { data: inserted, error: insertErr } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .maybeSingle();

        if (!insertErr && inserted) {
          profile = inserted;
        } else {
          profile = newProfile;
        }
      }

      if (!profile) {
        setUser(null);
        return null;
      }

      // 4. Ensure admin role and active status for fixiva869@gmail.com
      const emailToCheck = normalizeEmail(profile.email || fallbackEmail);
      if (emailToCheck === PRIMARY_ADMIN_EMAIL) {
        if (profile.role !== 'admin' || profile.account_status !== 'active') {
          await supabase
            .from('profiles')
            .update({ role: 'admin', account_status: 'active' })
            .eq('id', userId)
            .catch(() => null);

          profile.role = 'admin';
          profile.account_status = 'active';
        }
      }

      let userData = { ...profile };
      const normalizedRole = String(userData.role || '').trim().toLowerCase();

      if (normalizedRole === 'worker') {
        const { data: workerData } = await supabase.from('workers').select('*').eq('id', userId).maybeSingle();
        userData = { ...userData, ...workerData, trustScore: workerData?.trust_score ?? 100 };
      } else if (normalizedRole === 'contractor') {
        const { data: contractorData } = await supabase.from('contractors').select('*').eq('id', userId).maybeSingle();
        userData = { ...userData, ...contractorData };
      }

      setUser(userData);
      return userData;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const verifyDatabaseSchema = async () => {
      if (!supabase) return false;
      const requiredTables = ['services', 'profiles'];

      for (const table of requiredTables) {
        const selectCols = table === 'city_services' ? 'city_id,service_id' : 'id';
        const { error } = await supabase.from(table).select(selectCols).limit(1).maybeSingle();
        if (error) return false;
      }

      const { error: categoryError } = await supabase.from('services').select('category').limit(1);
      setServiceSupportsCategory(!categoryError);
      return true;
    };

    const init = async () => {
      setLoading(true);
      isInitializingRef.current = true;
      if (!supabase) {
        setInitError(new Error('Missing Supabase configuration.'));
        setLoading(false);
        isInitializingRef.current = false;
        return;
      }

      await verifyDatabaseSchema();

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchUserProfile(session.user.id, session.user.email);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }

      await fetchMarketplaceData();
      setLoading(false);
      isInitializingRef.current = false;
    };

    init();

    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isInitializingRef.current || isVerifyingOtpRef.current) return;

      if (session?.user) {
        if (userRef.current && userRef.current.id === session.user.id) return;
        setLoading(true);
        try {
          await fetchUserProfile(session.user.id, session.user.email);
          await fetchMarketplaceData();
        } catch {
          // Silent catch
        }
        setLoading(false);
      } else {
        setUser(null);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [fetchUserProfile, fetchMarketplaceData]);

  const requestOtp = async (identifier, purpose = 'sign-in') => {
    if (!supabase) {
      return { success: false, error: new Error('Supabase is not configured.') };
    }

    const normalized = String(identifier || '').trim();
    if (!normalized) {
      return { success: false, error: new Error('Please enter your email address.') };
    }

    const email = await resolveEmailForAuth(supabase, normalized);
    if (!email) {
      return { success: false, error: new Error('No account was found for that email.') };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, email };
  };

  const verifyOtp = async (identifier, otpCode) => {
    const normalized = String(identifier || '').trim();
    if (!supabase) {
      return { success: false, error: new Error('Supabase is not configured.') };
    }
    if (!normalized) {
      return { success: false, error: new Error('Please enter your email address.') };
    }

    const email = await resolveEmailForAuth(supabase, normalized);
    if (!email) {
      return { success: false, error: new Error('No account was found for that email.') };
    }

    setLoading(true);
    isVerifyingOtpRef.current = true;

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: String(otpCode).replace(/\D/g, ''),
        type: 'email',
      });

      if (error) {
        setLoading(false);
        return { success: false, error: new Error('OTP failure: ' + error.message) };
      }

      const authUserId = data?.user?.id;
      if (!authUserId) {
        setLoading(false);
        return { success: false, error: new Error('Session failure: Unable to create authenticated session.') };
      }

      const profileRow = await fetchUserProfile(authUserId, email);
      await fetchMarketplaceData();

      setLoading(false);
      return { success: true, user: data?.user, profile: profileRow };
    } catch (err) {
      setLoading(false);
      return { success: false, error: new Error('Session failure: ' + (err instanceof Error ? err.message : String(err))) };
    } finally {
      isVerifyingOtpRef.current = false;
    }
  };

  const register = async (email, password, role, extra) => ({ success: true, payload: { email, password, role, extra } });
  const login = async (email, password) => ({ success: true, payload: { email, password } });

  const logout = async () => {
    await supabase?.auth?.signOut();
    setUser(null);
  };

  const forgotPassword = async () => ({ success: true });
  const resetPassword = async () => ({ success: true });

  // ---------------------------------------------------------------------
  // Data mutation helpers
  // ---------------------------------------------------------------------
  const getBookingCityName = (booking) => {
    if (booking?.city) return booking.city;
    if (booking?.city_id && cities.length > 0) {
      const city = cities.find((item) => item.id === booking.city_id);
      return city?.name || '';
    }
    return '';
  };

  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    if ([lat1, lon1, lat2, lon2].some((value) => value === null || value === undefined || Number.isNaN(value))) {
      return Number.POSITIVE_INFINITY;
    }

    const toRadians = (value) => (value * Math.PI) / 180;
    const radius = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return radius * c;
  };

  const autoAssignBookingToWorker = async (booking) => {
    if (!booking || booking.worker_id) {
      return { success: false, reason: 'already-assigned' };
    }

    const bookingCityName = getBookingCityName(booking);
    const availableWorkers = workers.filter((worker) => {
      const workerCity = (worker.city || '').toLowerCase();
      const targetCity = (bookingCityName || '').toLowerCase();
      return worker.status === 'Verified' && (!targetCity || workerCity === targetCity);
    });

    if (availableWorkers.length === 0) {
      return { success: false, reason: 'no-worker-found' };
    }

    const bookingLatitude = booking?.location_latitude ?? null;
    const bookingLongitude = booking?.location_longitude ?? null;
    const bestWorker = [...availableWorkers].sort((a, b) => {
      const aDistance = bookingLatitude !== null && bookingLongitude !== null && a?.location_latitude !== null && a?.location_longitude !== null
        ? getDistanceKm(bookingLatitude, bookingLongitude, a.location_latitude, a.location_longitude)
        : Number.POSITIVE_INFINITY;
      const bDistance = bookingLatitude !== null && bookingLongitude !== null && b?.location_latitude !== null && b?.location_longitude !== null
        ? getDistanceKm(bookingLatitude, bookingLongitude, b.location_latitude, b.location_longitude)
        : Number.POSITIVE_INFINITY;
      const distanceCompare = aDistance - bDistance;
      if (distanceCompare !== 0) return distanceCompare;
      return (b.trust_score ?? 100) - (a.trust_score ?? 100);
    })[0];
    const profile = profiles.find((item) => item.id === bestWorker.id);
    const assignmentPayload = {
      worker_id: bestWorker.id,
      worker_name: profile?.name || profile?.email || 'Verified Specialist',
      worker_phone: profile?.phone || null,
      status: 'Assigned',
    };

    const { error } = await supabase.from('bookings').update(assignmentPayload).eq('id', booking.id);
    if (!error) {
      setBookings((prev) => prev.map((item) => item.id === booking.id ? { ...item, ...assignmentPayload } : item));
      return { success: true, worker: bestWorker, profile };
    }

    return { success: false, error };
  };

  const autoAssignPendingBookingToWorker = async (workerData) => {
    const worker = workerData || workers.find((item) => item.id === workerData?.id);
    if (!worker || worker.status !== 'Verified') {
      return { success: false, reason: 'worker-not-ready' };
    }

    const pendingBooking = bookings.find((booking) => {
      if (booking.status !== 'New Request' || booking.worker_id) return false;
      const bookingCityName = getBookingCityName(booking);
      const workerCity = (worker.city || '').toLowerCase();
      const targetCity = (bookingCityName || '').toLowerCase();
      return !targetCity || workerCity === targetCity;
    });

    if (!pendingBooking) {
      return { success: false, reason: 'no-pending-booking' };
    }

    return autoAssignBookingToWorker(pendingBooking);
  };

  const addBooking = async (booking) => {
    const { data, error } = await supabase.from('bookings').insert({ ...booking, status: 'New Request' }).select();
    if (!error && data) {
      const newBooking = data[0];
      setBookings((prev) => [...prev, newBooking]);
      await autoAssignBookingToWorker(newBooking);
    }
    return { data, error };
  };

  const generateServiceId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `svc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  };

  const updateBookingStatus = async (id, status) => {
    const booking = bookings.find((b) => b.id === id);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (!error) {
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
      
      // Automatic Trust Score modifications based on outcomes
      if (booking?.worker_id) {
        if (status === 'Completed') {
          await updateWorkerTrust(booking.worker_id, 2);
        } else if (status === 'Worker No Show') {
          await updateWorkerTrust(booking.worker_id, -20);
        } else if (status === 'Customer No Show') {
          await updateWorkerTrust(booking.worker_id, 5); // Little incentive for the hassle
        } else if (status === 'Cancelled') {
          await updateWorkerTrust(booking.worker_id, -5); // Penalty for cancellation
        }
      }
    } else {
      // Failed to update booking
      showToast("Failed to update booking status: " + error.message, 'error');
    }
    return { error };
  };

  const updateWorkerTrust = async (id, delta) => {
    const worker = workers.find((w) => w.id === id);
    if (!worker) return { error: new Error('Worker not found') };
    const newScore = Math.min(100, Math.max(0, (worker.trust_score ?? 100) + delta));
    let newStatus = worker.status;
    if (newScore < 40) newStatus = 'Suspended';
    const { error } = await supabase.from('workers').update({ trust_score: newScore, status: newStatus }).eq('id', id);
    if (!error) {
      setWorkers((prev) => prev.map((w) => (w.id === id ? { ...w, trust_score: newScore, status: newStatus } : w)));
    } else {
      // Failed to update worker trust
    }
    return { error };
  };

  const updateWorkerStatus = async (id, status) => {
    const { error } = await supabase.from('workers').update({ status }).eq('id', id);
    if (!error) {
      setWorkers((prev) => prev.map((w) => (w.id === id ? { ...w, status } : w)));

      if (status === 'Verified') {
        await autoAssignPendingBookingToWorker({ id, status });
      }

      // Also check if this worker is a contractor, and sync status
      const isContractor = contractors.some(c => c.id === id);
      if (isContractor) {
        const contractorStatus = status === 'Verified' ? 'Approved' : status === 'Rejected' ? 'Rejected' : 'Pending Approval';
        await supabase.from('contractors').update({ status: contractorStatus }).eq('id', id);
        setContractors((prev) => prev.map((c) => (c.id === id ? { ...c, status: contractorStatus } : c)));
      }
    } else {
      showToast("Failed to update worker status.", 'error');
    }
    return { error };
  };

  const updateContractorStatus = async (id, status) => {
    const { error } = await supabase.from('contractors').update({ status }).eq('id', id);
    if (!error) {
      setContractors((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));

      // Also update matching worker status to match approval
      const workerStatus = status === 'Approved' ? 'Verified' : status === 'Rejected' ? 'Rejected' : 'Pending Verification';
      await supabase.from('workers').update({ status: workerStatus }).eq('id', id);
      setWorkers((prev) => prev.map((w) => (w.id === id ? { ...w, status: workerStatus } : w)));

      if (workerStatus === 'Verified') {
        await autoAssignPendingBookingToWorker({ id, status: workerStatus });
      }
    } else {
      showToast("Failed to update contractor status.", 'error');
    }
    return { error };
  };

  const addTicket = async (ticket) => {
    const payload = {
      user_id: ticket.user_id,
      subject: ticket.subject,
      message: ticket.message,
      status: 'Open',
    };
    const { data, error } = await supabase.from('support_tickets').insert(payload).select();
    if (!error && data) setTickets((prev) => [...prev, data[0]]);
    return { data, error };
  };

  const updateTicketStatus = async (id, status) => {
    const { error } = await supabase.from('support_tickets').update({ status }).eq('id', id);
    if (!error) {
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    } else {
      showToast("Failed to update ticket status.", 'error');
    }
    return { error };
  };

  const updateUserRole = async (id, role) => {
    const profile = profiles.find((p) => p.id === id);
    if (!profile) {
      const error = new Error('Profile not found.');
      showToast(error.message, 'error');
      return { error };
    }

    if (user?.id === id && role !== 'admin') {
      const error = new Error('You cannot demote your own admin account.');
      showToast(error.message, 'error');
      return { error };
    }

    const configuredAdmins = getConfiguredAdminList();
    if (role !== 'admin' && isAdminEmail(profile.email, configuredAdmins.join(','))) {
      const error = new Error('Cannot demote a configured admin email.');
      showToast(error.message, 'error');
      return { error };
    }

    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (!error) {
      setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)));
      await fetchMarketplaceData();
      showToast('User role updated successfully.', 'success');
    } else {
      showToast('Failed to update user role.', 'error');
    }
    return { error };
  };

  const updateServicePrice = async (id, base_price, platform_fee) => {
    const { error } = await supabase.from('services').update({ base_price, platform_fee }).eq('id', id);
    if (!error) {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, base_price, platform_fee } : s)));
      showToast("Service pricing updated successfully!", 'success');
    } else {
      showToast("Failed to update service pricing.", 'error');
    }
    return { error };
  };

  const toggleServiceInCity = async (cityId, serviceId, enabled) => {
    const { error } = await supabase
      .from('city_services')
      .upsert({ city_id: cityId, service_id: serviceId, enabled }, { onConflict: 'city_id,service_id' });
    if (!error) {
      setCityControl((prev) => ({
        ...prev,
        [cityId]: { ...(prev[cityId] || {}), [serviceId]: enabled },
      }));
    }
    return { error };
  };

  const sanitizeRecord = (record) => {
    return Object.entries(record).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
  };

  const createService = async ({ name, description = '', category = '', base_price = 0, platform_fee = 0, cityIds = [] }) => {
    const serviceId = generateServiceId();

    const payload = sanitizeRecord({
      id: serviceId,
      name,
      description: description || undefined,
      category: serviceSupportsCategory ? (category || undefined) : undefined,
      base_price,
      platform_fee,
      active: true,
    });

    const { data, error } = await supabase.from('services').insert(payload).select();
    if (!error && data && data[0]) {
      const persistedService = data[0];
      setServices((prev) => [...prev, persistedService]);

      await Promise.all((cityIds || []).map((cityId) => (
        supabase.from('city_services').upsert({ city_id: cityId, service_id: persistedService.id, enabled: true }, { onConflict: 'city_id,service_id' })
      ))).catch(() => null);

      await fetchMarketplaceData();
      showToast('Service created successfully', 'success');
      return { data: persistedService };
    }

    showToast('Failed to create service: ' + (error?.message || 'unknown'), 'error');
    return { error };
  };

  const updateService = async (id, updates = {}, cityIds) => {
    const cleanUpdates = sanitizeRecord(updates);
    if (!serviceSupportsCategory) {
      delete cleanUpdates.category;
    }
    const { error } = await supabase.from('services').update(cleanUpdates).eq('id', id);
    if (!error) {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...cleanUpdates } : s)));
      if (Array.isArray(cityIds)) {
        const allCityIds = (cities || []).map(c => c.id);
        await Promise.all(allCityIds.map(async (cityId) => {
          const enabled = cityIds.includes(cityId);
          await supabase.from('city_services').upsert({ city_id: cityId, service_id: id, enabled }, { onConflict: 'city_id,service_id' });
        }));
      }
      await fetchMarketplaceData();
      showToast('Service updated', 'success');
      return { error: null };
    }
    showToast('Failed to update service: ' + (error?.message || 'unknown'), 'error');
    return { error };
  };

  const deleteService = async (id) => {
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from('services').delete().eq('id', id),
      supabase.from('city_services').delete().eq('service_id', id),
    ]);
    if (!e1 && !e2) {
      setServices((prev) => prev.filter(s => s.id !== id));
      await fetchMarketplaceData();
      showToast('Service deleted', 'success');
      return { error: null };
    }
    showToast('Failed to delete service', 'error');
    return { error: e1 || e2 };
  };

  // Merge profile information for workers & contractors
  const mergedWorkers = workers.map((w) => {
    const p = profiles.find((prof) => prof.id === w.id);
    const c = contractors.find((cont) => cont.id === w.id);
    return {
      ...w,
      name: c?.company || p?.name || 'Service Professional',
      email: p?.email || '',
      phone: p?.phone || '',
      city: w.city || p?.city || '',
      trustScore: w.trust_score ?? 100,
      isContractor: !!c
    };
  });

  const mergedContractors = contractors.map((c) => {
    const p = profiles.find((prof) => prof.id === c.id);
    return {
      ...c,
      name: p?.name || 'Contractor Owner',
      email: p?.email || '',
      phone: p?.phone || '',
      company: c.company || 'Business Entity',
      city: c.city || p?.city || ''
    };
  });

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    requestOtp,
    verifyOtp,
    confirm,
    showToast,
    bookings,
    addBooking,
    updateBookingStatus,
    workers: mergedWorkers,
    updateWorkerStatus,
    updateWorkerTrust,
    contractors: mergedContractors,
    updateContractorStatus,
    reviews,
    addReview: async (review) => {
      const payload = {
        booking_id: review.bookingId,
        worker_id: review.workerId,
        rating: review.rating,
        comment: review.comment,
        service_type: review.serviceType
      };
      const { data, error } = await supabase.from('reviews').insert(payload).select();
      if (!error && data) {
        setReviews((prev) => [
          {
            ...data[0],
            userName: user?.name || 'Customer',
            serviceType: payload.service_type || 'Home Service'
          },
          ...prev
        ]);
      }
      return { data, error };
    },
    setReviews,
    
    submitCoverageRequest: async (city, state, email) => {
      if (!supabase) {
        return { success: false, error: new Error('Supabase is not configured.') };
      }

      const normCity = String(city || '').trim().toLowerCase();
      const normEmail = String(email || '').trim().toLowerCase();

      // Check duplicate against existing local state to avoid slow queries
      const isDuplicate = coverageRequests.some(
        (r) => String(r.city || '').trim().toLowerCase() === normCity && String(r.email || '').trim().toLowerCase() === normEmail
      );

      if (isDuplicate) {
        return { success: false, error: 'duplicate' };
      }

      const payload = {
        city: String(city || '').trim(),
        state: String(state || '').trim(),
        email: normEmail,
        status: 'Pending'
      };

      const { data, error } = await supabase.from('coverage_requests').insert(payload).select();
      if (error) {
        return { success: false, error };
      }

      // Trigger Resend email notification
      try {
        const resendApiKey = import.meta?.env?.VITE_RESEND_API_KEY || '';
        if (resendApiKey) {
          const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Fixiva <onboarding@fixiva.app>',
              to: ['fixiva869@gmail.com'],
              subject: 'New Coverage Request - Fixiva',
              text: `City: ${payload.city}\nState: ${payload.state}\nEmail: ${payload.email}\nSubmission Time: ${time}`,
            }),
          });
        }
      } catch {
        // Email notification failed
      }

      if (data) {
        setCoverageRequests((prev) => [data[0], ...prev]);
      }

      return { success: true, data };
    },

    updateCoverageRequestStatus: async (id, status) => {
      const { error } = await supabase.from('coverage_requests').update({ status }).eq('id', id);
      if (!error) {
        setCoverageRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
        showToast(`Request marked as ${status}.`, 'success');
      } else {
        showToast("Failed to update request status.", 'error');
      }
      return { error };
    },

    deleteCoverageRequest: async (id) => {
      const { error } = await supabase.from('coverage_requests').delete().eq('id', id);
      if (!error) {
        setCoverageRequests((prev) => prev.filter((r) => r.id !== id));
        showToast("Coverage request deleted.", 'success');
      } else {
        showToast("Failed to delete request.", 'error');
      }
      return { error };
    },
    tickets,
    addTicket,
    updateTicketStatus,
    services,
    cities,
    states,
    addState: async (name) => {
      const { data, error } = await supabase.from('states').insert({ name, status: 'Live', display_order: 0 }).select();
      if (!error) await fetchMarketplaceData();
      return { data, error };
    },
    updateState: async (id, updates) => {
      const { data, error } = await supabase.from('states').update(updates).eq('id', id).select();
      if (!error) await fetchMarketplaceData();
      return { data, error };
    },
    deleteState: async (id) => {
      const { error } = await supabase.from('states').delete().eq('id', id);
      if (!error) await fetchMarketplaceData();
      return { error };
    },
    addDistrict: async (stateId, stateName, name, status = 'Coming Soon') => {
      const { data, error } = await supabase.from('cities').insert({ 
        name, 
        region: stateName, 
        state_id: stateId, 
        status, 
        display_order: 0 
      }).select();
      if (!error) await fetchMarketplaceData();
      return { data, error };
    },
    updateDistrict: async (id, updates) => {
      const updatesCopy = { ...updates };
      if (updates.state_id) {
        // Find state name
        const matchedState = states.find(s => s.id === updates.state_id);
        if (matchedState) {
          updatesCopy.region = matchedState.name;
        }
      }
      const { data, error } = await supabase.from('cities').update(updatesCopy).eq('id', id).select();
      if (!error) await fetchMarketplaceData();
      return { data, error };
    },
    deleteDistrict: async (id) => {
      const { error } = await supabase.from('cities').delete().eq('id', id);
      if (!error) await fetchMarketplaceData();
      return { error };
    },
    updateServicePrice,
    createService,
    updateService,
    deleteService,
    updateUserRole,
    cityControl,
    toggleServiceInCity,
    coverageRequests,
    refreshData: fetchMarketplaceData
  };

  return (
    <AppContext.Provider value={value}>
      <Confirm open={!!confirmState} title={confirmState?.title} message={confirmState?.message} onClose={resolveConfirm} />
      {!loading && (
        initError ? (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-xl w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-slate-700">
              {initError.message?.includes('Missing Supabase configuration') ? (
                <>
                  <h1 className="text-xl font-black text-slate-900 mb-4">Configuration required</h1>
                  <p className="text-sm text-slate-600 mb-3">Fixiva needs Supabase credentials to run.</p>
                  <pre className="bg-slate-100 p-4 rounded-xl text-xs text-slate-800 overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project-id.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key`}
                  </pre>
                  <p className="text-sm text-slate-500 mt-3">Create a <code className="bg-slate-100 px-1 rounded">.env</code> file in the project root and restart the dev server.</p>
                </>
              ) : (
                <>
                  <h1 className="text-xl font-black text-slate-900 mb-4">Database schema mismatch</h1>
                  <p className="text-sm text-slate-600 mb-3">Fixiva connected to Supabase, but the expected tables or columns are missing.</p>
                  <div className="bg-slate-100 p-4 rounded-xl text-sm text-slate-800 overflow-x-auto">
                    <p className="font-semibold">Error:</p>
                    <p>{initError.message}</p>
                  </div>
                  <p className="text-sm text-slate-500 mt-3">Verify your Supabase schema and restart the dev server.</p>
                </>
              )}
            </div>
          </div>
        ) : children
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AuthProvider');
  return context;
};

export const useAuth = useApp;
export const AppProvider = AuthProvider;
