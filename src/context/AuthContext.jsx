// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext();

export const AuthProvider = ({ children }) => {
  // Auth state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    setCities(cList || []);

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
        profile_photo_url: extra?.profile_photo_url || ''
      };
      const { error: workerError } = await supabase.from('workers').insert(worker);
      if (workerError) {
        setLoading(false);
        return { success: false, error: workerError };
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
        services_offered: extra?.services_offered || ''
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
        city: extra?.city || ''
      };
      const { error: workerError } = await supabase.from('workers').insert(workerForContractor);
      if (workerError) {
        console.error('Failed to create matching worker for contractor:', workerError);
        setLoading(false);
        return { success: false, error: workerError };
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
  const addBooking = async (booking) => {
    const { data, error } = await supabase.from('bookings').insert({ ...booking, status: 'New Request' }).select();
    if (!error && data) {
      setBookings((prev) => [...prev, data[0]]);
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

  return <AppContext.Provider value={value}>{!loading && children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AuthProvider');
  return context;
};

export const useAuth = useApp;
export const AppProvider = AuthProvider;
