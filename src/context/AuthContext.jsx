// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getCityOptions } from '../data/mockData';

const AppContext = createContext();

export const AuthProvider = ({ children }) => {
  // Auth state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(null);

  // Application data
  const [bookings, setBookings] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [services, setServices] = useState([]);
  const [cities, setCities] = useState([]);
  const [cityControl, setCityControl] = useState({});

  // Fetch all profiles (RLS will filter automatically based on role)
  const fetchMarketplaceData = async () => {
    const [
      { data: bk },
      { data: wk },
      { data: ct },
      { data: pr },
      { data: rv },
      { data: tk },
      { data: sv },
      { data: cs },
      { data: cList }
    ] = await Promise.all([
      supabase.from('bookings').select('*'),
      supabase.from('workers').select('*'),
      supabase.from('contractors').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('reviews').select('*'),
      supabase.from('support_tickets').select('*'),
      supabase.from('services').select('*'),
      supabase.from('city_services').select('*'),
      supabase.from('cities').select('*'),
    ]);

    setBookings(bk || []);
    setWorkers(wk || []);
    setContractors(ct || []);
    setProfiles(pr || []);
    setTickets(tk || []);
    setServices(sv || []);
    setCities(getCityOptions(cList || []));

    // Process reviews to match frontend expectations
    const processedReviews = (rv || []).map(r => {
      const b = (bk || []).find(booking => booking.id === r.booking_id);
      return {
        ...r,
        userName: b?.customer_name || 'Customer',
        serviceType: r.service_type || b?.service_name || 'Home Service'
      };
    });
    setReviews(processedReviews);

    // Build cityControl map { cityId: { serviceId: enabled } }
    const cityMap = {};
    (cs || []).forEach(({ city_id, service_id, enabled }) => {
      if (!cityMap[city_id]) cityMap[city_id] = {};
      cityMap[city_id][service_id] = enabled;
    });
    setCityControl(cityMap);
  };

  const fetchUserProfile = async (userId) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      if (profile.role === 'worker') {
        const { data: workerData } = await supabase.from('workers').select('*').eq('id', userId).single();
        setUser({ ...profile, ...workerData, trustScore: workerData?.trust_score ?? 100 });
      } else if (profile.role === 'contractor') {
        const { data: contractorData } = await supabase.from('contractors').select('*').eq('id', userId).single();
        setUser({ ...profile, ...contractorData });
      } else {
        setUser(profile);
      }
    } else {
      setUser(null);
    }
  };

  // ---------------------------------------------------------------------
  // Initialization: load session and fetch initial data from Supabase
  // ---------------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      if (!supabase) {
        setInitError(new Error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.'));
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
      await fetchMarketplaceData();
      setLoading(false);
    };

    init();

    if (!supabase) return;

    // Listen for Auth changes dynamically
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // ---------------------------------------------------------------------
  // Auth helpers
  // ---------------------------------------------------------------------
  const uploadProfilePhoto = async (userId, file) => {
    if (!file) return { publicUrl: '' };

    const filenameParts = file.name.split('.');
    const fileExtension = filenameParts.length > 1 ? filenameParts.pop() : 'jpg';
    const filePath = `profile-photos/${userId}/profile-photo.${fileExtension}`;
    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      console.warn('Profile photo upload warning:', uploadError);
      return { publicUrl: '' };
    }

    const { data: urlData, error: urlError } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    if (urlError) {
      console.warn('Failed to generate profile photo URL:', urlError);
      return { publicUrl: '' };
    }

    return { publicUrl: urlData.publicUrl };
  };

  const register = async (email, password, role, extra) => {
    setLoading(true);
    const { data: signUp, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      console.error('Registration error:', signUpError);
      setLoading(false);
      return { success: false, error: signUpError };
    }
    if (!signUp?.user) {
      console.error('Registration failed: no user returned');
      setLoading(false);
      return { success: false, error: new Error('No user after signUp') };
    }
    if (role === 'admin') {
      setLoading(false);
      return { success: false, error: { message: "Security Violation: Cannot register as admin." } };
    }

    let profilePhotoUrl = extra?.profile_photo_url || '';
    if (extra?.profile_photo) {
      const { publicUrl, error: uploadError } = await uploadProfilePhoto(signUp.user.id, extra.profile_photo);
      if (uploadError) {
        console.error('Profile photo upload error:', uploadError);
        setLoading(false);
        return { success: false, error: new Error(uploadError.message || 'Profile photo upload failed. Please check Supabase storage bucket configuration.') };
      }
      profilePhotoUrl = publicUrl;
    }

    const profile = {
      id: signUp.user.id,
      email,
      role,
      name: extra?.name || '',
      phone: extra?.phone || '',
      city: extra?.city || ''
    };

    const { error: profileError } = await supabase.from('profiles').insert(profile);
    if (profileError) {
      setLoading(false);
      return { success: false, error: profileError };
    }

    if (role === 'worker') {
      const worker = {
        id: profile.id,
        status: 'Pending Verification',
        trust_score: 100,
        skills: extra?.skills || '',
        city: extra?.city || '',
        whatsapp: extra?.whatsapp || '',
        experience: extra?.experience || '',
        id_proof_url: extra?.id_proof_url || '',
        profile_photo_url: profilePhotoUrl,
        location_text: extra?.location_text || '',
        location_latitude: extra?.location_latitude ?? null,
        location_longitude: extra?.location_longitude ?? null,
        location_source: extra?.location_source || ''
      };
      const { error: workerError } = await supabase.from('workers').insert(worker);
      if (workerError) {
        setLoading(false);
        return {
          success: false,
          error: new Error(workerError.message || 'Worker registration failed. Please verify your Supabase schema includes the workers location columns.'),
        };
      }
    } else if (role === 'contractor') {
      const contractor = {
        id: profile.id,
        status: 'Pending Approval',
        company: extra?.company || '',
        city: extra?.city || '',
        owner_name: extra?.owner_name || '',
        whatsapp: extra?.whatsapp || '',
        gst: extra?.gst || '',
        services_offered: extra?.services_offered || '',
        location_text: extra?.location_text || '',
        location_latitude: extra?.location_latitude ?? null,
        location_longitude: extra?.location_longitude ?? null,
        location_source: extra?.location_source || ''
      };
      const { error: contractorError } = await supabase.from('contractors').insert(contractor);
      if (contractorError) {
        setLoading(false);
        return { success: false, error: contractorError };
      }

      // Satisfy foreign key constraint in bookings for contractor as worker_id
      const workerForContractor = {
        id: profile.id,
        status: 'Pending Verification',
        trust_score: 100,
        skills: 'Contractor',
        city: extra?.city || '',
        location_text: extra?.location_text || '',
        location_latitude: extra?.location_latitude ?? null,
        location_longitude: extra?.location_longitude ?? null,
        location_source: extra?.location_source || ''
      };
      const { error: workerError } = await supabase.from('workers').insert(workerForContractor);
      if (workerError) {
        console.error('Failed to create matching worker for contractor:', workerError);
        setLoading(false);
        return {
          success: false,
          error: new Error(workerError.message || 'Contractor registration failed while creating matching worker. Please verify your Supabase schema includes the workers location columns.'),
        };
      }
    }

    await fetchUserProfile(signUp.user.id);
    await fetchMarketplaceData();
    setLoading(false);
    return { success: true };
  };

  const login = async (email, password) => {
    setLoading(true);
    const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      console.error('Login error:', signInError);
      setLoading(false);
      return { success: false, error: signInError };
    }

    await fetchUserProfile(signIn.user.id);
    await fetchMarketplaceData();
    setLoading(false);
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const forgotPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { success: !error, error };
  };

  const resetPassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { success: !error, error };
  };

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
      console.error("Booking update failed", error);
      alert("Failed to update booking status: " + error.message);
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
      console.error("Worker trust update failed", error);
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
      console.error("Worker status update failed", error);
      alert("Failed to update worker status.");
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
      console.error("Contractor status update failed", error);
      alert("Failed to update contractor status.");
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
      console.error("Ticket update failed", error);
      alert("Failed to update ticket status.");
    }
    return { error };
  };

  const updateServicePrice = async (id, base_price, platform_fee) => {
    const { error } = await supabase.from('services').update({ base_price, platform_fee }).eq('id', id);
    if (!error) {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, base_price, platform_fee } : s)));
      alert("Service pricing updated successfully!");
    } else {
      console.error("Service pricing update failed", error);
      alert("Failed to update service pricing.");
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
    isAuthenticated: !!user,
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
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
        const b = bookings.find(bk => bk.id === review.bookingId);
        const newRvFormatted = {
          ...data[0],
          userName: b?.customer_name || user?.name || 'Customer',
          serviceType: data[0].service_type || b?.service_name || 'Home Service'
        };
        setReviews((prev) => [...prev, newRvFormatted]);
      }
      return { data, error };
    },
    setReviews,
    tickets,
    addTicket,
    updateTicketStatus,
    services,
    cities,
    updateServicePrice,
    cityControl,
    toggleServiceInCity,
    refreshData: fetchMarketplaceData
  };

  return (
    <AppContext.Provider value={value}>
      {!loading && (
        initError ? (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-xl w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-slate-700">
              <h1 className="text-xl font-black text-slate-900 mb-4">Configuration required</h1>
              <p className="text-sm text-slate-600 mb-3">Fixiva needs Supabase credentials to run.</p>
              <pre className="bg-slate-100 p-4 rounded-xl text-xs text-slate-800 overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project-id.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key`}
              </pre>
              <p className="text-sm text-slate-500 mt-3">Create a <code className="bg-slate-100 px-1 rounded">.env</code> file in the project root and restart the dev server.</p>
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
