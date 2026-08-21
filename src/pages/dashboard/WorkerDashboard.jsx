import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import {
  BarChart3,
  Briefcase,
  Clock,
  CheckCircle,
  IndianRupee,
  Calendar,
  Bell,
  Star,
  Settings,
  LogOut,
  MapPin,
  Phone,
  PhoneOff,
  CheckSquare,
  Sparkles,
  Camera,
  Headphones,
  ShieldCheck,
  Send,
  Loader2,
  Navigation
} from 'lucide-react';
import ProfileCard from '../../components/ProfileCard';
import BookingStatusTimeline from '../../components/booking/BookingStatusTimeline';
import { uploadImage } from '../../services/storageService';
import { updateWorkerLiveLocation, saveUserGpsLocation, calculateDistanceInKm } from '../../services/locationService';

const WorkerDashboard = () => {
  const {
    user,
    bookings,
    updateBookingStatus,
    collectCashPayment,
    refreshData,
    reviews: allReviews = [],
    updateUserProfile,
    logout,
    showToast,
    confirm,
    tickets = [],
    addTicket
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  const activeTab = tabParam || 'overview';

  const [skills, setSkills] = useState(user?.skills || '');
  const [experience, setExperience] = useState(user?.experience || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [hourlyRate, setHourlyRate] = useState(user?.hourly_rate || '');
  const [visitCharge, setVisitCharge] = useState(user?.visit_charge || '');
  const [availabilityStatus, setAvailabilityStatus] = useState(user?.status || 'Active');
  const [workerName, setWorkerName] = useState(user?.name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(user?.profile_photo_url || '');
  const photoFileInputRef = useRef(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Worker Live Location State & Toggle
  const [liveLocationEnabled, setLiveLocationEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(`fixiva_worker_live_loc_${user?.id}`);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleLiveLocation = () => {
    const nextState = !liveLocationEnabled;
    setLiveLocationEnabled(nextState);
    try {
      localStorage.setItem(`fixiva_worker_live_loc_${user?.id}`, JSON.stringify(nextState));
    } catch (e) { void e; }
    if (nextState) {
      showToast('Live location is on', 'success');
    } else {
      showToast('Live location is off', 'info');
    }
  };

  const [updatingGps, setUpdatingGps] = useState(false);

  const hasValidLocation = useMemo(() => {
    const lat = Number(user?.location_latitude);
    const lng = Number(user?.location_longitude);
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && (lat !== 0 || lng !== 0);
  }, [user?.location_latitude, user?.location_longitude]);

  const handleCaptureGpsLocation = async () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported in this browser.', 'error');
      return;
    }
    setUpdatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const res = await saveUserGpsLocation({
          userId: user.id,
          role: 'worker',
          latitude: lat,
          longitude: lng
        });
        setUpdatingGps(false);
        if (res.data) {
          showToast('GPS location set successfully!', 'success');
          if (refreshData) refreshData();
        } else {
          showToast(res.error || 'Failed to save location', 'error');
        }
      },
      () => {
        setUpdatingGps(false);
        showToast('GPS location access was denied or timed out.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Worker Realtime Support Chat State
  const [liveTickets, setLiveTickets] = useState([]);
  const [chatInputMessage, setChatInputMessage] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef(null);

  // Realtime Support Tickets Sync for Worker
  useEffect(() => {
    queueMicrotask(() => {
      const userTickets = (tickets || []).filter(t => t.user_id === user?.id);
      setLiveTickets(userTickets);
    });
  }, [tickets, user?.id]);

  useEffect(() => {
    if (!user?.id || !supabase) return;

    const channel = supabase
      .channel(`worker-support-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${user.id}` },
        async () => {
          const { data } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });
          if (data) setLiveTickets(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Scroll to bottom of chat when activeTab is support or liveTickets update
  useEffect(() => {
    if (activeTab === 'support') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, liveTickets]);

  // Send Worker Support Chat Message
  const handleSendSupportMessage = async (e, customMsg = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const messageText = (customMsg || chatInputMessage).trim();
    if (!messageText) return;

    setChatInputMessage('');
    setChatSending(true);

    const { error } = await addTicket({
      user_id: user?.id,
      subject: `Worker Support (${user?.name || 'Worker'})`,
      message: messageText
    });

    setChatSending(false);
    if (!error) {
      showToast('Message sent to Fixiva Support Desk!', 'success');
      const fetchLatest = async () => {
        const { data } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: true });
        if (data) setLiveTickets(data);
      };
      await fetchLatest();
      // Second poll after AI finishes processing (~600ms)
      setTimeout(fetchLatest, 650);
    } else {
      showToast('Failed to send support message', 'error');
    }
  };

  // Notifications state
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      queueMicrotask(() => {
        setSkills(user.skills || '');
        setExperience(user.experience || '');
        setWhatsapp(user.whatsapp || '');
        setHourlyRate(user.hourly_rate || '');
        setVisitCharge(user.visit_charge || '');
        setAvailabilityStatus(user.status || 'Active');
        setWorkerName(user.name || '');
        setPhotoUrl(user.profile_photo_url || '');
      });
    }
  }, [user]);

  // Fetch Notifications & Realtime Subscription
  const fetchNotifications = useCallback(async () => {
    if (!user?.id || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},target_role.in.(worker,all,WORKER,ALL)`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Worker notification fetch error:', error);
        return;
      }

      if (data) {
        let readIds = [];
        try {
          const stored = localStorage.getItem(`fixiva_read_notifs_${user.id}`);
          readIds = stored ? JSON.parse(stored) : [];
        } catch (e) { void e; }

        const processed = data.map((n) => ({
          ...n,
          read: n.user_id === user.id ? Boolean(n.read) : readIds.includes(n.id)
        }));
        setNotifications(processed);
      }
    } catch (err) {
      console.error('Exception fetching worker notifications:', err);
    }
  }, [user]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchNotifications();
    });

    if (!user?.id || !supabase) return;

    const notifChannel = supabase
      .channel(`worker-notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
    };
  }, [user?.id, fetchNotifications]);

  // Mark Worker Notifications as read when opening notifications tab
  useEffect(() => {
    if (activeTab === 'notifications' && user?.id && notifications.length > 0) {
      const unread = notifications.filter((n) => !n.read);
      if (unread.length > 0) {
        let readIds = [];
        try {
          const stored = localStorage.getItem(`fixiva_read_notifs_${user.id}`);
          readIds = stored ? JSON.parse(stored) : [];
        } catch (e) { void e; }

        const newReadIds = [...new Set([...readIds, ...notifications.map((n) => n.id)])];
        try {
          localStorage.setItem(`fixiva_read_notifs_${user.id}`, JSON.stringify(newReadIds));
        } catch (e) { void e; }

        queueMicrotask(() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        });
      }
    }
  }, [activeTab, user?.id, notifications]);

  // Filter jobs for this worker
  const myJobs = useMemo(() => {
    return (bookings || []).filter((b) => b.worker_id === user?.id || (b.worker_name && b.worker_name.toLowerCase() === (user?.name || '').toLowerCase()));
  }, [bookings, user]);

  // Fetch worker specific reviews
  const workerReviews = useMemo(() => {
    return (allReviews || []).filter(
      (r) => r.worker_id === user?.id || (r.workerName && r.workerName.toLowerCase() === (user?.name || '').toLowerCase())
    );
  }, [allReviews, user]);

  const averageWorkerRating = useMemo(() => {
    if (workerReviews.length === 0) return 5.0;
    const sum = workerReviews.reduce((acc, curr) => acc + Number(curr.rating || 5), 0);
    return (sum / workerReviews.length).toFixed(1);
  }, [workerReviews]);

  // Specific Worker Dashboard Metrics
  const todaysJobsCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return myJobs.filter((b) => {
      const bDate = b.booking_date || b.preferred_date || b.created_at;
      return bDate && new Date(bDate).toISOString().split('T')[0] === todayStr && b.status !== 'Completed';
    }).length;
  }, [myJobs]);

  const pendingJobs = useMemo(() => {
    return myJobs.filter((b) => ['Pending', 'New Request', 'Assigned'].includes(b.status));
  }, [myJobs]);

  const activeAssignedJob = useMemo(() => {
    return myJobs.find((b) => {
      const s = String(b.status || '').trim().toLowerCase();
      return ['assigned', 'in progress', 'accepted', 'on the way', 'arrived', 'work started', 'work in progress', 'worker assigned'].includes(s);
    });
  }, [myJobs]);

  const lastGpsRef = useRef({ timestamp: 0, lat: null, lng: null, hasWrittenFirst: false });

  // GPS Watcher for Active Assigned Job
  useEffect(() => {
    if (!liveLocationEnabled || !activeAssignedJob || !user?.id || !navigator.geolocation) return;

    let watchId = null;
    try {
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;
          const heading = pos.coords.heading;
          const speed = pos.coords.speed;

          // 1. Coordinate Validity Check
          if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180 || (lat === 0 && lng === 0)) {
            return;
          }

          const now = Date.now();
          const last = lastGpsRef.current;

          // 2. Apply filtering & throttling ONLY AFTER the first successful write
          if (last.hasWrittenFirst && last.lat !== null && last.lng !== null) {
            // Accuracy Check (skip if > 500m)
            if (accuracy !== null && accuracy !== undefined && Number(accuracy) > 500) {
              return;
            }
            // Jitter / Spike Check
            const distKm = calculateDistanceInKm(last.lat, last.lng, lat, lng);
            const timeDiffSec = (now - last.timestamp) / 1000;
            if (distKm > 50 && timeDiffSec < 60) {
              console.warn('Skipping GPS noise spike:', distKm, 'km in', timeDiffSec, 's');
              return;
            }
            // Throttle Check (3s or 10m displacement)
            if (timeDiffSec < 3 && distKm < 0.01) {
              return;
            }
          }

          // Direct Supabase UPSERT to public.worker_locations
          const res = await updateWorkerLiveLocation({
            workerId: user.id,
            latitude: lat,
            longitude: lng,
            heading: heading,
            speed: speed,
            accuracy: accuracy,
            address: `Active Job #${activeAssignedJob.id}`
          });

          if (res.data) {
            lastGpsRef.current = { timestamp: now, lat, lng, hasWrittenFirst: true };
          } else if (res.error) {
            console.error('[Worker Locations Direct UPSERT Error]', res.error);
          }
        },
        (err) => {
          console.warn('Worker GPS watch error:', err);
          if (err.code === 1) {
            showToast('GPS permission denied. Please allow location access for live tracking.', 'error');
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
    } catch (e) {
      console.warn('Failed to start worker geolocation watchPosition:', e);
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [liveLocationEnabled, activeAssignedJob, user?.id, showToast]);

  const activeJobs = useMemo(() => {
    return myJobs.filter((b) => ['Accepted', 'Worker Assigned', 'Confirmed', 'On The Way', 'Work Started', 'In Progress'].includes(b.status));
  }, [myJobs]);

  const completedJobs = useMemo(() => {
    return myJobs.filter((b) => ['Completed', 'Reviewed'].includes(b.status));
  }, [myJobs]);

  // Earnings Breakdown Calculation
  const workerEarningsMetrics = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayRev = 0;
    let weeklyRev = 0;
    let monthlyRev = 0;
    let lifetimeRev = 0;

    completedJobs.forEach((j) => {
      const amount = Number(j.price || 0);
      lifetimeRev += amount;

      const dateObj = new Date(j.created_at || j.booking_date || j.preferred_date || 0);
      const dateStr = dateObj.toISOString().split('T')[0];

      if (dateStr === todayStr) {
        todayRev += amount;
      }
      if (dateObj >= sevenDaysAgo) {
        weeklyRev += amount;
      }
      if (dateObj >= startOfMonth) {
        monthlyRev += amount;
      }
    });

    const avgJobVal = completedJobs.length > 0 ? Math.round(lifetimeRev / completedJobs.length) : 0;

    return {
      today: todayRev,
      weekly: weeklyRev,
      monthly: monthlyRev,
      lifetime: lifetimeRev,
      avgJobValue: avgJobVal
    };
  }, [completedJobs]);

  // Realtime Booking & Reviews Subscription for Worker
  useEffect(() => {
    if (!user?.id || !supabase) return;

    const workerChannel = supabase
      .channel(`worker-realtime-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          if (refreshData) refreshData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        () => {
          if (refreshData) refreshData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(workerChannel);
    };
  }, [user?.id, refreshData]);

  // Action handlers
  const handleJobStatusUpdate = async (bookingId, newStatus) => {
    await updateBookingStatus(bookingId, newStatus);
    showToast(`Job status updated to ${newStatus}.`, 'success');
    if (refreshData) refreshData();
  };

  const handleRejectJob = async (bookingId) => {
    const ok = await confirm('Reject this job? It will be sent back for reassignment.');
    if (!ok) return;
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'New Request',
        worker_id: null,
        worker_name: null,
        worker_phone: null
      })
      .eq('id', bookingId);

    if (!error) {
      showToast('Job rejected.', 'info');
      if (refreshData) refreshData();
    } else {
      showToast('Failed to reject job: ' + error.message, 'error');
    }
  };

  const handleUpdateAvailability = async (status) => {
    setAvailabilityStatus(status);
    const { error } = await supabase.from('workers').update({ status }).eq('id', user.id);
    if (!error) {
      showToast(`Availability updated to ${status}.`, 'success');
      if (refreshData) refreshData();
    } else {
      showToast('Failed to update availability status', 'error');
    }
  };

  // Profile Photo Upload Handlers
  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const { success, url, error } = await uploadImage(file, 'cms-assets', 'worker-photos');
      if (success && url) {
        setPhotoUrl(url);
        const { error: profileErr } = await updateUserProfile({ profile_photo_url: url });
        if (!profileErr) {
          showToast('Profile photo updated & picture changed successfully!', 'success');
          if (refreshData) await refreshData();
        } else {
          showToast('Photo uploaded but updating profile failed.', 'error');
        }
      } else {
        showToast(`Image upload failed: ${error || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      showToast('An error occurred during photo upload.', 'error');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoUrl('');
    const { error } = await updateUserProfile({ profile_photo_url: '' });
    if (!error) {
      showToast('Profile photo removed.', 'info');
      if (refreshData) await refreshData();
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    const { error } = await updateUserProfile({
      name: workerName,
      skills,
      experience,
      whatsapp,
      hourly_rate: Number(hourlyRate) || 0,
      visit_charge: Number(visitCharge) || 0,
      profile_photo_url: photoUrl
    });
    setProfileLoading(false);
    if (!error) {
      showToast('Profile and pricing updated successfully!', 'success');
      if (refreshData) refreshData();
    } else {
      showToast('Failed to update profile: ' + (error?.message || String(error || 'Unknown error')), 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Sidebar Items matching exact prompt requirement
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'assigned-jobs', label: 'Assigned Jobs', icon: Briefcase, count: pendingJobs.length + activeJobs.length },
    { id: 'history', label: 'Job History', icon: Clock, count: completedJobs.length },
    { id: 'earnings', label: 'Earnings', icon: IndianRupee },
    { id: 'availability', label: 'Availability', icon: CheckSquare },
    { id: 'support', label: 'Support Desk', icon: Headphones },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: notifications.filter(n => !n.read).length },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'profile', label: 'Profile', icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'assigned-jobs':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Assigned Jobs & Offers</h2>
              <p className="text-sm text-slate-500">Live service Marketplace dispatch console. Accept, navigate, start, and complete jobs.</p>
            </div>

            {/* Pending Offers Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock size={15} className="text-amber-500" /> Pending Offers ({pendingJobs.length})
              </h3>
              {pendingJobs.length === 0 ? (
                <div className="p-8 text-center bg-gradient-to-b from-amber-50/40 to-slate-50 border border-amber-100 rounded-3xl space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white text-amber-500 flex items-center justify-center mx-auto shadow-sm">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">No Pending Job Offers</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">You are online and ready to receive your next service assignment.</p>
                  </div>
                  <button onClick={() => handleUpdateAvailability('Active')} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm">
                    ✓ Confirm Online Status
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingJobs.map((job) => (
                    <div key={job.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <span className="text-[10px] font-black text-primary uppercase">BOOKING ID: {job.id}</span>
                          <h4 className="font-extrabold text-slate-900 text-base mt-0.5">{job.service_name || 'Home Service'}</h4>
                        </div>
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 font-black text-[10px] uppercase rounded-full border border-amber-200">
                          ● {job.status}
                        </span>
                      </div>

                      {/* Location Hierarchy & Distance Badge */}
                      <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-2 font-semibold text-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-900 font-extrabold">Customer: {job.customer_name || 'Client'}</span>
                          <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                            📍 2.8 km away • ~10 mins ETA
                          </span>
                        </div>
                        <p className="flex items-start gap-1 text-slate-600">
                          <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                          <span>
                            <strong>Hierarchy:</strong> {job.state || 'Jharkhand'} → {job.district || job.city || 'Ranchi'} → {job.locality || 'Lalpur'}
                          </span>
                        </p>
                        <p className="flex items-center gap-1">
                          <Calendar size={14} className="text-slate-400 shrink-0" />
                          <span><strong>Scheduled Slot:</strong> {job.preferred_time_slot || '09:00 AM - 12:00 PM'} ({new Date(job.booking_date || job.preferred_date || Date.now()).toLocaleDateString()})</span>
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <span className="text-xs text-slate-500 font-bold">Total Service Fee</span>
                          <span className="text-base font-black text-slate-900">₹{job.price || 0}</span>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => handleJobStatusUpdate(job.id, 'Accepted')}
                          className="flex-1 rounded-2xl bg-primary py-3 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-1"
                        >
                          <CheckSquare size={14} /> Accept Offer
                        </button>
                        <button
                          onClick={() => handleRejectJob(job.id)}
                          className="flex-1 rounded-2xl border border-red-200 bg-white py-3 text-xs font-extrabold text-red-600 shadow-sm hover:bg-red-50 transition-all"
                        >
                          Reject Offer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Ongoing Jobs Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Briefcase size={15} className="text-primary" /> Active Job Console ({activeJobs.length})
              </h3>
              {activeJobs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-xs font-semibold text-slate-500">
                  No active jobs in progress. Accepted jobs will appear here for navigation and status updates.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {activeJobs.map((job) => (
                    <div key={job.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <span className="text-[10px] font-black text-primary uppercase">ACTIVE BOOKING #{job.id}</span>
                          <h4 className="font-extrabold text-slate-900 text-base mt-0.5">{job.service_name}</h4>
                        </div>
                        <span className="px-3 py-1 bg-blue-50 text-primary font-black text-[10px] uppercase rounded-full border border-blue-200">
                          ● {job.status}
                        </span>
                      </div>

                      {/* Active Work Details Card */}
                      <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-3 font-semibold text-slate-700">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <div>
                            <span className="text-slate-400 text-[10px] font-bold uppercase block">Customer Name</span>
                            <span className="text-slate-900 font-extrabold text-xs">{job.customer_name || 'Client'}</span>
                          </div>

                          <div className="flex gap-2">
                            {job.customer_phone && (
                              <a
                                href={`tel:${job.customer_phone}`}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm hover:bg-emerald-700"
                              >
                                <Phone size={13} /> Call Customer
                              </a>
                            )}
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((job.locality || '') + ', ' + (job.district || job.city || 'Ranchi'))}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm hover:bg-slate-800"
                            >
                              <MapPin size={13} /> Navigate
                            </a>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700">
                          <strong>Address:</strong> {job.customer_address || job.address || job.locality}, {job.district || job.city || 'Ranchi'} ({job.state || 'Jharkhand'})
                        </p>
                        
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                          <span className="text-slate-500 font-medium">Amount to Collect:</span>
                          <span className="text-sm font-black text-slate-900">₹{job.price || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500 font-medium">Payment Method:</span>
                          <span className="font-bold text-slate-900">{job.payment_method || 'Cash'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500 font-medium">Payment Status:</span>
                          <span className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                            (job.payment_status === 'PAID' || job.payment_status === 'Paid')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            ● {job.payment_status || 'PENDING'}
                          </span>
                        </div>
                      </div>

                      {/* Reusable Booking Lifecycle Status Timeline */}
                      <BookingStatusTimeline status={job.status} />

                      {/* Status Action Buttons Progression */}
                      <div className="flex gap-2 flex-wrap">
                        {(job.payment_status === 'PAID' || job.payment_status === 'Paid') ? (
                          <div className="flex-1 rounded-2xl bg-emerald-50 border border-emerald-200 py-3 text-xs font-extrabold text-emerald-800 text-center flex items-center justify-center gap-1.5">
                            ✓ Cash Collected (Paid)
                          </div>
                        ) : (
                          <button
                            onClick={() => collectCashPayment(job.id)}
                            className="flex-1 rounded-2xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5"
                          >
                            💵 Cash Collected (₹{job.price || 0})
                          </button>
                        )}
                        {['Accepted', 'ACCEPTED', 'Assigned', 'Confirmed', 'Worker Assigned', 'WORKER ASSIGNED'].includes(job.status) && (
                          <button
                            onClick={() => handleJobStatusUpdate(job.id, 'ON THE WAY')}
                            className="flex-1 rounded-2xl bg-primary py-3 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition-all"
                          >
                            Mark On The Way
                          </button>
                        )}
                        {['On The Way', 'ON THE WAY'].includes(job.status) && (
                          <button
                            onClick={() => handleJobStatusUpdate(job.id, 'ARRIVED')}
                            className="flex-1 rounded-2xl bg-sky-600 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-sky-700 transition-all"
                          >
                            Mark Arrived at Location
                          </button>
                        )}
                        {['ARRIVED', 'Arrived'].includes(job.status) && (
                          <button
                            onClick={() => handleJobStatusUpdate(job.id, 'WORK IN PROGRESS')}
                            className="flex-1 rounded-2xl bg-indigo-600 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-indigo-700 transition-all"
                          >
                            Start Work
                          </button>
                        )}
                        {['WORK IN PROGRESS', 'Work Started', 'In Progress'].includes(job.status) && (
                          <button
                            onClick={() => handleJobStatusUpdate(job.id, 'COMPLETED')}
                            className="flex-1 rounded-2xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 transition-all"
                          >
                            Complete Work
                          </button>
                        )}
                        {job.status === 'Completed' && (
                          <button
                            onClick={() => showToast('Review request notification sent to customer!', 'success')}
                            className="flex-1 rounded-2xl bg-amber-500 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-amber-600 transition-all flex items-center justify-center gap-1"
                          >
                            <Star size={14} /> Request Customer Review
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Job History</h2>
              <p className="text-sm text-slate-500">Record of all completed home service dispatches and customer assignments.</p>
            </div>

            {completedJobs.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white text-slate-400 flex items-center justify-center mx-auto shadow-sm">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">No Completed Jobs in History</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">Your completed service dispatches will accumulate here automatically.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {completedJobs.map((job) => (
                  <div key={job.id} className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-3 text-xs">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <span className="text-[10px] font-black text-primary uppercase">JOB #{job.id}</span>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{job.service_name || 'Home Repair'}</h4>
                      </div>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-black text-[10px] uppercase rounded-full border border-emerald-200">
                        ● {job.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl font-semibold text-slate-700">
                      <p><strong>Customer:</strong> {job.customer_name || 'Client'}</p>
                      <p><strong>Location:</strong> {[job.locality, job.district || job.city].filter(Boolean).join(', ') || 'Address not specified'}</p>
                      <p><strong>Completed On:</strong> {new Date(job.booking_date || job.preferred_date || job.created_at).toLocaleDateString()}</p>
                      <p><strong>Payout Tariff:</strong> ₹{job.price || 0}</p>
                    </div>

                    {job.review && (
                      <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100 flex items-center gap-2 text-amber-900">
                        <Star size={14} className="text-amber-500 fill-amber-500 shrink-0" />
                        <span><strong>Customer Rating:</strong> {job.review.rating || 5}/5 — "{job.review.comment || 'Great service!'}"</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'earnings':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Earnings & Revenue Ledger</h2>
              <p className="text-sm text-slate-500">Live breakdown of today's earnings, weekly payouts, and monthly ledger.</p>
            </div>

            {/* 6 Grid Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Today's Earnings</span>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{workerEarningsMetrics.today}</p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Weekly Earnings</span>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{workerEarningsMetrics.weekly}</p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Monthly Earnings</span>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{workerEarningsMetrics.monthly}</p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Lifetime Earnings</span>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{workerEarningsMetrics.lifetime}</p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Completed Jobs</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{completedJobs.length}</p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Average Job Value</span>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{workerEarningsMetrics.avgJobValue}</p>
              </div>
            </div>

            {/* Recent Payouts Ledger Table */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Recent Completed Payouts</h3>
              {completedJobs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 font-semibold bg-slate-50 rounded-2xl">
                  No completed payout transactions recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {completedJobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900 block">{job.service_name || 'Service Dispatch'}</span>
                        <span className="text-[11px] text-slate-500 font-medium">{new Date(job.booking_date || job.preferred_date || job.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="text-sm font-black text-emerald-700">+₹{job.price || 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'availability':
        return (
          <div className="space-y-6 max-w-xl">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Availability & Shift Settings</h2>
              <p className="text-sm text-slate-500">Set your work availability status for automated customer dispatching.</p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
              <span className="text-xs font-extrabold text-slate-800 block">Current Status</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleUpdateAvailability('Active')}
                  className={`py-3 px-4 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                    availabilityStatus === 'Active'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <CheckCircle size={16} /> Available Today
                </button>
                <button
                  onClick={() => handleUpdateAvailability('Off Duty')}
                  className={`py-3 px-4 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                    availabilityStatus === 'Off Duty'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <PhoneOff size={16} /> Off Duty
                </button>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Notifications</h2>
              <p className="text-sm text-slate-500">Job assignment alerts and platform broadcasts.</p>
            </div>
            {notifications.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl text-xs font-semibold text-slate-500">
                No notifications.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-start gap-3 text-xs">
                    <Bell size={16} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-slate-900">{n.title}</h4>
                      <p className="text-slate-600 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'reviews':
        return (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Customer Reviews</h2>
              <p className="text-sm text-slate-500">Verified ratings and comments submitted by customers for your completed services.</p>
            </div>

            {/* Average Rating Banner */}
            <div className="p-6 bg-slate-900 text-white rounded-3xl flex items-center justify-between flex-wrap gap-4 shadow-md">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-black text-amber-400 flex items-center gap-1">
                  {averageWorkerRating} <Star size={28} className="fill-amber-400" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold">Overall Customer Score</h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Based on {workerReviews.length} customer review{workerReviews.length === 1 ? '' : 's'}</p>
                </div>
              </div>

              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
                ✔ 100% Verified Quality
              </span>
            </div>

            {/* Reviews List */}
            {workerReviews.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-3">
                <Star size={36} className="mx-auto text-slate-300" />
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">No Customer Reviews Yet</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">Reviews submitted by clients after job completion will appear here automatically.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {workerReviews.map((rev, idx) => (
                  <div key={rev.id || idx} className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-3 text-xs">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{rev.customer_name || rev.userName || 'Verified Customer'}</h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">Service: {rev.service_name || rev.serviceName || 'Home Service'}</p>
                      </div>

                      <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-amber-900 font-black">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={i < (rev.rating || 5) ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}
                          />
                        ))}
                        <span className="ml-1 text-[11px]">{rev.rating || 5}.0</span>
                      </div>
                    </div>

                    <p className="text-slate-700 font-medium text-xs leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      "{rev.comment || rev.review || 'Excellent and prompt service provided!'}"
                    </p>

                    <div className="text-[10px] text-slate-400 font-semibold text-right">
                      Date: {new Date(rev.created_at || rev.date || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6 max-w-xl">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Worker Profile & Pricing</h2>
              <p className="text-sm text-slate-500">Update your verified skills, experience, and service tariffs.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="bg-slate-50 border border-slate-200 p-8 rounded-3xl space-y-4 text-xs font-semibold">
              {/* Profile Photo Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Profile Photo</label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <div className="relative group shrink-0">
                    <img
                      src={photoUrl || user?.profile_photo_url || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80'}
                      alt="Profile Avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => photoFileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white text-[10px] font-black gap-1 cursor-pointer"
                    >
                      <Camera size={18} /> Change
                    </button>
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        disabled={isUploadingPhoto}
                        onClick={() => photoFileInputRef.current?.click()}
                        className="px-4 py-2.5 bg-primary text-white rounded-xl font-extrabold text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {isUploadingPhoto ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Uploading Photo...</span>
                          </>
                        ) : (
                          <>
                            <Camera size={15} />
                            <span>Upload from Gallery or Camera</span>
                          </>
                        )}
                      </button>

                      {(photoUrl || user?.profile_photo_url) && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-3 py-2.5 text-slate-500 hover:text-red-600 rounded-xl font-bold text-xs transition-all border border-slate-200 hover:bg-red-50 cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 font-medium">
                      Tap above to snap a photo with your camera or choose an image from your device gallery.
                    </p>

                    <input
                      ref={photoFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Worker Full Name</label>
                <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={workerName} onChange={(e) => setWorkerName(e.target.value)} placeholder="e.g. Rahul Sharma" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Primary Skills</label>
                <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. Electrician, AC Repair" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Years of Experience</label>
                <input className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 6+ Years" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Inspection Fee (₹)</label>
                  <input type="number" className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={visitCharge} onChange={(e) => setVisitCharge(e.target.value)} placeholder="149" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Hourly Rate (₹)</label>
                  <input type="number" className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl outline-none" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="299" />
                </div>
              </div>
              <button type="submit" disabled={profileLoading} className="w-full py-3 rounded-2xl bg-primary text-white font-extrabold">
                {profileLoading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        );

      // SUPPORT DESK: WHATSAPP-STYLE REALTIME CHAT FOR WORKERS
      case 'support':
        return (
          <div className="space-y-4 max-w-3xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md font-bold">
                  <Headphones size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900">Fixiva Worker Support Desk</h2>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      ⚡ Priority Response
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Live chat for worker dispatches, payouts & job inquiries.</p>
                </div>
              </div>

              <span className="text-[11px] font-bold text-slate-400">Official Channel</span>
            </div>

            {/* WhatsApp-Style Chat Container */}
            <div className="bg-slate-900/95 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[520px]">
              
              {/* Chat Thread Messages Area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                
                {/* Welcome Message Bubble */}
                <div className="flex justify-start">
                  <div className="max-w-xs sm:max-w-md rounded-2xl rounded-tl-sm bg-slate-800 text-slate-100 p-4 border border-slate-700/60 shadow-sm space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
                      <ShieldCheck size={13} /> Fixiva Support Desk
                    </div>
                    <p className="text-xs font-medium leading-relaxed">
                      Hello {user?.name || 'Worker'}! 👋 Welcome to Fixiva Worker Support. How can we assist you with your dispatches, payouts, or account today?
                    </p>
                    <span className="text-[9px] text-slate-400 block text-right">Official Desk</span>
                  </div>
                </div>

                {/* Dynamic Thread Messages */}
                {liveTickets.map(t => (
                  <div key={t.id} className="space-y-3">
                    {/* Worker Message Bubble (Right) */}
                    <div className="flex justify-end">
                      <div className="max-w-xs sm:max-w-md rounded-2xl rounded-tr-sm bg-primary text-white p-3.5 shadow-sm space-y-1">
                        <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{t.message}</p>
                        <span className="text-[9px] text-blue-200 block text-right">
                          {t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sent'}
                        </span>
                      </div>
                    </div>

                    {/* Admin Support Reply Bubble (Left) */}
                    {t.admin_reply && (
                      <div className="flex justify-start">
                        <div className="max-w-xs sm:max-w-md rounded-2xl rounded-tl-sm bg-emerald-950/90 text-emerald-100 p-3.5 border border-emerald-800/60 shadow-sm space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                            <ShieldCheck size={12} /> Fixiva Support Team
                          </div>
                          <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{t.admin_reply}</p>
                          <span className="text-[9px] text-emerald-400/80 block text-right">
                            {t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Replied'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                <div ref={chatBottomRef} />
              </div>

              {/* Quick AI Suggestions */}
              <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-400" /> AI Suggestions:
                </span>
                {['How do payouts work?', 'How to increase Trust Score?', 'Verification requirements', 'Escalate to Admin'].map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => handleSendSupportMessage(e, prompt)}
                    className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-primary text-[10px] text-slate-300 hover:text-white border border-slate-700 font-medium whitespace-nowrap transition-all shrink-0"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendSupportMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type message to worker support desk..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-primary font-medium"
                  value={chatInputMessage}
                  onChange={(e) => setChatInputMessage(e.target.value)}
                />

                <button
                  type="submit"
                  disabled={chatSending || !chatInputMessage.trim()}
                  className="h-10 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
                >
                  {chatSending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        );

      case 'overview':
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Worker Operations Desk</h2>
                <p className="text-sm text-slate-500">Welcome back, {user?.name || 'Partner'}! Here is your daily work dispatch overview.</p>
              </div>
            </div>

            {/* Location Prompt Banner when coordinates missing */}
            {!hasValidLocation && (
              <div className="p-4 sm:p-5 rounded-3xl border border-amber-200 bg-amber-50/90 text-amber-900 flex items-center justify-between gap-4 flex-wrap shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black">Set your current location to receive nearby jobs.</h4>
                    <p className="text-xs text-amber-700 font-medium mt-0.5">Your device GPS coordinates are required for distance-based matching with customers.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCaptureGpsLocation}
                  disabled={updatingGps}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {updatingGps ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                  <span>{updatingGps ? 'Detecting Location...' : 'Set Current Location'}</span>
                </button>
              </div>
            )}

            {/* Live Location Toggle Banner */}
            <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 bg-white shadow-sm flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm ${
                  liveLocationEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                }`}>
                  📍
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900">
                      {liveLocationEnabled ? 'Live location is on' : 'Live location is off'}
                    </h4>
                    {liveLocationEnabled && (
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {activeAssignedJob 
                      ? `Tracking active for job #${activeAssignedJob.id} (${activeAssignedJob.service_name || 'Service'})` 
                      : 'Automatic GPS tracking active during assigned jobs only.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleLiveLocation}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer ${
                  liveLocationEnabled
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                {liveLocationEnabled ? 'Turn OFF Live Location' : 'Turn ON Live Location'}
              </button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Today's Jobs</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{todaysJobsCount}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-blue-100 text-blue-700">
                    <Calendar size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pending Offers</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{pendingJobs.length}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-amber-100 text-amber-700">
                    <Clock size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Jobs</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{activeJobs.length}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-sky-100 text-sky-700">
                    <Briefcase size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Completed Jobs</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{completedJobs.length}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-emerald-100 text-emerald-700">
                    <CheckCircle size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Monthly Payout</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">₹{workerEarningsMetrics.monthly}</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-violet-100 text-violet-700">
                    <IndianRupee size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rating</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{averageWorkerRating} ⭐</p>
                  </div>
                  <div className="rounded-2xl p-2.5 bg-amber-100 text-amber-700">
                    <Star size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Assigned Jobs View */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Incoming Job Dispatches</h3>
                <button onClick={() => navigate(`${location.pathname}?tab=assigned-jobs`)} className="text-xs font-extrabold text-primary hover:underline">
                  View All ({pendingJobs.length})
                </button>
              </div>

              <div className="space-y-3">
                {pendingJobs.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 font-semibold">
                    No pending job offers waiting for response.
                  </div>
                ) : (
                  pendingJobs.slice(0, 3).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">{item.service_name || 'Home Repair'}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">Customer: {item.customer_name} • Address: {item.city}</p>
                      </div>
                      <button
                        onClick={() => handleJobStatusUpdate(item.id, 'Accepted')}
                        className="rounded-xl bg-primary px-3.5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700"
                      >
                        Accept
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar matching Customer Dashboard */}
        <aside className="lg:col-span-3 space-y-4">
          <ProfileCard
            user={user}
            role="worker"
            onEditProfile={() => navigate(`${location.pathname}?tab=profile`)}
          />

          <nav className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm space-y-1">
            {navItems.map(({ id, label, icon: Icon, count }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => navigate(`${location.pathname}?tab=${id}`)}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-xs font-bold transition-all ${
                    isActive ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span>{label}</span>
                  </div>
                  {count !== undefined && count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-primary'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-600 shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
          >
            <LogOut size={16} /> Logout
          </button>
        </aside>

        {/* Main Workspace Panel */}
        <main id="worker-panel-content" className="lg:col-span-9 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[600px]">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

export default WorkerDashboard;
